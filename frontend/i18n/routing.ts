import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/products": { en: "/products", zh: "/products" },
    "/about": { en: "/about", zh: "/about" },
    "/contact": { en: "/contact", zh: "/contact" },
    "/privacy": { en: "/privacy", zh: "/privacy" },
  },
});
