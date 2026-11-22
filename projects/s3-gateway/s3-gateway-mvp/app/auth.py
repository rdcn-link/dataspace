"""AWS Signature V4 认证模块 - 验证 S3 客户端请求的签名"""

import hashlib
import hmac
import re
from datetime import datetime
from typing import Optional
from urllib.parse import parse_qsl

from .config import Settings

ALGORITHM = "AWS4-HMAC-SHA256"
SERVICE = "s3"


class AuthError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def get_signature_key(secret_key: str, date_stamp: str, region: str, service: str) -> bytes:
    k_date = sign(("AWS4" + secret_key).encode("utf-8"), date_stamp)
    k_region = sign(k_date, region)
    k_service = sign(k_region, service)
    k_signing = sign(k_service, "aws4_request")
    return k_signing


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest("utf-8")


def parse_authorization_header(auth_header: str) -> dict:
    if not auth_header.startswith(ALGORITHM + " "):
        raise AuthError("AuthorizationHeaderMalformed", "Invalid authorization header format")

    rest = auth_header[len(ALGORITHM) + 1:]
    parts = {}
    for part in rest.split(","):
        part = part.strip()
        if "=" in part:
            key, value = part.split("=", 1)
            parts[key.strip()] = value.strip()
    if "Credential" not in parts or "SignedHeaders" not in parts or "Signature" not in parts:
        raise AuthError("AuthorizationHeaderMalformed", "Missing required authorization components")
    return parts


def parse_credential(credential: str) -> dict:
    elements = credential.split("/")
    if len(elements) != 5:
        raise AuthError("AuthorizationHeaderMalformed", "Invalid credential format")
    return {
        "access_key": elements[0],
        "date_stamp": elements[1],
        "region": elements[2],
        "service": elements[3],
        "request_type": elements[4],
    }


def build_canonical_uri(path: str) -> str:
    from urllib.parse import quote
    segments = path.split("/")
    encoded = []
    for seg in segments:
        if seg:
            encoded.append(quote(seg, safe=""))
    result = "/" + "/".join(encoded)
    if path.endswith("/") and not result.endswith("/"):
        result += "/"
    return result


def build_canonical_query_string(query_string: str) -> str:
    if not query_string:
        return ""
    pairs = parse_qsl(query_string, keep_blank_values=True)
    from urllib.parse import quote
    encoded = []
    for k, v in sorted(pairs, key=lambda x: x[0]):
        encoded.append(f"{quote(k, safe='')}={quote(v, safe='')}")
    return "&".join(encoded)


def build_canonical_headers(headers: dict, signed_headers_list: list) -> str:
    result = []
    for h in signed_headers_list:
        value = headers.get(h, "")
        value = re.sub(r"\s+", " ", value).strip()
        result.append(f"{h}:{value}\n")
    return "".join(result)


def verify_signature(
    settings: Settings,
    method: str,
    path: str,
    query_string: str,
    headers: dict,
    body: bytes = b"",
) -> str:
    auth_header = headers.get("authorization", "")
    if not auth_header:
        raise AuthError("AccessDenied", "Missing Authorization header")

    auth_parts = parse_authorization_header(auth_header)
    credential = parse_credential(auth_parts["Credential"])
    signed_headers_list = auth_parts["SignedHeaders"].split(";")
    provided_signature = auth_parts["Signature"]

    access_key = credential["access_key"]
    if access_key != settings.s3_access_key:
        raise AuthError("InvalidAccessKeyId", f"Invalid access key: {access_key}")

    region = credential["region"]
    date_stamp = credential["date_stamp"]

    amz_date = headers.get("x-amz-date", "")
    if not amz_date:
        date_header = headers.get("date", "")
        if date_header:
            try:
                dt = datetime.strptime(date_header, "%a, %d %b %Y %H:%M:%S GMT")
                amz_date = dt.strftime("%Y%m%dT%H%M%SZ")
            except ValueError:
                pass

    canonical_uri = build_canonical_uri(path)
    canonical_query_string = build_canonical_query_string(query_string)
    canonical_headers = build_canonical_headers(headers, signed_headers_list)
    signed_headers = ";".join(signed_headers_list)

    payload_hash = headers.get("x-amz-content-sha256", "")
    if not payload_hash:
        if method.upper() in ("GET", "HEAD"):
            payload_hash = "e3b0c44d98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        else:
            payload_hash = sha256_hex(body)

    canonical_request = (
        f"{method.upper()}\n"
        f"{canonical_uri}\n"
        f"{canonical_query_string}\n"
        f"{canonical_headers}\n"
        f"{signed_headers}\n"
        f"{payload_hash}"
    )

    scope = f"{date_stamp}/{region}/{SERVICE}/aws4_request"
    string_to_sign = (
        f"{ALGORITHM}\n"
        f"{amz_date}\n"
        f"{scope}\n"
        f"{sha256_hex(canonical_request.encode('utf-8'))}"
    )

    signing_key = get_signature_key(settings.s3_secret_key, date_stamp, region, SERVICE)
    computed_signature = hmac.new(
        signing_key, string_to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest("utf-8")

    if not hmac.compare_digest(computed_signature, provided_signature):
        raise AuthError("SignatureDoesNotMatch", "The request signature does not match")

    return access_key


def check_auth(
    settings: Settings,
    method: str,
    path: str,
    query_string: str,
    headers: dict,
    body: bytes = b"",
) -> Optional[str]:
    if not settings.enable_auth:
        return "anonymous"
    return verify_signature(settings, method, path, query_string, headers, body)