FROM python:3.12-slim

LABEL maintainer="s3-gateway-mvp"
LABEL description="只读 S3 协议数据访问服务 MVP"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ /app/app/
COPY config/ /app/config/
COPY entrypoint.sh /app/entrypoint.sh

RUN mkdir -p /app/data /data && chmod +x /app/entrypoint.sh

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
