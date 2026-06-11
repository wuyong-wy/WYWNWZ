/**
 * Saleor GraphQL 客户端 — 使用 graphql-request
 * 支持动态 locale 多语言翻译
 */

import { GraphQLClient } from "graphql-request";

const SALEOR_API_URL =
  process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
const SALEOR_CHANNEL = process.env.NEXT_PUBLIC_SALEOR_CHANNEL || "default-channel";

/** locale → Saleor LanguageCodeEnum 映射 */
const LOCALE_TO_LANG_CODE: Record<string, string> = {
  en: "EN",
  zh: "ZH",
  es: "ES",
  ar: "AR",
  fr: "FR",
  de: "DE",
  ru: "RU",
  pt: "PT",
  ja: "JA",
  ko: "KO",
};

/** 合法语言代码白名单 */
const VALID_LANG_CODES = new Set(Object.values(LOCALE_TO_LANG_CODE));

function getLangCode(locale: string): string {
  const code = LOCALE_TO_LANG_CODE[locale] || "EN";
  if (!VALID_LANG_CODES.has(code)) {
    console.warn(`Invalid language code: ${code}, falling back to EN`);
    return "EN";
  }
  return code;
}

export const saleorClient = new GraphQLClient(SALEOR_API_URL);

// === GraphQL 查询（使用变量化的 languageCode）===

/** 产品公共字段 Fragment — 接受 $langCode 变量 */
export const PRODUCT_FRAGMENT = (langCode: string) => `
  fragment ProductFields on Product {
    id
    name
    slug
    description
    thumbnail {
      url
      alt
    }
    category {
      id
      name
      slug
      translation(languageCode: ${langCode}) {
        name
      }
    }
    seoTitle
    seoDescription
    translation(languageCode: ${langCode}) {
      name
      description
      seoTitle
      seoDescription
    }
  }
`;

/** 产品列表查询 */
export const PRODUCTS_QUERY = (langCode: string) => `
  ${PRODUCT_FRAGMENT(langCode)}
  query Products($first: Int!, $after: String, $filter: ProductFilterInput, $sortBy: ProductOrder, $channel: String!) {
    products(first: $first, after: $after, filter: $filter, sortBy: $sortBy, channel: $channel) {
      edges {
        node {
          ...ProductFields
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

/** 产品详情查询 */
export const PRODUCT_DETAIL_QUERY = (langCode: string) => `
  ${PRODUCT_FRAGMENT(langCode)}
  query ProductDetail($slug: String!, $channel: String!) {
    product(slug: $slug, channel: $channel) {
      ...ProductFields
      media {
        url
        alt
        type
      }
      attributes {
        attribute {
          name
          slug
          translation(languageCode: ${langCode}) {
            name
          }
        }
        values {
          name
          slug
          translation(languageCode: ${langCode}) {
            name
          }
        }
      }
      variants {
        id
        name
      }
    }
  }
`;

/** 分类列表查询 */
export const CATEGORIES_QUERY = (langCode: string) => `
  query Categories($first: Int!) {
    categories(first: $first) {
      edges {
        node {
          id
          name
          slug
          description
          backgroundImage {
            url
            alt
          }
          products(first: 1, channel: "${SALEOR_CHANNEL}") {
            totalCount
          }
          seoTitle
          seoDescription
          translation(languageCode: ${langCode}) {
            name
            description
            seoTitle
            seoDescription
          }
        }
      }
    }
  }
`;

/** 分类详情查询 */
export const CATEGORY_DETAIL_QUERY = (langCode: string) => `
  query CategoryDetail($slug: String!, $first: Int!, $after: String, $channel: String!) {
    category(slug: $slug) {
      id
      name
      slug
      description
      seoTitle
      seoDescription
      backgroundImage {
        url
        alt
      }
      translation(languageCode: ${langCode}) {
        name
        description
        seoTitle
        seoDescription
      }
      products(first: $first, after: $after, channel: $channel) {
        edges {
          node {
            id
            name
            slug
            thumbnail {
              url
              alt
            }
            translation(languageCode: ${langCode}) {
              name
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`;

// === 类型定义 ===

export interface ProductThumbnail {
  url: string;
  alt: string | null;
}

export interface ProductTranslation {
  name: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  [key: string]: string | null;
}

export interface CategoryTranslation {
  name: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  [key: string]: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  translation?: { name: string | null };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: ProductThumbnail | null;
  category: ProductCategory | null;
  seoTitle: string | null;
  seoDescription: string | null;
  translation?: ProductTranslation;
}

export interface ProductDetail extends Product {
  media: { url: string; alt: string | null; type: string }[];
  attributes: {
    attribute: { name: string; slug: string; translation?: { name: string | null } };
    values: { name: string; slug: string; translation?: { name: string | null } }[];
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  backgroundImage: ProductThumbnail | null;
  products: { totalCount: number };
  seoTitle: string | null;
  seoDescription: string | null;
  translation?: CategoryTranslation;
}

export interface CategoryDetail extends Omit<Category, "products"> {
  products: {
    edges: { node: Product }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    totalCount: number;
  };
}

// === 辅助函数：获取翻译值，回退到主语言 ===

type TransField = "name" | "description" | "seoTitle" | "seoDescription";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function t(item: any, field: TransField): string | null {
  const translation = item?.translation as Record<string, string | null> | null | undefined;
  return translation?.[field] ?? item?.[field] ?? null;
}

/** @deprecated 使用 t() 代替 */
export const tCategory = t;

// === 查询方法 ===

export async function getProducts(
  options: {
    first?: number;
    after?: string;
    categorySlug?: string;
    sortBy?: string;
    channel?: string;
    locale?: string;
  } = {}
): Promise<{ products: Product[]; hasNextPage: boolean; endCursor: string | null; totalCount: number }> {
  const {
    first = 20,
    after,
    categorySlug,
    sortBy,
    channel = SALEOR_CHANNEL,
    locale = "en",
  } = options;

  const langCode = getLangCode(locale);
  const filter = categorySlug ? { categories: [categorySlug] } : undefined;

  const data = await saleorClient.request(PRODUCTS_QUERY(langCode), {
    first,
    after,
    filter,
    sortBy: sortBy ? { field: sortBy, direction: "DESC" } : { field: "DATE", direction: "DESC" },
    channel,
  });

  return {
    products: data.products.edges.map((edge: { node: Product }) => edge.node),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
    totalCount: data.products.totalCount,
  };
}

export async function getProductBySlug(
  slug: string,
  options: { channel?: string; locale?: string } = {}
): Promise<ProductDetail | null> {
  const { channel = SALEOR_CHANNEL, locale = "en" } = options;
  const langCode = getLangCode(locale);
  try {
    const data = await saleorClient.request(PRODUCT_DETAIL_QUERY(langCode), { slug, channel });
    return data.product;
  } catch {
    return null;
  }
}

export async function getCategories(
  options: { first?: number; locale?: string } = {}
): Promise<Category[]> {
  const { first = 50, locale = "en" } = options;
  const langCode = getLangCode(locale);
  const data = await saleorClient.request(CATEGORIES_QUERY(langCode), { first });
  return data.categories.edges.map((edge: { node: Category }) => edge.node);
}

export async function getCategoryBySlug(
  slug: string,
  options: { first?: number; after?: string; channel?: string; locale?: string } = {}
): Promise<CategoryDetail | null> {
  const { first = 20, after, channel = SALEOR_CHANNEL, locale = "en" } = options;
  const langCode = getLangCode(locale);
  try {
    const data = await saleorClient.request(CATEGORY_DETAIL_QUERY(langCode), { slug, first, after, channel });
    return data.category;
  } catch {
    return null;
  }
}
