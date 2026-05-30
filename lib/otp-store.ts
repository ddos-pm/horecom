/**
 * Short-lived OTP challenge store.
 *
 * Used by /api/auth/otp/{request,verify}. Keys are SHA-256 hashed phone
 * numbers so the raw phone never lands in Redis (or memory) — even an
 * Upstash log leak doesn't expose the customer list.
 *
 * Backend selection:
 *   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set → Redis with
 *     5-minute TTL, survives serverless cold starts, handles concurrent
 *     verify attempts cleanly across instances.
 *   - Else → in-process Map. Works fine in `npm run dev` and Vercel
 *     preview single-instance deploys, but NOT safe for production
 *     (different lambda invocations won't share state). We warn at first
 *     use.
 *
 * Each challenge stores:
 *   - codeHash: bcrypt-style sha256(salt+code) — never the raw code
 *   - createdAt: for TTL fallback
 *   - attempts: increment on every verify; lock after 5
 */

import { createHash, randomBytes } from "crypto";
import { Redis } from "@upstash/redis";

const TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

type Challenge = {
  codeHash: string;
  salt: string;
  attempts: number;
  createdAt: number;
};

let warnedInMemory = false;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const memory = new Map<string, Challenge>();

function ensureWarn() {
  if (!warnedInMemory) {
    console.warn(
      "[otp-store] using in-memory backend — single-instance only. Set UPSTASH_REDIS_REST_URL / _TOKEN for production.",
    );
    warnedInMemory = true;
  }
}

function hashPhone(phone: string): string {
  return createHash("sha256").update(phone.replace(/^\+/, "")).digest("hex");
}

function hashCode(salt: string, code: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

/**
 * Generate a 6-digit OTP code, store its hash under the phone key, and
 * return the raw code so the caller can send it via WhatsApp.
 *
 * Overwrites any existing challenge for the same phone — the previous
 * code becomes invalid as soon as a new one is requested (standard OTP
 * behaviour, prevents reuse if the user requests multiple codes).
 */
export async function issueOtp(phone: string): Promise<{ code: string }> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const salt = randomBytes(16).toString("hex");
  const challenge: Challenge = {
    codeHash: hashCode(salt, code),
    salt,
    attempts: 0,
    createdAt: Date.now(),
  };
  const key = hashPhone(phone);

  const redis = getRedis();
  if (redis) {
    await redis.set(`otp:${key}`, JSON.stringify(challenge), { ex: TTL_SECONDS });
  } else {
    ensureWarn();
    memory.set(key, challenge);
    // GC: drop the entry after TTL.
    setTimeout(() => {
      const cur = memory.get(key);
      if (cur && cur.createdAt === challenge.createdAt) memory.delete(key);
    }, TTL_SECONDS * 1000);
  }

  return { code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "wrong_code" | "locked" };

/**
 * Verify a phone+code pair. Atomic-ish: increments attempts and locks
 * after MAX_ATTEMPTS. On success the challenge is deleted so the same
 * code can't be replayed.
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  const key = hashPhone(phone);
  const redis = getRedis();
  let challenge: Challenge | undefined;

  if (redis) {
    const raw = await redis.get<string>(`otp:${key}`);
    if (raw) challenge = typeof raw === "string" ? JSON.parse(raw) : (raw as Challenge);
  } else {
    challenge = memory.get(key);
  }

  if (!challenge) return { ok: false, reason: "not_found" };

  // Soft TTL check (the Redis backend has hard TTL too; memory backend
  // relies on this).
  if (Date.now() - challenge.createdAt > TTL_SECONDS * 1000) {
    if (redis) await redis.del(`otp:${key}`);
    else memory.delete(key);
    return { ok: false, reason: "expired" };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "locked" };
  }

  const candidate = hashCode(challenge.salt, code);
  if (candidate !== challenge.codeHash) {
    challenge.attempts++;
    if (redis) {
      const remaining = Math.max(
        1,
        TTL_SECONDS - Math.floor((Date.now() - challenge.createdAt) / 1000),
      );
      await redis.set(`otp:${key}`, JSON.stringify(challenge), { ex: remaining });
    } else {
      memory.set(key, challenge);
    }
    return { ok: false, reason: "wrong_code" };
  }

  // Success — burn the challenge so the code can't be replayed.
  if (redis) await redis.del(`otp:${key}`);
  else memory.delete(key);
  return { ok: true };
}
