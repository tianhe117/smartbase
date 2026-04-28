#!/bin/bash
# 开发模式：后端 + 前端同时启动（支持热更新）
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "错误: 未找到虚拟环境，请先运行: python3 -m venv venv && source venv/bin/activate && pip install -r server/requirements.txt"
    exit 1
fi

cleanup() {
    echo "正在停止服务..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "启动后端 (http://localhost:8000)..."
cd server
source ../venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "启动前端 (http://localhost:5173)..."
cd web
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "  开发环境已启动"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo "  按 Ctrl+C 停止"
echo "========================================="
echo ""

wait
