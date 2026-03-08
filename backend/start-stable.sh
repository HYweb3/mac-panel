#!/bin/bash

# Mac Panel 后端服务稳定启动脚本

BACKEND_DIR="/Users/www1/Desktop/claude/mac-panel/backend"
PID_FILE="$BACKEND_DIR/backend.pid"
LOG_FILE="$BACKEND_DIR/backend.log"

cd "$BACKEND_DIR" || exit 1

# 停止现有进程
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "停止旧进程 (PID: $OLD_PID)"
        kill "$OLD_PID" 2>/dev/null
        sleep 2
        # 强制杀死如果还没停止
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            kill -9 "$OLD_PID" 2>/dev/null
        fi
    fi
    rm -f "$PID_FILE"
fi

# 清理端口占用
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# 启动后端服务
echo "启动后端服务..."
nohup npx ts-node src/app.ts > "$LOG_FILE" 2>&1 &
PID=$!

# 保存 PID
echo $PID > "$PID_FILE"

# 等待启动
sleep 3

# 检查是否启动成功
if ps -p $PID > /dev/null; then
    echo "✅ 后端服务已启动 (PID: $PID)"
    echo "📋 日志文件: $LOG_FILE"
    echo "🔗 访问地址: http://localhost:3001"

    # 显示最近的日志
    echo ""
    echo "最近的日志:"
    tail -20 "$LOG_FILE"
else
    echo "❌ 后端服务启动失败"
    echo "查看日志: cat $LOG_FILE"
    exit 1
fi
