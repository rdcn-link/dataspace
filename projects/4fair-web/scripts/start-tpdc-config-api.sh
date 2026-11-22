#!/usr/bin/env bash
# 懒人一键：启动线上 TPDC 配置写接口
# 用法：
#   bash scripts/start-tpdc-config-api.sh
#   bash scripts/start-tpdc-config-api.sh /var/www/fairspace.cn/tpdc_data_config.json

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${TPDC_CONFIG_API_PORT:-19089}"

if [[ -n "${1:-}" ]]; then
  CONFIG_FILE="$(readlink -f "$1" 2>/dev/null || realpath "$1" 2>/dev/null || echo "$1")"
elif [[ -f "$ROOT/dist/tpdc_data_config.json" ]]; then
  CONFIG_FILE="$ROOT/dist/tpdc_data_config.json"
elif [[ -f "$ROOT/public/tpdc_data_config.json" ]]; then
  CONFIG_FILE="$ROOT/public/tpdc_data_config.json"
else
  echo "找不到 tpdc_data_config.json，请传绝对路径："
  echo "  bash scripts/start-tpdc-config-api.sh /你的部署目录/tpdc_data_config.json"
  exit 1
fi

# 尽量去掉只读，保证可写
chmod u+w "$CONFIG_FILE" 2>/dev/null || true

export TPDC_CONFIG_FILE="$CONFIG_FILE"
export TPDC_CONFIG_API_PORT="$PORT"

echo "配置文件: $CONFIG_FILE"
echo "监听端口: 127.0.0.1:$PORT"
echo "Nginx 需反代: location /api/tpdc-data-config { proxy_pass http://127.0.0.1:$PORT; }"
echo

# 优先 pm2，没有就前台 node
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete tpdc-config-api >/dev/null 2>&1 || true
  pm2 start "$ROOT/scripts/tpdc-data-config-api.mjs" \
    --name tpdc-config-api \
    --update-env \
    --interpreter node
  pm2 save >/dev/null 2>&1 || true
  echo "已用 pm2 启动: pm2 logs tpdc-config-api"
  echo "自检: curl -s http://127.0.0.1:$PORT/api/tpdc-data-config | head"
else
  echo "未安装 pm2，前台启动（Ctrl+C 结束）。建议: npm i -g pm2 后重跑本脚本"
  exec node "$ROOT/scripts/tpdc-data-config-api.mjs"
fi
