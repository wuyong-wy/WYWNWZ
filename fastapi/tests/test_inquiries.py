"""询盘 API 端点测试"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_inquiry(client: AsyncClient):
    """测试提交询盘"""
    response = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "John Doe",
            "customer_email": "john@example.com",
            "customer_company": "Acme Corp",
            "quantity": "1000-5000 pcs",
            "message": "I'm interested in your product",
            "language": "en",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "inquiry_id" in data


@pytest.mark.asyncio
async def test_create_inquiry_with_product(client: AsyncClient):
    """测试从产品页提交询盘"""
    response = await client.post(
        "/api/inquiries/",
        json={
            "saleor_product_id": "UHJvZHVjdDox",
            "product_name": "LED Light",
            "customer_name": "Jane Smith",
            "customer_email": "jane@example.com",
            "message": "Please send me a quote",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_create_inquiry_validation_error(client: AsyncClient):
    """测试询盘校验失败"""
    # 缺少必填字段
    response = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "John",
            # 缺少 customer_email
        },
    )
    assert response.status_code == 422

    # 无效邮箱
    response = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "John",
            "customer_email": "invalid-email",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_inquiries(client: AsyncClient):
    """测试查询询盘列表"""
    # 先创建一条询盘
    await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "Test User",
            "customer_email": "test@example.com",
            "message": "Test inquiry",
        },
    )

    response = await client.get("/api/inquiries/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["data"]) >= 1
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_inquiries_with_status_filter(client: AsyncClient):
    """测试按状态筛选询盘"""
    response = await client.get("/api/inquiries/?status=new")
    assert response.status_code == 200
    data = response.json()
    for item in data["data"]:
        assert item["status"] == "new"


@pytest.mark.asyncio
async def test_get_inquiry_detail(client: AsyncClient):
    """测试查询询盘详情"""
    create_resp = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "Detail User",
            "customer_email": "detail@example.com",
            "message": "Detail test",
        },
    )
    inquiry_id = create_resp.json()["inquiry_id"]

    response = await client.get(f"/api/inquiries/{inquiry_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["customer_name"] == "Detail User"
    assert data["status"] == "new"


@pytest.mark.asyncio
async def test_get_inquiry_not_found(client: AsyncClient):
    """测试查询不存在的询盘"""
    response = await client.get("/api/inquiries/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_inquiry_status(client: AsyncClient):
    """测试更新询盘状态"""
    create_resp = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "Status User",
            "customer_email": "status@example.com",
            "message": "Status test",
        },
    )
    inquiry_id = create_resp.json()["inquiry_id"]

    response = await client.patch(
        f"/api/inquiries/{inquiry_id}/status",
        json={"status": "replied"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "replied"


@pytest.mark.asyncio
async def test_delete_inquiry(client: AsyncClient):
    """测试 GDPR 删除询盘"""
    create_resp = await client.post(
        "/api/inquiries/",
        json={
            "customer_name": "Delete User",
            "customer_email": "delete@example.com",
            "message": "Delete test",
        },
    )
    inquiry_id = create_resp.json()["inquiry_id"]

    response = await client.delete(f"/api/inquiries/{inquiry_id}")
    assert response.status_code == 204

    # 确认已删除
    response = await client.get(f"/api/inquiries/{inquiry_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """测试健康检查"""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
