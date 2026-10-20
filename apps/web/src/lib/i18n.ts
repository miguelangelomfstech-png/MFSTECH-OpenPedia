import { cookies, headers } from "next/headers";
import { dict, LOCALES, LANGUAGES, type Locale } from "./i18n-config";

export { dict, LOCALES, LANGUAGES, type Locale };

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value as Locale | undefined;
  if (c && c in dict) return c;
  const al = (await headers()).get("accept-language")?.slice(0, 2) as Locale | undefined;
  if (al && al in dict) return al;
  return "pt";
}

export async function getT() {
  const l = await getLocale();
  return (k: keyof (typeof dict)["en"]) => dict[l]?.[k] ?? dict.pt[k] ?? dict.en[k];
}
