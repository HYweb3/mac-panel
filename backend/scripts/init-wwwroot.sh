#!/bin/bash

# Mac Panel - 网站根目录初始化脚本
# 用于创建 /www/wwwroot 目录并设置正确的权限

echo "🚀 Mac Panel - 网站根目录初始化"
echo "================================"

# 检查是否以 root 权限运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 错误: 此脚本需要 root 权限"
    echo "请使用: sudo bash $0"
    exit 1
fi

# 创建 /www 目录
echo "📁 创建 /www 目录..."
mkdir -p /www

# 创建 wwwroot 目录
echo "📁 创建 /www/wwwroot 目录..."
mkdir -p /www/wwwroot

# 设置目录权限
echo "🔒 设置目录权限..."
chmod 755 /www
chmod 755 /www/wwwroot

# 获取当前用户（在 sudo 环境中）
CURRENT_USER=$SUDO_USER
if [ -z "$CURRENT_USER" ]; then
    CURRENT_USER=$USER
fi

# 设置目录所有者
echo "👤 设置目录所有者为: $CURRENT_USER..."
chown -R $CURRENT_USER:staff /www

echo ""
echo "✅ 初始化完成！"
echo "   网站根目录: /www/wwwroot"
echo "   所有者: $CURRENT_USER"
echo "   权限: 755"
echo ""
echo "💡 提示:"
echo "   - 网站将创建在 /www/wwwroot/domain.com"
echo "   - 您可以在 Mac Panel 中创建网站"
echo "   - 确保已安装并启动 Nginx"
