import { cookies, headers } from "next/headers";

const dict = {
  en: {
    search: "Search", searchPlaceholder: "Search the encyclopedia", recent: "Recent changes", upload: "Upload",
    login: "Log in", register: "Create account", logout: "Log out", article: "Article", talk: "Talk",
    edit: "Edit", history: "History", watch: "Watch", unwatch: "Unwatch", skip: "Skip to content",
    featured: "Featured article", random: "Random article", watchlist: "Watchlist",
  },
  es: {
    search: "Buscar", searchPlaceholder: "Buscar en la enciclopedia", recent: "Cambios recientes", upload: "Subir",
    login: "Acceder", register: "Crear cuenta", logout: "Salir", article: "Artículo", talk: "Discusión",
    edit: "Editar", history: "Historial", watch: "Seguir", unwatch: "Dejar de seguir", skip: "Saltar al contenido",
    featured: "Artículo destacado", random: "Artículo aleatorio", watchlist: "Seguimiento",
  },
} as const;

export type Locale = keyof typeof dict;
export const LOCALES = Object.keys(dict) as Locale[];

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("locale")?.value as Locale | undefined;
  if (c && c in dict) return c;
  const al = (await headers()).get("accept-language")?.slice(0, 2) as Locale | undefined;
  return al && al in dict ? al : "en";
}

export async function getT() {
  const l = await getLocale();
  return (k: keyof (typeof dict)["en"]) => dict[l][k] ?? dict.en[k];
}
