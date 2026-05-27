import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { formatKzt } from "@/lib/pricing";
import { JoinGroupButton } from "./join-button";
import { ShareGroupButton } from "./share-button";
import "./group.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}): Promise<Metadata> {
  const { shareToken } = await params;
  const offer = await prisma.groupBuyOffer.findUnique({
    where: { shareToken },
    include: { product: true },
  });
  if (!offer) return { title: "Групповая закупка не найдена" };
  return {
    title: `Групповая закупка · ${offer.product.name}`,
    description: `Присоединяйтесь к закупке: оптовая цена ${formatKzt(Number(offer.groupPrice))} при наборе группы. До ${new Date(offer.deadlineAt).toLocaleString("ru-RU")}.`,
  };
}

const STATUS_LABEL: Record<string, { label: string; tone: "active" | "success" | "failed" | "neutral" }> = {
  OPEN: { label: "Идёт набор", tone: "active" },
  THRESHOLD_REACHED: { label: "Группа собрана", tone: "success" },
  CLOSED_SUCCESS: { label: "Закрыта · успех", tone: "success" },
  CLOSED_FAILED: { label: "Не собралась", tone: "failed" },
  CANCELLED: { label: "Отменена", tone: "neutral" },
};

export default async function GroupBuyPage({
  params,
}: {
  params: Promise<{ shareToken: string; locale: string }>;
}) {
  const { shareToken, locale } = await params;

  const offer = await prisma.groupBuyOffer.findUnique({
    where: { shareToken },
    include: {
      product: { include: { category: true } },
      participations: { include: { company: { select: { name: true } } } },
    },
  });
  if (!offer) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { supabaseId: user.id } })
    : null;
  const alreadyJoined = dbUser?.companyId
    ? offer.participations.some((p) => p.companyId === dbUser.companyId)
    : false;

  const solo = Number(offer.soloPrice);
  const group = Number(offer.groupPrice);
  const savings = Math.round(((solo - group) / solo) * 100);
  const progressPct = Math.min(100, Math.round((offer.currentQty / offer.targetQty) * 100));
  const participantsPct = offer.targetParticipants
    ? Math.min(100, Math.round((offer.currentParticipants / offer.targetParticipants) * 100))
    : null;
  const stillNeeded = Math.max(0, offer.targetQty - offer.currentQty);
  const statusMeta = STATUS_LABEL[offer.status] ?? { label: offer.status, tone: "neutral" as const };
  const deadlinePassed = new Date(offer.deadlineAt) < new Date();
  const canJoin = offer.status === "OPEN" && !deadlinePassed && !alreadyJoined;

  const shareUrl = `https://horecom.kz/${locale}/group/${offer.shareToken}`;

  return (
    <main className="container-x gb-page">
      <nav className="breadcrumb">
        <Link href="/">Главная</Link>
        <span className="sep">/</span>
        <Link href="/group-buying">Групповая закупка</Link>
        <span className="sep">/</span>
        <span className="curr">{offer.product.name}</span>
      </nav>

      <div className="gb-page-grid">
        <div className="gb-page-main">
          <div className={`gb-status gb-status-${statusMeta.tone}`}>{statusMeta.label}</div>
          <h1 className="gb-page-h1">{offer.product.name}</h1>
          <div className="gb-page-meta">
            {offer.product.brand && <span>{offer.product.brand}</span>}
            <span>·</span>
            <span>{offer.product.category.name}</span>
            <span>·</span>
            <span>{offer.product.packLabel}</span>
          </div>

          {offer.product.imageUrl && (
            <div className="gb-page-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={offer.product.imageUrl} alt={offer.product.name} />
            </div>
          )}

          <div className="gb-prices">
            <div className="gb-price-cell">
              <div className="lbl">Розничная</div>
              <div className="val strike tabular">{formatKzt(solo)}</div>
            </div>
            <div className="gb-price-cell hi">
              <div className="lbl">В группе</div>
              <div className="val tabular">{formatKzt(group)}</div>
              <div className="save">−{savings}%</div>
            </div>
          </div>

          <div className="gb-progress">
            <div className="gb-progress-head">
              <span>Прогресс группы</span>
              <span className="val tabular">
                {offer.currentQty} / {offer.targetQty} {offer.product.packLabel}
              </span>
            </div>
            <div className="gb-bar">
              <div className="fill" style={{ width: `${progressPct}%` }} />
            </div>
            {offer.targetParticipants ? (
              <div className="gb-progress-foot">
                <Users className="h-3.5 w-3.5" />
                <span>
                  Участников: <b>{offer.currentParticipants}</b> / {offer.targetParticipants}
                </span>
                {participantsPct != null && <span>· {participantsPct}%</span>}
              </div>
            ) : null}
            <div className="gb-progress-foot">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {deadlinePassed
                  ? "Дедлайн прошёл"
                  : `До ${new Date(offer.deadlineAt).toLocaleString("ru-RU")}`}
              </span>
            </div>
          </div>

          <div className="gb-actions">
            <JoinGroupButton
              offerId={offer.id}
              canJoin={canJoin}
              alreadyJoined={alreadyJoined}
              isAuthed={!!user}
              defaultQty={Math.max(1, Math.ceil(stillNeeded / Math.max(1, offer.targetParticipants ?? 4)))}
            />
            <ShareGroupButton url={shareUrl} productName={offer.product.name} groupPrice={group} />
          </div>

          {offer.participations.length > 0 && (
            <div className="gb-participants">
              <h3>Участники</h3>
              <ul className="ul-clean">
                {offer.participations.map((p) => (
                  <li key={p.id}>
                    <span className="company">{p.company.name}</span>
                    <span className="qty tabular">
                      × {p.reservedQty} {offer.product.packLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="gb-page-aside">
          <div className="gb-info-card">
            <h3>Как это работает</h3>
            <ol>
              <li>Присоединяетесь — указываете сколько ведёр / мешков заберёте.</li>
              <li>Делитесь ссылкой — закупка набирается участниками.</li>
              <li>Когда набирается порог — оптовая цена активируется для всех.</li>
              <li>Если не набралась к дедлайну — оплата не списывается.</li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}
