"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSelector({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as Locale;
    if (nextLocale === currentLocale) return;

    // Set cookie valid for 1 year
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    startTransition(() => {
      router.refresh();
    });
  };

  const current = LANGUAGES[currentLocale] ?? LANGUAGES.pt;

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="language-select" className="sr-only">
        Language
      </label>
      <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink shadow-2xs hover:bg-surface focus-within:ring-2 focus-within:ring-accent">
        <span className="text-sm" aria-hidden="true">
          {current.flag}
        </span>
        <select
          id="language-select"
          value={currentLocale}
          onChange={handleChange}
          disabled={isPending}
          className="cursor-pointer bg-transparent font-semibold uppercase tracking-wider text-ink focus:outline-hidden disabled:opacity-50"
          aria-label="Select language"
        >
          {LOCALES.map((loc) => {
            const info = LANGUAGES[loc];
            return (
              <option key={loc} value={loc} className="bg-bg text-ink">
                {info.flag} {info.nativeName} ({loc.toUpperCase()})
              </option>
            );
          })}
        </select>
        {isPending && (
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
        )}
      </div>
    </div>
  );
}
