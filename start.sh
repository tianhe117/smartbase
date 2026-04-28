#!/bin/bash
# 启动生产模式（FastAPI 同时 serve 前端和 API）
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "错误: 未找到虚拟环境，请先运行: python3 -m venv venv && source venv/bin/activate && pip install -r server/requirements.txt"
    exit 1
fi

# 检查前端是否已构建
if [ ! -d "server/static" ]; then
    echo "正在构建前端..."
    cd web && npm install && npm run build && cd ..
fi

echo "启动服务: http://localhost:8000"
cd server
source ../venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
