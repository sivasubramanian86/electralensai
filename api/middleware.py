"""Middleware for ElectraLensAI API."""

from __future__ import annotations

from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to inject security headers into all responses."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable,
    ) -> Response:
        """Add security headers (CSP, HSTS, X-Frame-Options)."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com "
            "https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://storage.googleapis.com https://placehold.co "
            "https://fastapi.tiangolo.com; "
            "connect-src 'self' wss://*.cloudrun.app https://*.cloudrun.app "
            "https://generativelanguage.googleapis.com https://cdn.jsdelivr.net;"
        )
        response.headers["Content-Security-Policy"] = csp
        return response
