"""S3 API 路由模块 - 实现标准 S3 REST API 端点"""

import base64
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from xml.sax.saxutils import escape as xml_escape

from fastapi import APIRouter, Request, Response
from fastapi.responses import PlainTextResponse, StreamingResponse

from .auth import AuthError, check_auth
from .config import Settings
from .database import list_all_buckets
from .mapping import MappingError, MappingService
from .models import S3Error
from .utils import (
    compute_etag,
    format_http_time,
    format_s3_time,
    generate_request_id,
    get_content_type,
    get_file_size,
    get_last_modified,
    is_path_traversal,
    parse_range_header,
)

logger = logging.getLogger(__name__)

READONLY_METHODS = {"PUT", "POST", "DELETE", "COPY"}


def create_router(settings: Settings, mapping_service: MappingService) -> APIRouter:
    router = APIRouter()

    # ------------------------------------------------------------------
    # 工具函数
    # ------------------------------------------------------------------

    def build_error_xml(error: S3Error) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f"<Error>"
            f"<Code>{xml_escape(error.code)}</Code>"
            f"<Message>{xml_escape(error.message)}</Message>"
            f"<Resource>{xml_escape(error.resource)}</Resource>"
            f"<RequestId>{xml_escape(error.request_id)}</RequestId>"
            f"</Error>"
        )

    def make_error_response(
        code: str,
        message: str,
        request: Request,
        http_status: int,
    ) -> Response:
        request_id = generate_request_id()
        resource = request.url.path
        error = S3Error(
            code=code,
            message=message,
            resource=resource,
            request_id=request_id,
            http_status=http_status,
        )
        xml_body = build_error_xml(error)
        return Response(
            content=xml_body,
            status_code=http_status,
            media_type="application/xml",
            headers={"x-amz-request-id": request_id},
        )

    def get_headers_dict(request: Request) -> dict:
        return {k.lower(): v for k, v in request.headers.items()}

    def log_request(
        request: Request,
        access_key: str,
        bucket: str,
        object_key: str,
        status: int,
        file_size: int = 0,
        response_time_ms: int = 0,
    ) -> None:
        logger.info(
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} "
            f"method={request.method} "
            f"access_key={access_key} "
            f"bucket={bucket} "
            f"key={object_key} "
            f"status={status} "
            f"size={file_size} "
            f"rt={response_time_ms}ms "
            f"ip={request.client.host if request.client else '-'}"
        )

    def decode_continuation_token(token: Optional[str]) -> Optional[str]:
        if not token:
            return None
        try:
            return base64.b64decode(token.encode()).decode()
        except Exception:
            return None

    def encode_continuation_token(key: str) -> str:
        return base64.b64encode(key.encode()).decode()

    def parse_bucket_key(path: str) -> tuple[Optional[str], Optional[str]]:
        path = path.lstrip("/")
        if not path:
            return None, None
        if "/" not in path:
            return path, None
        bucket, key = path.split("/", 1)
        return bucket, key

    # ------------------------------------------------------------------
    # 健康检查
    # ------------------------------------------------------------------

    @router.get("/health")
    async def health():
        return {"status": "ok", "service": "s3-gateway", "version": "0.1.0"}

    # ------------------------------------------------------------------
    # 只读拦截
    # ------------------------------------------------------------------

    @router.api_route(
        "/{path:path}",
        methods=["PUT", "POST", "DELETE", "COPY", "PATCH"],
    )
    async def readonly_block(path: str, request: Request):
        return make_error_response(
            "MethodNotAllowed",
            "The specified method is not allowed against this resource. S3 Gateway is READ ONLY.",
            request,
            405,
        )

    # ------------------------------------------------------------------
    # ListBuckets - GET /
    # ------------------------------------------------------------------

    @router.get("/")
    async def list_buckets(request: Request):
        start_time = time.time()
        headers = get_headers_dict(request)
        try:
            access_key = check_auth(
                settings,
                "GET",
                "/",
                str(request.url.query),
                headers,
            )
        except AuthError as e:
            resp = make_error_response(e.code, e.message, request, 403)
            log_request(request, "-", "-", "-", 403)
            return resp

        buckets = list_all_buckets(settings.db_path)
        if settings.bucket_name not in buckets:
            buckets.append(settings.bucket_name)
        buckets = sorted(set(buckets))

        now = datetime.now(timezone.utc)
        bucket_xml = ""
        for b in buckets:
            bucket_xml += (
                f"<Bucket>"
                f"<Name>{xml_escape(b)}</Name>"
                f"<CreationDate>{format_s3_time(now)}</CreationDate>"
                f"</Bucket>"
            )

        xml_body = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f"<ListAllMyBucketsResult>"
            f"<Owner>"
            f"<ID>{xml_escape(settings.owner_id)}</ID>"
            f"<DisplayName>{xml_escape(settings.owner_display_name)}</DisplayName>"
            f"</Owner>"
            f"<Buckets>{bucket_xml}</Buckets>"
            f"</ListAllMyBucketsResult>"
        )

        rt = int((time.time() - start_time) * 1000)
        log_request(request, access_key, "-", "-", 200, response_time_ms=rt)
        return Response(
            content=xml_body,
            status_code=200,
            media_type="application/xml",
            headers={"x-amz-request-id": generate_request_id()},
        )

    # ------------------------------------------------------------------
    # HeadBucket - HEAD /{bucket}
    # ------------------------------------------------------------------

    @router.head("/{bucket}")
    async def head_bucket(bucket: str, request: Request):
        start_time = time.time()
        headers = get_headers_dict(request)
        try:
            access_key = check_auth(
                settings,
                "HEAD",
                f"/{bucket}",
                str(request.url.query),
                headers,
            )
        except AuthError as e:
            resp = make_error_response(e.code, e.message, request, 403)
            log_request(request, "-", bucket, "-", 403)
            return resp

        if is_path_traversal(bucket):
            return make_error_response("InvalidBucketName", "Invalid bucket name", request, 400)

        buckets = list_all_buckets(settings.db_path)
        if bucket != settings.bucket_name and bucket not in buckets:
            return make_error_response(
                "NoSuchBucket", "The specified bucket does not exist", request, 404
            )

        rt = int((time.time() - start_time) * 1000)
        log_request(request, access_key, bucket, "-", 200, response_time_ms=rt)
        return Response(
            status_code=200,
            headers={
                "x-amz-request-id": generate_request_id(),
                "Content-Length": "0",
            },
        )

    # ------------------------------------------------------------------
    # ListObjectsV2 / ListObjects - GET /{bucket}
    # ------------------------------------------------------------------

    @router.get("/{bucket}")
    async def list_objects(bucket: str, request: Request):
        start_time = time.time()
        headers = get_headers_dict(request)
        try:
            access_key = check_auth(
                settings,
                "GET",
                f"/{bucket}",
                str(request.url.query),
                headers,
            )
        except AuthError as e:
            resp = make_error_response(e.code, e.message, request, 403)
            log_request(request, "-", bucket, "-", 403)
            return resp

        if is_path_traversal(bucket):
            return make_error_response("InvalidBucketName", "Invalid bucket name", request, 400)

        query_params = dict(request.query_params)
        list_type = query_params.get("list-type", "2")
        prefix = query_params.get("prefix", "")
        delimiter = query_params.get("delimiter", "")
        max_keys_str = query_params.get("max-keys", str(settings.max_keys))
        try:
            max_keys = min(int(max_keys_str), settings.max_keys)
        except ValueError:
            max_keys = settings.max_keys

        continuation_token = query_params.get("continuation-token")
        start_after = query_params.get("start-after")
        marker = query_params.get("marker")

        start_key = None
        if list_type == "2":
            if continuation_token:
                start_key = decode_continuation_token(continuation_token)
            elif start_after:
                start_key = start_after
        else:
            if marker:
                start_key = marker

        # ------------------------------------------------------------------
        # 取数 + delimiter 折叠（CommonPrefixes）
        # S3 语义：带 delimiter 时，prefix 之后含 delimiter 的 key 折叠为
        # 一个 CommonPrefix（即"目录"），不进入 Contents；KeyCount 包含两者。
        # ------------------------------------------------------------------
        contents: list = []
        common_prefixes: list[str] = []
        seen_prefixes: set[str] = set()
        truncated = False
        next_start = start_key

        while len(contents) + len(common_prefixes) < max_keys:
            mappings, page_truncated = mapping_service.list_objects(
                bucket, prefix=prefix, max_keys=settings.max_keys, start_after=next_start
            )
            if not mappings:
                break
            for m in mappings:
                key = m.object_key
                next_start = key
                if key == prefix:
                    continue
                if delimiter:
                    rel = key[len(prefix):]
                    idx = rel.find(delimiter)
                    if idx != -1:
                        cp = prefix + rel[: idx + len(delimiter)]
                        if cp not in seen_prefixes:
                            seen_prefixes.add(cp)
                            if len(contents) + len(common_prefixes) >= max_keys:
                                truncated = True
                                break
                            common_prefixes.append(cp)
                        continue
                if len(contents) + len(common_prefixes) >= max_keys:
                    truncated = True
                    break
                contents.append(m)
            if not page_truncated:
                break
        else:
            # 已凑满 max_keys，向后多探测一条，确认是否还有剩余 key
            more, _ = mapping_service.list_objects(
                bucket, prefix=prefix, max_keys=1, start_after=next_start
            )
            if more:
                truncated = True

        # 按字典序合并 Contents 与 CommonPrefixes（对齐真实 S3 的返回顺序）
        merged: list[tuple[str, object]] = sorted(
            [(c.object_key, ("obj", c)) for c in contents]
            + [(cp, ("cp", cp)) for cp in common_prefixes],
            key=lambda x: x[0],
        )

        contents_xml = ""
        common_xml = ""
        for _, (kind, payload) in merged:
            if kind == "obj":
                m = payload
                last_modified = format_s3_time(datetime.now(timezone.utc))
                if m.updated_at:
                    last_modified = m.updated_at.replace(" ", "T", 1).split(".")[0] + ".000Z"
                etag = m.etag if m.etag else "d41d8cd98f00b204e9800998ecf8427e"
                size = m.size if m.size is not None else 0
                contents_xml += (
                    f"<Contents>"
                    f"<Key>{xml_escape(m.object_key)}</Key>"
                    f"<LastModified>{xml_escape(last_modified)}</LastModified>"
                    f'<ETag>"{xml_escape(etag)}"</ETag>'
                    f"<Size>{size}</Size>"
                    f"<StorageClass>STANDARD</StorageClass>"
                    f"</Contents>"
                )
            else:
                common_xml += (
                    f"<CommonPrefixes>"
                    f"<Prefix>{xml_escape(payload)}</Prefix>"
                    f"</CommonPrefixes>"
                )

        key_count = len(contents) + len(common_prefixes)
        next_token = ""
        if truncated and next_start:
            next_token = encode_continuation_token(next_start)

        if list_type == "2":
            xml_body = (
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                f"<ListBucketResult>"
                f"<Name>{xml_escape(bucket)}</Name>"
                f"<Prefix>{xml_escape(prefix)}</Prefix>"
                f"<KeyCount>{key_count}</KeyCount>"
                f"<MaxKeys>{max_keys}</MaxKeys>"
                f"<IsTruncated>{'true' if truncated else 'false'}</IsTruncated>"
            )
            if delimiter:
                xml_body += f"<Delimiter>{xml_escape(delimiter)}</Delimiter>"
            if next_token:
                xml_body += f"<NextContinuationToken>{xml_escape(next_token)}</NextContinuationToken>"
            xml_body += contents_xml
            xml_body += common_xml
            xml_body += "</ListBucketResult>"
        else:
            xml_body = (
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                f"<ListBucketResult>"
                f"<Name>{xml_escape(bucket)}</Name>"
                f"<Prefix>{xml_escape(prefix)}</Prefix>"
                f"<Marker>{xml_escape(marker or '')}</Marker>"
                f"<MaxKeys>{max_keys}</MaxKeys>"
                f"<IsTruncated>{'true' if truncated else 'false'}</IsTruncated>"
            )
            if delimiter:
                xml_body += f"<Delimiter>{xml_escape(delimiter)}</Delimiter>"
            if next_token:
                xml_body += f"<NextMarker>{xml_escape(next_token)}</NextMarker>"
            xml_body += contents_xml
            xml_body += common_xml
            xml_body += "</ListBucketResult>"

        rt = int((time.time() - start_time) * 1000)
        log_request(
            request,
            access_key,
            bucket,
            "-",
            200,
            key_count,
            rt,
        )
        return Response(
            content=xml_body,
            status_code=200,
            media_type="application/xml",
            headers={"x-amz-request-id": generate_request_id()},
        )

    # ------------------------------------------------------------------
    # HeadObject - HEAD /{bucket}/{key}
    # ------------------------------------------------------------------

    @router.head("/{bucket}/{key:path}")
    async def head_object(bucket: str, key: str, request: Request):
        start_time = time.time()
        headers = get_headers_dict(request)
        try:
            access_key = check_auth(
                settings,
                "HEAD",
                f"/{bucket}/{key}",
                str(request.url.query),
                headers,
            )
        except AuthError as e:
            resp = make_error_response(e.code, e.message, request, 403)
            log_request(request, "-", bucket, key, 403)
            return resp

        try:
            real_path = mapping_service.resolve_real_path(bucket, key)
        except MappingError as e:
            code = "NoSuchKey" if "No such key" in str(e) or "not found" in str(e) else "InvalidRequest"
            status = 404 if code == "NoSuchKey" else 400
            resp = make_error_response(code, str(e), request, status)
            log_request(request, access_key, bucket, key, status)
            return resp

        file_size = get_file_size(str(real_path))
        content_type = get_content_type(str(real_path))
        last_modified = get_last_modified(str(real_path))
        etag = compute_etag(str(real_path))

        rt = int((time.time() - start_time) * 1000)
        log_request(request, access_key, bucket, key, 200, file_size, rt)
        return Response(
            status_code=200,
            headers={
                "Content-Type": content_type,
                "Content-Length": str(file_size),
                "ETag": f'"{etag}"',
                "Last-Modified": format_http_time(last_modified),
                "Accept-Ranges": "bytes",
                "x-amz-request-id": generate_request_id(),
            },
        )

    # ------------------------------------------------------------------
    # GetObject - GET /{bucket}/{key} (支持 Range)
    # ------------------------------------------------------------------

    @router.get("/{bucket}/{key:path}")
    async def get_object(bucket: str, key: str, request: Request):
        start_time = time.time()
        headers = get_headers_dict(request)
        try:
            access_key = check_auth(
                settings,
                "GET",
                f"/{bucket}/{key}",
                str(request.url.query),
                headers,
            )
        except AuthError as e:
            resp = make_error_response(e.code, e.message, request, 403)
            log_request(request, "-", bucket, key, 403)
            return resp

        try:
            real_path = mapping_service.resolve_real_path(bucket, key)
        except MappingError as e:
            code = "NoSuchKey" if "No such key" in str(e) or "not found" in str(e) else "InvalidRequest"
            status = 404 if code == "NoSuchKey" else 400
            resp = make_error_response(code, str(e), request, status)
            log_request(request, access_key, bucket, key, status)
            return resp

        file_size = get_file_size(str(real_path))
        content_type = get_content_type(str(real_path))
        last_modified = get_last_modified(str(real_path))
        etag = compute_etag(str(real_path))

        range_header = headers.get("range", "")
        range_result = parse_range_header(range_header, file_size) if range_header else None

        request_id = generate_request_id()
        base_headers = {
            "Content-Type": content_type,
            "ETag": f'"{etag}"',
            "Last-Modified": format_http_time(last_modified),
            "Accept-Ranges": "bytes",
            "x-amz-request-id": request_id,
        }

        if range_result:
            start, end = range_result
            length = end - start + 1

            def file_stream():
                with open(str(real_path), "rb") as f:
                    f.seek(start)
                    remaining = length
                    chunk_size = 64 * 1024
                    while remaining > 0:
                        read_size = min(chunk_size, remaining)
                        data = f.read(read_size)
                        if not data:
                            break
                        remaining -= len(data)
                        yield data

            base_headers["Content-Length"] = str(length)
            base_headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            rt = int((time.time() - start_time) * 1000)
            log_request(request, access_key, bucket, key, 206, length, rt)
            return StreamingResponse(
                file_stream(),
                status_code=206,
                headers=base_headers,
                media_type=content_type,
            )
        else:
            def full_stream():
                with open(str(real_path), "rb") as f:
                    while True:
                        data = f.read(64 * 1024)
                        if not data:
                            break
                        yield data

            base_headers["Content-Length"] = str(file_size)
            rt = int((time.time() - start_time) * 1000)
            log_request(request, access_key, bucket, key, 200, file_size, rt)
            return StreamingResponse(
                full_stream(),
                status_code=200,
                headers=base_headers,
                media_type=content_type,
            )

    return router

