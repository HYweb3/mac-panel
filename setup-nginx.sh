#!/bin/bash

# Mac Panel Nginx 配置初始化脚本
# 此脚本需要管理员权限来设置 Nginx 配置目录

echo "🔧 Mac Panel Nginx 配置初始化"
echo "================================"

# 检测 Nginx 安装类型
if [ -d "/opt/homebrew/etc/nginx" ]; then
    NGINX_CONF_DIR="/opt/homebrew/etc/nginx"
    echo "✅ 检测到 Homebrew Nginx"
elif [ -d "/etc/nginx" ]; then
    NGINX_CONF_DIR="/etc/nginx"
    echo "✅ 检测到系统 Nginx"
else
    echo "❌ 未找到 Nginx 配置目录"
    exit 1
fi

# 创建必要的目录
echo ""
echo "📁 创建配置目录..."

# SSL 证书目录
if [ ! -d "$NGINX_CONF_DIR/ssl" ]; then
    sudo mkdir -p "$NGINX_CONF_DIR/ssl"
    sudo chown $(whoami):admin "$NGINX_CONF_DIR/ssl"
    sudo chmod 755 "$NGINX_CONF_DIR/ssl"
    echo "✅ 创建 SSL 目录: $NGINX_CONF_DIR/ssl"
else
    echo "✅ SSL 目录已存在"
fi

# 自定义配置目录（用于保存用户修改的配置）
if [ ! -d "$NGINX_CONF_DIR/servers/custom" ]; then
    sudo mkdir -p "$NGINX_CONF_DIR/servers/custom"
    sudo chown $(whoami):admin "$NGINX_CONF_DIR/servers/custom"
    sudo chmod 755 "$NGINX_CONF_DIR/servers/custom"
    echo "✅ 创建自定义配置目录: $NGINX_CONF_DIR/servers/custom"
else
    echo "✅ 自定义配置目录已存在"
fi

# 创建日志目录
if [ ! -d "/var/log/nginx" ]; then
    sudo mkdir -p /var/log/nginx
    sudo chown $(whoami):admin /var/log/nginx
    sudo chmod 755 /var/log/nginx
    echo "✅ 创建日志目录: /var/log/nginx"
else
    # 如果日志目录存在，确保当前用户有写权限
    sudo chown $(whoami):admin /var/log/nginx 2>/dev/null || true
    echo "✅ 日志目录已存在"
fi

# 检查 Nginx 主配置
echo ""
echo "🔍 检查 Nginx 主配置..."

# 检查是否包含了 servers 目录
if ! grep -q "include.*servers" "$NGINX_CONF_DIR/nginx.conf"; then
    echo "⚠️  Nginx 主配置未包含 servers 目录"
    echo "📝 添加 servers 目录包含..."

    # 备份主配置
    sudo cp "$NGINX_CONF_DIR/nginx.conf" "$NGINX_CONF_DIR/nginx.conf.backup.$(date +%s)"

    # 添加 include 语句（在 http 块的末尾）
    if [ "$NGINX_CONF_DIR" = "/opt/homebrew/etc/nginx" ]; then
        # Homebrew Nginx 通常已经包含了 servers 目录
        echo "✅ Homebrew Nginx 通常已包含 servers 目录"
    else
        # Linux Nginx 需要手动添加
        sudo sed -i '/http {/,/}/ s/}$/    include \/etc\/nginx\/servers\/\*;\n}/' "$NGINX_CONF_DIR/nginx.conf"
    fi
else
    echo "✅ Nginx 主配置已包含 servers 目录"
fi

# 测试 Nginx 配置
echo ""
echo "🧪 测试 Nginx 配置..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx 配置测试通过"
else
    echo "⚠️  Nginx 配置测试失败，请手动检查"
    sudo nginx -t
fi

echo ""
echo "✅ Nginx 配置初始化完成！"
echo ""
echo "📋 配置摘要:"
echo "   - Nginx 配置目录: $NGINX_CONF_DIR"
echo "   - SSL 证书目录: $NGINX_CONF_DIR/ssl"
echo "   - 自定义配置: $NGINX_CONF_DIR/servers/custom"
echo "   - 日志目录: /var/log/nginx"
echo ""
echo "🚀 现在您可以在 Mac Panel 中管理网站了！"
