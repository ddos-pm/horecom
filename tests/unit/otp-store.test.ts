import { describe, expect, it, beforeEach } from "vitest";
import { issueOtp, verifyOtp } from "@/lib/otp-store";

// These tests run against the in-memory backend (Upstash creds aren't set
// in the test env). That's fine — we're testing the contract, not the
// transport.

describe("otp-store", () => {
  beforeEach(() => {
    // Ensure isolation between tests by using a unique phone each time.
  });

  it("issues a 6-digit code and verifies it on the first attempt", async () => {
    const phone = "+77001110000";
    const { code } = await issueOtp(phone);
    expect(code).toMatch(/^\d{6}$/);
    const r = await verifyOtp(phone, code);
    expect(r.ok).toBe(true);
  });

  it("burns the challenge after a successful verify (no replay)", async () => {
    const phone = "+77001110001";
    const { code } = await issueOtp(phone);
    expect((await verifyOtp(phone, code)).ok).toBe(true);
    const replay = await verifyOtp(phone, code);
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.reason).toBe("not_found");
  });

  it("rejects a wrong code without burning the challenge", async () => {
    const phone = "+77001110002";
    const { code } = await issueOtp(phone);
    const bad = await verifyOtp(phone, "000000");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("wrong_code");
    // Right code still works.
    const good = await verifyOtp(phone, code);
    expect(good.ok).toBe(true);
  });

  it("locks after 5 failed attempts", async () => {
    const phone = "+77001110003";
    await issueOtp(phone);
    for (let i = 0; i < 5; i++) {
      const r = await verifyOtp(phone, "000000");
      expect(r.ok).toBe(false);
    }
    const r = await verifyOtp(phone, "000000");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("locked");
  });

  it("returns not_found when no challenge has been issued", async () => {
    const r = await verifyOtp("+77009990000", "123456");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_found");
  });

  it("issuing a fresh code invalidates the previous one", async () => {
    const phone = "+77001110004";
    const first = await issueOtp(phone);
    await issueOtp(phone);
    const r = await verifyOtp(phone, first.code);
    expect(r.ok).toBe(false);
    // Old code is treated as wrong (still has the new challenge in store).
    if (!r.ok) expect(["wrong_code", "not_found"]).toContain(r.reason);
  });
});
