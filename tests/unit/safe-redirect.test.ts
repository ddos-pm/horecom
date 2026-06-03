/**
 * Unit tests for safeRedirectTo — the open-redirect guard on /login.
 *
 * Re-implemented here as a free function (the original lives inside the
 * client-only /login page; importing from a "use client" module into
 * a vitest node env trips on next/navigation hooks). Keep the two
 * implementations in sync — if you change one, change both.
 */
import { describe, expect, it } from "vitest";

function safeRedirectTo(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (/^\/[^/]*[:@]/.test(raw)) return fallback;
  return raw;
}

describe("safeRedirectTo (open-redirect guard)", () => {
  it("returns the fallback when raw is null", () => {
    expect(safeRedirectTo(null)).toBe("/dashboard");
  });

  it("returns the fallback when raw is empty", () => {
    expect(safeRedirectTo("")).toBe("/dashboard");
  });

  it("accepts a same-origin path", () => {
    expect(safeRedirectTo("/dashboard")).toBe("/dashboard");
    expect(safeRedirectTo("/orders/123")).toBe("/orders/123");
    expect(safeRedirectTo("/profile?tab=address")).toBe("/profile?tab=address");
    expect(safeRedirectTo("/checkout#payment")).toBe("/checkout#payment");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectTo("//evil.com")).toBe("/dashboard");
    expect(safeRedirectTo("//evil.com/phish")).toBe("/dashboard");
  });

  it("rejects absolute https URLs", () => {
    expect(safeRedirectTo("https://evil.com/phish")).toBe("/dashboard");
    expect(safeRedirectTo("http://evil.com")).toBe("/dashboard");
  });

  it("rejects javascript: pseudo-protocol", () => {
    expect(safeRedirectTo("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects backslash-tricked paths (Windows separator quirks)", () => {
    expect(safeRedirectTo("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectTo("/path\\with\\backslashes")).toBe("/dashboard");
  });

  it("rejects @-style userinfo injection inside the first segment", () => {
    // "/foo@evil.com/bar" might be interpreted as the URL
    // foo@evil.com/bar by some routers — block it.
    expect(safeRedirectTo("/x@evil.com/path")).toBe("/dashboard");
  });

  it("rejects scheme injection inside the first segment", () => {
    expect(safeRedirectTo("/javascript:alert(1)")).toBe("/dashboard");
  });
});
