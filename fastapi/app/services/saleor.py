"""Saleor GraphQL 客户端 — 查询产品信息"""

import structlog
from gql import Client, gql
from gql.transport.httpx import HTTPXAsyncTransport

from app.config import settings

logger = structlog.get_logger()

# GraphQL 查询：获取产品基本信息
GET_PRODUCT_INFO = gql("""
query GetProductInfo($id: ID!) {
  product(id: $id, channel: "default-channel") {
    id
    name
    slug
    thumbnail {
      url
    }
    category {
      name
    }
  }
}
""")

_transport = HTTPXAsyncTransport(url=settings.SALEOR_GRAPHQL_URL)
_client = Client(transport=_transport, fetch_schema_from_transport=False)


async def get_product_info(product_id: str) -> dict | None:
    """
    通过 Saleor GraphQL API 查询产品信息

    Args:
        product_id: Saleor 产品的 GraphQL ID

    Returns:
        产品信息字典，包含 name, slug, thumbnail_url, category_name
        查询失败返回 None
    """
    try:
        async with _client as session:
            result = await session.execute(
                GET_PRODUCT_INFO,
                variable_values={"id": product_id},
            )
            product = result.get("product")
            if not product:
                return None

            return {
                "name": product.get("name", ""),
                "slug": product.get("slug", ""),
                "thumbnail_url": product.get("thumbnail", {}).get("url", ""),
                "category_name": product.get("category", {}).get("name", ""),
            }
    except Exception as e:
        logger.error("saleor_query_error", product_id=product_id, error=str(e))
        return None
