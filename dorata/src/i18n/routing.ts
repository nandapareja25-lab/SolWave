import { defineRouting } from "next-intl/routing";

// Español sin prefijo (dorata18k.com/cadenas/…). Para inglés: añadir "en" → dorata18k.com/en/…
export const routing = defineRouting({
  locales: ["es"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeDetection: false,
});
export type Locale = (typeof routing.locales)[number];
