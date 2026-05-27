/**
 * next-sitemap 动态路径生成模块
 * 从 Saleor GraphQL API 拉取产品/分类 slug，生成多语言 sitemap 路径
 */

const SALEOR_API_URL =
  process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
const SALEOR_CHANNEL =
  process.env.NEXT_PUBLIC_SALEOR_CHANNEL || "default-channel";
const LOCALES = ["en", "zh"];

const SITEMAP_PRODUCTS_QUERY = `
query SitemapProducts {
  products(first: 1000, channel: "${SALEOR_CHANNEL}") {
    edges {
      node {
        slug
        updatedAt
      }
    }
  }
}
`;

const SITEMAP_CATEGORIES_QUERY = `
query SitemapCategories {
  categories(first: 1000) {
    edges {
      node {
        slug
        updatedAt
      }
    }
  }
}
`;

/**
 * 调用 Saleor GraphQL API
 */
async function saleorFetch(query) {
  const resp = await fetch(SALEOR_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    throw new Error(`Saleor API returned ${resp.status}`);
  }

  const { data, errors } = await resp.json();
  if (errors) {
    throw new Error(`Saleor GraphQL error: ${errors[0]?.message}`);
  }
  return data;
}

/**
 * 拉取所有产品 slug + updatedAt
 */
async function fetchProductSlugs() {
  try {
    const data = await saleorFetch(SITEMAP_PRODUCTS_QUERY);
    return data?.products?.edges?.map((e) => e.node) || [];
  } catch (err) {
    console.warn("Failed to fetch product slugs for sitemap:", err.message);
    return [];
  }
}

/**
 * 拉取所有分类 slug + updatedAt
 */
async function fetchCategorySlugs() {
  try {
    const data = await saleorFetch(SITEMAP_CATEGORIES_QUERY);
    return data?.categories?.edges?.map((e) => e.node) || [];
  } catch (err) {
    console.warn("Failed to fetch category slugs for sitemap:", err.message);
    return [];
  }
}

/**
 * 生成动态 sitemap 路径条目
 * @returns {Promise<Array<{loc: string, changefreq: string, priority: number, lastmod: string}>>}
 */
async function generateDynamicPaths() {
  const paths = [];

  const [products, categories] = await Promise.all([
    fetchProductSlugs(),
    fetchCategorySlugs(),
  ]);

  // 产品详情页
  for (const product of products) {
    for (const locale of LOCALES) {
      paths.push({
        loc: `/${locale}/products/${product.slug}`,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: product.updatedAt || new Date().toISOString(),
      });
    }
  }

  // 分类页
  for (const category of categories) {
    for (const locale of LOCALES) {
      paths.push({
        loc: `/${locale}/categories/${category.slug}`,
        changefreq: "weekly",
        priority: 0.7,
        lastmod: category.updatedAt || new Date().toISOString(),
      });
    }
  }

  return paths;
}

module.exports = {
  fetchProductSlugs,
  fetchCategorySlugs,
  generateDynamicPaths,
};
