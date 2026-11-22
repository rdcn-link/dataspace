#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# dataset-vfs-v2 服务器端一键部署脚本
#
# 使用方法：
#   1. 把 dataset-vfs-v2.tar.gz 上传到服务器
#   2. 解压：tar -xzf dataset-vfs-v2.tar.gz
#   3. 进入目录：cd dataset-vfs-v2
#   4. 跑本脚本：bash deploy.sh
#
# 本脚本会：
#   - 校验 /dev/fuse、docker、/mnt/sciencedbNew 真实数据
#   - docker compose build + up -d
#   - findmnt 确认挂载
#   - Python 端到端验证 getattr / readdir / open / read
# ════════════════════════════════════════════════════════════════

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "=========================================================="
echo "  dataset-vfs-v2 部署脚本"
echo "=========================================================="
echo

# ── 0. 前置检查 ────────────────────────────────────────────────────
echo "── [0/5] 前置检查"
ERR=0

if [ -e /dev/fuse ]; then
    echo "  ✅ /dev/fuse 存在"
else
    echo "  ❌ /dev/fuse 不存在 → apt-get install fuse libfuse2"
    ERR=1
fi

if command -v docker >/dev/null 2>&1; then
    echo "  ✅ docker $(docker version --format '{{.Server.Version}}')"
else
    echo "  ❌ docker 不存在 → 请先装 Docker Engine"
    ERR=1
fi

if command -v tar >/dev/null 2>&1; then
    echo "  ✅ tar 可用"
else
    echo "  ❌ tar 不存在"
    ERR=1
fi

if [ -d /mnt/sciencedbNew ]; then
    SAMPLE=$(find /mnt/sciencedbNew/dataSet -type f 2>/dev/null | head -3)
    if [ -n "$SAMPLE" ]; then
        echo "  ✅ /mnt/sciencedbNew 真实数据就绪"
        echo "     样例文件："
        echo "$SAMPLE" | sed 's/^/      /'
    else
        echo "  ⚠️  /mnt/sciencedbNew 存在但 /dataSet 下没找到文件"
        echo "     Docker 里 open() 叶子文件会失败（MongoDB 能 resolve 但磁盘上没真文件）"
    fi
else
    echo "  ⚠️  /mnt/sciencedbNew 不存在"
    echo "     如果真实数据在别的路径，改 docker-compose.yml 的 volumes 挂载即可"
fi

if [ $ERR -ne 0 ]; then
    echo; echo "前置检查失败，修复上面的 ❌ 项后重试"
    exit 1
fi

# ── 1. 停旧容器 ──────────────────────────────────────────────────
echo
echo "── [1/5] 停止旧容器"
docker compose down -v 2>/dev/null && echo "  ✅ 已清理" || echo "  (没有旧容器)"

# ── 2. 构建 + 启动 ────────────────────────────────────────────────
echo
echo "── [2/5] docker compose build"
docker compose build -q && echo "  ✅ 构建完成"

echo
echo "── [3/5] docker compose up -d"
docker compose up -d

# 等容器起来
for i in $(seq 1 15); do
    STATE=$(docker compose ps --format '{{.State.Status}}' | head -1)
    if [ "$STATE" = "running" ]; then
        echo "  ✅ 容器 running（等了 $i 秒）"
        break
    fi
    sleep 1
done

echo
echo "── 容器启动日志（最后 30 行）──"
docker compose logs --tail=30 dataset-vfs
echo "── 日志结束 ──"

# ── 3. findmnt ────────────────────────────────────────────────────
echo
echo "── [4/5] FUSE 挂载确认（findmnt /mnt/fairspace）"
if findmnt /mnt/fairspace >/dev/null 2>&1; then
    echo "  ✅ 挂载生效！"
    findmnt /mnt/fairspace
else
    echo "  ❌ findmnt 失败"
    echo "     完整日志："
    docker compose logs dataset-vfs
    echo
    echo "     可能原因："
    echo "       1) 容器不是 privileged"
    echo "       2) /dev/fuse 没映射"
    echo "       3) MongoDB 连接失败（看上面日志）"
    exit 1
fi

# ── 4. 端到端验收 ──────────────────────────────────────────────────
echo
echo "── [5/5] DataSeek 视角验收（Python）"

docker compose exec -T dataset-vfs python <<'PYEOF'
import os, sys

ROOT = "/mnt/fairspace"
errs = 0

def check(name, fn):
    global errs
    try:
        result = fn()
        print(f"  ✅ [{name}]")
        return result
    except Exception as e:
        print(f"  ❌ [{name}] → {e!r}")
        errs += 1
        return None

# 1. root getattr
check("getattr /fairspace", lambda: os.stat(ROOT))

# 2. root listdir → MongoDB 里的 datasetId
ds = check("listdir /fairspace", lambda: os.listdir(ROOT))
if ds is None: sys.exit(1)

print(f"     发现 {len(ds)} 个数据集: {ds[:5]}{'...' if len(ds)>5 else ''}")

# 用第一个 dataset 继续
DID = ds[0]

# 3. dataset 目录
check(f"getattr /fairspace/{DID}", lambda: os.stat(f"{ROOT}/{DID}"))

children = os.listdir(f"{ROOT}/{DID}")
print(f"     listdir /fairspace/{DID} → {children[:8]}")

# 4. walk 到第一个叶子文件
def walk(cur_path):
    for name in os.listdir(cur_path):
        if name in (".", ".."): continue
        full = os.path.join(cur_path, name)
        try:
            st = os.stat(full)
        except OSError:
            continue
        import stat as sm
        if sm.S_ISDIR(st.st_mode):
            r = walk(full)
            if r: return r
        else:
            return full
    return None

leaf = walk(f"{ROOT}/{DID}")

if leaf:
    rel = leaf.replace(ROOT, "/fairspace")
    print(f"     找到叶子文件: {rel}")
    try:
        with open(leaf, "rb") as f:
            data = f.read(16)
        sz = os.path.getsize(leaf)
        print(f"  ✅ open + read 成功，size={sz} 前16字节={data!r}")
    except FileNotFoundError:
        print("  ⚠️  open ENOENT — MongoDB resolve 了但 /mnt/sciencedbNew 上没这个文件")
        print("     这不是 FUSE 问题，是真实数据缺失")
    except Exception as e:
        print(f"  ❌ open 失败: {e!r}")
        errs += 1
else:
    print("  ⚠️  没找到叶子文件（fileTree 可能空）")

# 5. ENOENT 测试
try:
    os.stat(f"{ROOT}/does_not_exist_xyz")
    print("  ❌ nonexistent 应该抛异常")
    errs += 1
except FileNotFoundError:
    print("  ✅ nonexistent → 正确的 ENOENT")

print()
if errs == 0:
    print("═══ 所有验收测试通过 ═══")
else:
    print(f"═══ {errs} 项失败 ═══")
    sys.exit(1)
PYEOF

echo
echo "=========================================================="
echo "  部署完成"
echo "=========================================================="
echo
echo "DataSeek 用法："
echo "  open('/mnt/fairspace/<datasetId>/V1/.../file.HDF')"
echo "  read('/mnt/fairspace/<datasetId>/...')"
echo "  listdir('/mnt/fairspace')"
echo
echo "常用命令："
echo "  看日志:  docker compose logs -f dataset-vfs"
echo "  进容器:  docker compose exec dataset-vfs bash"
echo "  停止:    docker compose down"
echo "  重启:    docker compose restart dataset-vfs"
