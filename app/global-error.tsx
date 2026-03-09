"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Global app error", error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="m-0 min-h-screen bg-[#f3f4f6] font-sans text-[#0f172a]">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              borderRadius: "16px",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              background: "#ffffff",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>
              Something went wrong
            </h1>
            <p style={{ margin: "12px 0 0", color: "#475569", lineHeight: 1.6 }}>
              A critical shell error occurred. Reload the app to restore the
              workspace.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "20px",
                borderRadius: "10px",
                border: "1px solid rgba(15, 23, 42, 0.12)",
                background: "#2563eb",
                color: "#ffffff",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              type="button"
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
