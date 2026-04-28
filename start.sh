#!/bin/bash
# 生产模式启动（FastAPI 同时 serve 前端和 API）
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "错误: 未找到虚拟环境，请先运行:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r server/requirements.txt"
    exit 1
fi

# 检查前端是否已构建
if [ ! -d "server/static" ]; then
    echo "正在构建前端..."
    cd web && npm install && npm run build && cd ..
fi

# 配置（可通过环境变量覆盖）
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-1}"

echo "启动服务: http://${HOST}:${PORT}"
cd server
source ../venv/bin/activate
exec uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --proxy-headers \
    --forwarded-allow-ips='*'
