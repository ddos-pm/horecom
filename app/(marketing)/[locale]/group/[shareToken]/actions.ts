"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLocaleFromCookie } from "@/lib/locale-cookie";

async function getErrors() {
  const isEn = (await getLocaleFromCookie()) === "en";
  return {
    badQty: isEn ? "Enter a valid quantity" : "Укажите корректное количество",
    notAuth: isEn ? "Sign in to join" : "Войдите чтобы присоединиться",
    needOnboarding: isEn
      ? "Finish company onboarding first"
      : "Сначала завершите онбординг компании",
    offerNotFound: isEn ? "Group buy not found" : "Закупка не найдена",
    notAccepting: isEn
      ? "This group buy is no longer accepting participants"
      : "Эта закупка больше не принимает участников",
    deadlinePassed: isEn ? "Deadline passed" : "Дедлайн прошёл",
  };
}

/**
 * Join a group-buy offer. Adds a GroupBuyParticipation for the caller's
 * company with the requested quantity. Idempotent: if the company is
 * already a participant, returns existing record. If joining tips the
 * offer over the targetQty threshold, marks the offer THRESHOLD_REACHED
 * so a downstream job (admin or cron) can settle it.
 *
 * Out of scope for V1 fundament: payment-on-completion, auto-refund
 * on CLOSED_FAILED, fallbackMode handling. Those are V1.5 / V2.
 */
export async function joinGroupBuy(offerId: string, reservedQty: number) {
  const E = await getErrors();
  if (!Number.isFinite(reservedQty) || reservedQty < 1) {
    return { ok: false, error: E.badQty };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: E.notAuth };

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser?.companyId) {
    return { ok: false, error: E.needOnboarding };
  }

  const offer = await prisma.groupBuyOffer.findUnique({
    where: { id: offerId },
    include: { product: true },
  });
  if (!offer) return { ok: false, error: E.offerNotFound };

  if (offer.status !== "OPEN") {
    return { ok: false, error: E.notAccepting };
  }
  if (new Date(offer.deadlineAt) < new Date()) {
    return { ok: false, error: E.deadlinePassed };
  }

  // Idempotent — if the company is already in, return as-is.
  const existing = await prisma.groupBuyParticipation.findUnique({
    where: { groupBuyOfferId_companyId: { groupBuyOfferId: offerId, companyId: dbUser.companyId } },
  });
  if (existing) {
    revalidatePath(`/group/${offer.shareToken}`);
    return { ok: true, alreadyJoined: true as const };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.groupBuyParticipation.create({
      data: {
        groupBuyOfferId: offerId,
        companyId: dbUser.companyId!,
        reservedQty,
        status: "WAITING",
      },
    });

    const updated = await tx.groupBuyOffer.update({
      where: { id: offerId },
      data: {
        currentQty: { increment: reservedQty },
        currentParticipants: { increment: 1 },
      },
    });

    // Tip-over to THRESHOLD_REACHED — admin/cron settles into CLOSED_SUCCESS.
    const participantThresholdHit = updated.targetParticipants
      ? updated.currentParticipants >= updated.targetParticipants
      : true;
    if (updated.currentQty >= updated.targetQty && participantThresholdHit) {
      await tx.groupBuyOffer.update({
        where: { id: offerId },
        data: { status: "THRESHOLD_REACHED" },
      });
    }

    return updated;
  });

  revalidatePath(`/group/${result.shareToken}`);
  return { ok: true, alreadyJoined: false as const };
}
