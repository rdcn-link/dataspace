"""SQLite 数据库管理模块"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, Optional

from .models import ObjectMapping

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS object_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bucket_name TEXT NOT NULL,
    object_key TEXT NOT NULL,
    real_path TEXT NOT NULL,
    size INTEGER,
    content_type TEXT,
    etag TEXT,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bucket_name, object_key)
);
"""

CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_bucket_key
ON object_mapping(bucket_name, object_key);

CREATE INDEX IF NOT EXISTS idx_bucket_prefix
ON object_mapping(bucket_name, object_key);
"""


def init_database(db_path: str) -> None:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with get_connection(db_path) as conn:
        conn.executescript(CREATE_TABLE_SQL)
        conn.executescript(CREATE_INDEX_SQL)
        conn.commit()


@contextmanager
def get_connection(db_path: str) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def upsert_mapping(
    db_path: str,
    bucket_name: str,
    object_key: str,
    real_path: str,
    size: Optional[int] = None,
    content_type: Optional[str] = None,
    etag: Optional[str] = None,
) -> None:
    with get_connection(db_path) as conn:
        conn.execute(
            """
            INSERT INTO object_mapping
                (bucket_name, object_key, real_path, size, content_type, etag, enabled)
            VALUES (?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(bucket_name, object_key) DO UPDATE SET
                real_path = excluded.real_path,
                size = excluded.size,
                content_type = excluded.content_type,
                etag = excluded.etag,
                enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            """,
            (bucket_name, object_key, real_path, size, content_type, etag),
        )
        conn.commit()


def get_mapping(db_path: str, bucket_name: str, object_key: str) -> Optional[ObjectMapping]:
    with get_connection(db_path) as conn:
        row = conn.execute(
            """
            SELECT * FROM object_mapping
            WHERE bucket_name = ? AND object_key = ? AND enabled = 1
            """,
            (bucket_name, object_key),
        ).fetchone()
        if row is None:
            return None
        return _row_to_mapping(row)


def list_mappings(
    db_path: str,
    bucket_name: str,
    prefix: str = "",
    max_keys: int = 1000,
    start_after: Optional[str] = None,
) -> tuple[list[ObjectMapping], bool]:
    with get_connection(db_path) as conn:
        if start_after:
            sql = """
                SELECT * FROM object_mapping
                WHERE bucket_name = ? AND object_key LIKE ? AND object_key > ?
                ORDER BY object_key ASC LIMIT ?
            """
            rows = conn.execute(sql, (bucket_name, f"{prefix}%", start_after, max_keys + 1)).fetchall()
        else:
            sql = """
                SELECT * FROM object_mapping
                WHERE bucket_name = ? AND object_key LIKE ?
                ORDER BY object_key ASC LIMIT ?
            """
            rows = conn.execute(sql, (bucket_name, f"{prefix}%", max_keys + 1)).fetchall()

        truncated = len(rows) > max_keys
        rows = rows[:max_keys]
        return [_row_to_mapping(r) for r in rows], truncated


def list_all_buckets(db_path: str) -> list[str]:
    with get_connection(db_path) as conn:
        rows = conn.execute(
            "SELECT DISTINCT bucket_name FROM object_mapping WHERE enabled = 1"
        ).fetchall()
        return [r["bucket_name"] for r in rows]


def delete_mapping(db_path: str, bucket_name: str, object_key: str) -> bool:
    with get_connection(db_path) as conn:
        cursor = conn.execute(
            "DELETE FROM object_mapping WHERE bucket_name = ? AND object_key = ?",
            (bucket_name, object_key),
        )
        conn.commit()
        return cursor.rowcount > 0


def count_mappings(db_path: str, bucket_name: Optional[str] = None) -> int:
    with get_connection(db_path) as conn:
        if bucket_name:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM object_mapping WHERE bucket_name = ? AND enabled = 1",
                (bucket_name,),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT COUNT(*) as cnt FROM object_mapping WHERE enabled = 1"
            ).fetchone()
        return row["cnt"]


def _row_to_mapping(row: sqlite3.Row) -> ObjectMapping:
    return ObjectMapping(
        id=row["id"],
        bucket_name=row["bucket_name"],
        object_key=row["object_key"],
        real_path=row["real_path"],
        size=row["size"],
        content_type=row["content_type"],
        etag=row["etag"],
        enabled=row["enabled"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )