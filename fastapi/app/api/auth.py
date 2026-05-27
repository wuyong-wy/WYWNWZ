"""管理员 JWT 认证 — 登录端点 + Token 验证依赖"""

import hmac
import threading
from datetime import datetime, timedelta, timezone

import jwt
import redis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(tags=["auth"])

ALGORITHM = "HS256"
security = HTTPBearer()

# Redis client for login rate limiting
_redis_client: redis.Redis | None = None
_redis_lock = threading.Lock()


def _get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        with _redis_lock:
            if _redis_client is None:
                _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def create_admin_token() -> str:
    """创建管理员 JWT Token"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ADMIN_JWT_EXPIRE_MINUTES
    )
    payload = {
        "sub": "admin",
        "role": "admin",
        "exp": expire,
    }
    return jwt.encode(payload, settings.ADMIN_JWT_SECRET, algorithm=ALGORITHM)


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI 依赖：验证管理员 JWT Token"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.ADMIN_JWT_SECRET,
            algorithms=[ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return payload


async def login_rate_limit(request: Request) -> None:
    """登录速率限制：5分钟内最多5次尝试"""
    client_ip = request.client.host if request.client else "unknown"
    r = _get_redis()
    key = f"login_rate_limit:{client_ip}"

    try:
        current = r.get(key)
        if current is not None and int(current) >= 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
            )
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 300)
        pipe.execute()
    except HTTPException:
        raise
    except Exception:
        # Redis unavailable — allow login but log warning
        import structlog
        structlog.get_logger().warning("redis_rate_limit_failed", key=key)


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    _limited: None = Depends(login_rate_limit),
) -> TokenResponse:
    """管理员登录 — 验证凭据并返回 JWT Token"""
    username_ok = hmac.compare_digest(body.username, settings.ADMIN_USERNAME)
    password_ok = hmac.compare_digest(body.password, settings.ADMIN_PASSWORD)

    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_admin_token()
    return TokenResponse(access_token=token)
