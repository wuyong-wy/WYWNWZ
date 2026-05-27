const { generateDynamicPaths } = require("./lib/sitemap-paths");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://yourdomain.com",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*", "/dashboard/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
  },
  additionalPaths: async (config) => {
    const paths = [];

    // 静态页面路径
    for (const locale of ["en", "zh"]) {
      paths.push({
        loc: `/${locale}`,
        changefreq: "daily",
        priority: 1.0,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/products`,
        changefreq: "daily",
        priority: 0.9,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/about`,
        changefreq: "monthly",
        priority: 0.5,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/contact`,
        changefreq: "monthly",
        priority: 0.5,
        lastmod: new Date().toISOString(),
      });
      paths.push({
        loc: `/${locale}/privacy`,
        changefreq: "yearly",
        priority: 0.3,
        lastmod: new Date().toISOString(),
      });
    }

    // 动态路径（从 Saleor API 拉取产品/分类 slug）
    try {
      const dynamicPaths = await generateDynamicPaths();
      paths.push(...dynamicPaths);
    } catch (err) {
      console.warn("Failed to generate dynamic sitemap paths:", err.message);
    }

    return paths;
  },
};
