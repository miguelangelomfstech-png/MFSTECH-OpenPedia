"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dict, type Locale } from "@/lib/i18n-config";

export function GdprConsent({ currentLocale = "pt" }: { currentLocale?: Locale }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem("mfstech_gdpr_consent");
      if (!consent) {
        // Small delay for natural entrance animation
        const timer = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may fail in strict private mode
    }
  }, []);

  function handleConsent(choice: "all" | "essential") {
    try {
      localStorage.setItem("mfstech_gdpr_consent", JSON.stringify({ choice, timestamp: new Date().toISOString() }));
      document.cookie = `mfstech_gdpr_consent=${choice}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore storage error
    }
    setVisible(false);
  }

  if (!mounted || !visible) return null;

  const t = dict[currentLocale] ?? dict.en;

  return (
    <div
      role="region"
      aria-label={t.gdprTitle}
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="card border-accent/40 bg-bg/95 p-5 shadow-2xl backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 pr-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-accent" />
              <h2 className="text-base font-bold tracking-tight text-ink">
                {t.gdprTitle}
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-muted sm:text-sm">
              {t.gdprDescription}{" "}
              <Link href="/privacy" className="text-accent underline font-medium hover:opacity-80">
                {t.gdprLearnMore}
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            <button
              type="button"
              id="gdpr-essential-btn"
              onClick={() => handleConsent("essential")}
              className="btn text-xs sm:text-sm"
            >
              {t.gdprEssential}
            </button>
            <button
              type="button"
              id="gdpr-accept-all-btn"
              onClick={() => handleConsent("all")}
              className="btn btn-primary text-xs sm:text-sm"
            >
              {t.gdprAccept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
