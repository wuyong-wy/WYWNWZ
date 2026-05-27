"""认证服务测试 — 登录端点 + JWT Token 保护"""

import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.api.auth import create_admin_token, login_rate_limit
from app.config import settings
from app.main import app

# 测试凭据
TEST_USERNAME = "admin"
TEST_PASSWORD = "test_password_16chars!"


@pytest_asyncio.fixture
async def auth_client() -> AsyncClient:
    """带认证环境变量的测试客户端"""
    # 设置测试环境变量
    original_env = {}
    env_overrides = {
        "ADMIN_USERNAME": TEST_USERNAME,
        "ADMIN_PASSWORD": TEST_PASSWORD,
        "ADMIN_JWT_SECRET": "test_jwt_secret_at_least_32_chars!!",
        "DEBUG": "true",
    }
    for key, value in env_overrides.items():
        original_env[key] = os.environ.get(key)
        os.environ[key] = value

    # 重新加载 settings
    from app.config import Settings
    test_settings = Settings()
    # Patch the module-level settings
    import app.api.auth
    import app.config
    original_settings = app.config.settings
    app.config.settings = test_settings
    app.api.auth.settings = test_settings

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    # 恢复环境
    app.config.settings = original_settings
    app.api.auth.settings = original_settings
    for key, original_value in original_env.items():
        if original_value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = original_value


class TestLogin:
    """登录端点测试"""

    async def test_login_success(self, auth_client: AsyncClient):
        """有效凭据 → 200 + JWT Token"""
        resp = await auth_client.post(
            "/api/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_username(self, auth_client: AsyncClient):
        """无效用户名 → 401"""
        resp = await auth_client.post(
            "/api/auth/login",
            json={"username": "wrong_user", "password": TEST_PASSWORD},
        )
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid username or password"

    async def test_login_invalid_password(self, auth_client: AsyncClient):
        """无效密码 → 401"""
        resp = await auth_client.post(
            "/api/auth/login",
            json={"username": TEST_USERNAME, "password": "wrong_password"},
        )
        assert resp.status_code == 401

    async def test_login_empty_fields(self, auth_client: AsyncClient):
        """空字段 → 422 校验失败"""
        resp = await auth_client.post(
            "/api/auth/login",
            json={"username": "", "password": ""},
        )
        assert resp.status_code == 422


class TestJWTProtection:
    """JWT Token 保护测试"""

    async def test_no_token_returns_401(self, auth_client: AsyncClient):
        """无 Token 访问管理 API → 401"""
        resp = await auth_client.get("/api/inquiries")
        assert resp.status_code == 401

    async def test_valid_token_returns_200(self, auth_client: AsyncClient):
        """有效 Token 访问管理 API → 200"""
        # 先登录获取 token
        login_resp = await auth_client.post(
            "/api/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        )
        token = login_resp.json()["access_token"]

        resp = await auth_client.get(
            "/api/inquiries",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

    async def test_expired_token_returns_401(self, auth_client: AsyncClient):
        """过期 Token → 401"""
        import jwt as pyjwt
        from datetime import datetime, timedelta, timezone

        expired_token = pyjwt.encode(
            {
                "sub": "admin",
                "role": "admin",
                "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            },
            settings.ADMIN_JWT_SECRET,
            algorithm="HS256",
        )

        resp = await auth_client.get(
            "/api/inquiries",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401
        assert "expired" in resp.json()["detail"].lower()

    async def test_tampered_token_returns_401(self, auth_client: AsyncClient):
        """篡改 Token → 401"""
        token = create_admin_token()
        tampered = token[:-5] + "XXXXX"

        resp = await auth_client.get(
            "/api/inquiries",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert resp.status_code == 401


class TestConfigValidation:
    """配置校验测试"""

    def test_default_jwt_secret_rejected_in_production(self):
        """生产环境默认 JWT Secret → ValueError"""
        from pydantic_settings import BaseSettings, SettingsConfigDict

        # 模拟生产环境
        original_debug = os.environ.get("DEBUG")
        original_secret = os.environ.get("ADMIN_JWT_SECRET")
        os.environ["DEBUG"] = "false"
        os.environ.pop("ADMIN_JWT_SECRET", None)

        with pytest.raises(ValueError, match="ADMIN_JWT_SECRET"):
            from app.config import Settings
            Settings()

        # 恢复
        if original_debug:
            os.environ["DEBUG"] = original_debug
        else:
            os.environ.pop("DEBUG", None)
        if original_secret:
            os.environ["ADMIN_JWT_SECRET"] = original_secret
