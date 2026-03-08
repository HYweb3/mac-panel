#!/bin/bash

echo "=========================================="
echo "  WebSocket 连接测试"
echo "=========================================="
echo ""

echo "📡 测试系统监控 WebSocket (192.168.0.7:3001)..."
echo "   端点: ws://192.168.0.7:3001/ws/system-stats"
echo ""

echo "📡 测试终端 WebSocket (192.168.0.7:3002)..."
echo "   端点: ws://192.168.0.7:3002/ws/terminal"
echo ""

echo "📡 测试浏览器 WebSocket (192.168.0.7:3003)..."
echo "   端点: ws://192.168.0.7:3003/ws/browser"
echo ""

echo "=========================================="
echo "  检查 WebSocket 服务端口"
echo "=========================================="

echo ""
echo "端口 3001 (系统监控):"
if lsof -i:3001 | grep LISTEN > /dev/null 2>&1; then
    echo "✅ 正在监听"
else
    echo "❌ 未运行"
fi

echo ""
echo "端口 3002 (终端):"
if lsof -i:3002 | grep LISTEN > /dev/null 2>&1; then
    echo "✅ 正在监听"
else
    echo "❌ 未运行"
fi

echo ""
echo "端口 3003 (浏览器):"
if lsof -i:3003 | grep LISTEN > /dev/null 2>&1; then
    echo "✅ 正在监听"
else
    echo "❌ 未运行"
fi

echo ""
echo "=========================================="
echo "  环境变量配置"
echo "=========================================="
echo ""
echo "前端环境变量 (frontend/.env):"
cat /Users/www1/Desktop/claude/mac-panel/frontend/.env | grep -E "^VITE_"

echo ""
echo "=========================================="
