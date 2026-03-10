#!/bin/bash

# Mac Panel 启动脚本 v2.0

echo "🚀 Mac Panel v2.0 启动中..."
echo ""

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")"

# 检查并安装后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查并安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🔧 启动服务..."
echo ""

# 启动后端
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Mac Panel 已启动！"
echo ""

# 获取本机IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 前端地址: http://localhost:5173"
echo "  🔌 后端地址: http://localhost:3001"
echo ""
echo "  📡 局域网访问:"
echo "     前端: http://$LOCAL_IP:5173"
echo "     后端: http://$LOCAL_IP:3001"
echo ""
echo "  👤 默认账号: admin"
echo "  🔑 默认密码: admin123"
echo ""
echo "  📊 新功能:"
echo "     • 系统监控 - 实时 CPU、内存、磁盘、网络监控"
echo "     • 进程管理 - 查看和管理系统进程"
echo "     • 任务中心 - 定时任务、执行记录、告警通知"
echo "     • 权限管理 - 基于角色的访问控制"
echo "     • 操作日志 - 完整的审计日志"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 等待进程结束
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 服务已停止'; exit 0" INT TERM

wait
