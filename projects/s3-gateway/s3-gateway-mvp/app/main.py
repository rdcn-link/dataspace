"""S3 Gateway MVP - FastAPI 主入口"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_database
from .mapping import MappingService
from .s3_server import create_router

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("s3-gateway")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"S3 Gateway MVP starting on {settings.host}:{settings.port}")
    logger.info(f"Bucket: {settings.bucket_name}")
    logger.info(f"Data root: {settings.data_root}")
    logger.info(f"Database: {settings.db_path}")
    logger.info(f"Auth enabled: {settings.enable_auth}")
    yield
    logger.info("S3 Gateway MVP shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="S3 Gateway MVP",
        description="只读 S3 协议数据访问服务",
        version="0.1.0",
        docs_url="/docs",
        redoc_url=None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET", "HEAD"],
        allow_headers=["*"],
    )

    init_database(settings.db_path)
    mapping_service = MappingService(settings)
    app.state.mapping_service = mapping_service

    s3_router = create_router(settings, mapping_service)
    app.include_router(s3_router)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
