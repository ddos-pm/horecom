import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createInvoice, verifyWebhookSignature } from "@/lib/kaspi";
import { createHmac } from "crypto";

const envBackup: Record<string, string | undefined> = {};
function setEnv(key: string, value: string | undefined) {
  if (!(key in envBackup)) envBackup[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
function restoreEnv() {
  for (const [k, v] of Object.entries(envBackup)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("createInvoice — stub mode", () => {
  beforeEach(() => {
    setEnv("KASPI_API_KEY", undefined);
    setEnv("KASPI_MERCHANT_ID", undefined);
  });
  afterEach(() => restoreEnv());

  it("returns a stub URL when credentials are missing", async () => {
    const r = await createInvoice({
      orderNumber: "HC-001",
      amount: 12345,
      returnUrl: "https://horecom.kz/orders/abc",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe("stub");
      expect(r.paymentUrl).toMatch(/kaspi\.example\.com\/stub\//);
      expect(r.invoiceId).toMatch(/^STUB-HC-001-/);
    }
  });
});

describe("createInvoice — live mode", () => {
  beforeEach(() => {
    setEnv("KASPI_API_KEY", "test-key");
    setEnv("KASPI_MERCHANT_ID", "test-merch");
    setEnv("KASPI_API_BASE", "https://kaspi.example.com/api");
  });
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
  });

  it("posts to the configured Kaspi endpoint and returns the parsed URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ paymentUrl: "https://kaspi.kz/p/inv_42", invoiceId: "inv_42" }),
    } as Response);

    const r = await createInvoice({
      orderNumber: "HC-002",
      amount: 30000,
      customerPhone: "+77001234567",
      returnUrl: "https://horecom.kz/orders/xyz",
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://kaspi.example.com/api/invoices");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer test-key",
      "content-type": "application/json",
    });

    const sentBody = JSON.parse((init?.body as string) ?? "{}");
    expect(sentBody).toMatchObject({
      merchantId: "test-merch",
      amount: 30000,
      externalRef: "HC-002",
      customerPhone: "+77001234567",
      currency: "KZT",
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe("live");
      expect(r.paymentUrl).toBe("https://kaspi.kz/p/inv_42");
      expect(r.invoiceId).toBe("inv_42");
    }
  });

  it("returns an error result when Kaspi responds non-2xx", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "upstream down",
    } as Response);

    const r = await createInvoice({
      orderNumber: "HC-003",
      amount: 5000,
      returnUrl: "https://horecom.kz/orders/3",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("kaspi_api_502");
  });

  it("returns an error when the payload is missing paymentUrl", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoiceId: "inv_x" }),
    } as Response);

    const r = await createInvoice({
      orderNumber: "HC-004",
      amount: 5000,
      returnUrl: "https://horecom.kz/orders/4",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("kaspi_invalid_response");
  });
});

describe("verifyWebhookSignature", () => {
  afterEach(() => restoreEnv());

  it("accepts in dev when no secret is configured", () => {
    setEnv("KASPI_WEBHOOK_SECRET", undefined);
    setEnv("NODE_ENV", "development");
    expect(verifyWebhookSignature('{"a":1}', "ignored")).toBe(true);
  });

  it("rejects in production when no secret is configured", () => {
    setEnv("KASPI_WEBHOOK_SECRET", undefined);
    setEnv("NODE_ENV", "production");
    expect(verifyWebhookSignature('{"a":1}', "ignored")).toBe(false);
  });

  it("accepts a correctly HMAC-SHA256-signed body", () => {
    const secret = "supersecret";
    setEnv("KASPI_WEBHOOK_SECRET", secret);
    setEnv("NODE_ENV", "production");
    const body = '{"externalRef":"HC-001","status":"PAID"}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const secret = "supersecret";
    setEnv("KASPI_WEBHOOK_SECRET", secret);
    setEnv("NODE_ENV", "production");
    const body = '{"externalRef":"HC-001","status":"PAID"}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body + "tampered", sig)).toBe(false);
  });

  it("rejects when signature header is missing", () => {
    setEnv("KASPI_WEBHOOK_SECRET", "supersecret");
    setEnv("NODE_ENV", "production");
    expect(verifyWebhookSignature('{"a":1}', null)).toBe(false);
  });

  it("rejects malformed hex signature", () => {
    setEnv("KASPI_WEBHOOK_SECRET", "supersecret");
    setEnv("NODE_ENV", "production");
    expect(verifyWebhookSignature('{"a":1}', "not-hex-at-all-xyz")).toBe(false);
  });
});
