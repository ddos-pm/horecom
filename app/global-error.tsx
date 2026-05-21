"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches React-render errors anywhere in the App Router so Sentry can
 * report them. Required by @sentry/nextjs to satisfy the
 * SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING check. Renders only
 * after a non-recoverable crash, so the markup is intentionally minimal
 * (no shared layout, no fonts — those may be the thing that broke).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          padding: 40,
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
          color: "#171717",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 480, margin: "80px auto" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Что-то пошло не так</h1>
          <p style={{ color: "#525252", marginBottom: 24 }}>
            Мы уже знаем об ошибке и работаем над ней. Попробуй обновить страницу
            или вернись на главную.
          </p>
          {error.digest && (
            <p style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 24 }}>
              ID ошибки: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 16px",
                background: "#0F766E",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Попробовать снова
            </button>
            <a
              href="/"
              style={{
                padding: "10px 16px",
                background: "#fff",
                color: "#171717",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              На главную
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
