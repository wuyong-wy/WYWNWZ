/**
 * Saleor GraphQL 客户端 — 使用 graphql-request
 */

import { GraphQLClient } from "graphql-request";

const SALEOR_API_URL =
  process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://localhost:8000/graphql/";
const SALEOR_CHANNEL = process.env.NEXT_PUBLIC_SALEOR_CHANNEL || "default-channel";

export const saleorClient = new GraphQLClient(SALEOR_API_URL, {
  headers: {
    "Accept-Language": "en",
  },
});

// === GraphQL 查询 ===

/** 产品公共字段 Fragment */
export const PRODUCT_FRAGMENT = `
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
    }
    seoTitle
    seoDescription
    translation(languageCode: EN) {
      name
      description
      seoTitle
      seoDescription
    }
  }
`;

/** 产品列表查询 */
export const PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
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
export const PRODUCT_DETAIL_QUERY = `
  ${PRODUCT_FRAGMENT}
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
          translation(languageCode: EN) {
            name
          }
        }
        values {
          name
          slug
        }
      }
      variants {
        id
        name
        attributes {
          attribute {
            name
          }
          values {
            name
          }
        }
      }
    }
  }
`;

/** 分类列表查询 */
export const CATEGORIES_QUERY = `
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
        }
      }
    }
  }
`;

/** 分类详情查询 */
export const CATEGORY_DETAIL_QUERY = `
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

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
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
}

export interface ProductDetail extends Product {
  media: { url: string; alt: string | null; type: string }[];
  attributes: {
    attribute: { name: string; slug: string };
    values: { name: string; slug: string }[];
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
}

// === 查询方法 ===

export async function getProducts(
  options: {
    first?: number;
    after?: string;
    categorySlug?: string;
    sortBy?: string;
    channel?: string;
  } = {}
): Promise<{ products: Product[]; hasNextPage: boolean; endCursor: string | null; totalCount: number }> {
  const {
    first = 20,
    after,
    categorySlug,
    sortBy,
    channel = SALEOR_CHANNEL,
  } = options;

  const filter = categorySlug
    ? { categories: [categorySlug] }
    : undefined;

  const data = await saleorClient.request(PRODUCTS_QUERY, {
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
  channel: string = SALEOR_CHANNEL
): Promise<ProductDetail | null> {
  try {
    const data = await saleorClient.request(PRODUCT_DETAIL_QUERY, { slug, channel });
    return data.product;
  } catch {
    return null;
  }
}

export async function getCategories(first: number = 50): Promise<Category[]> {
  const data = await saleorClient.request(CATEGORIES_QUERY, { first });
  return data.categories.edges.map((edge: { node: Category }) => edge.node);
}
