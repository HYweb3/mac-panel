#!/bin/bash

# Nginx 自动配置脚本
# 为 Mac Panel 设置 nginx 自动管理权限

echo "======================================"
echo "Nginx 自动配置脚本"
echo "======================================"
echo ""

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本"
    echo "   sudo ./setup-nginx-auto.sh"
    exit 1
fi

# 获取当前用户
CURRENT_USER=${SUDO_USER:-$USER}
echo "📋 当前用户: $CURRENT_USER"

# 检查Homebrew nginx安装路径
NGINX_CONF_DIR="/opt/homebrew/etc/nginx"
if [ ! -d "$NGINX_CONF_DIR" ]; then
    echo "❌ 未找到 Homebrew Nginx 配置目录"
    exit 1
fi

echo "✅ Nginx 配置目录: $NGINX_CONF_DIR"
echo ""

# 1. 修改servers目录权限
echo "📝 步骤 1/5: 修改 nginx 配置目录权限..."
sudo chmod 755 "$NGINX_CONF_DIR/servers"
sudo chown "$CURRENT_USER:admin" "$NGINX_CONF_DIR/servers"
echo "✅ servers 目录权限已更新"
echo ""

# 2. 修改nginx.pid文件权限
echo "📝 步骤 2/5: 修改 nginx.pid 文件权限..."
NGINX_PID_DIR="/opt/homebrew/var/run"
sudo mkdir -p "$NGINX_PID_DIR"
sudo chmod 755 "$NGINX_PID_DIR"

if [ -f "$NGINX_PID_DIR/nginx.pid" ]; then
    sudo chown "$CURRENT_USER:admin" "$NGINX_PID_DIR/nginx.pid"
    sudo chmod 644 "$NGINX_PID_DIR/nginx.pid"
    echo "✅ nginx.pid 权限已更新"
else
    echo "⚠️  nginx.pid 文件不存在，将在nginx启动时自动创建"
fi
echo ""

# 3. 修改nginx日志目录权限
echo "📝 步骤 3/5: 修改 nginx 日志目录权限..."
NGINX_LOG_DIR="/opt/homebrew/var/log/nginx"
sudo mkdir -p "$NGINX_LOG_DIR"
sudo chown -R "$CURRENT_USER:admin" "$NGINX_LOG_DIR"
echo "✅ 日志目录权限已更新"
echo ""

# 4. 创建nginx管理脚本
echo "📝 步骤 4/5: 创建 nginx 管理脚本..."
cat > /usr/local/bin/nginx-manage << 'SCRIPT'
#!/bin/bash
# Nginx 管理脚本 - 用于 Mac Panel

NGINX_BIN="/opt/homebrew/bin/nginx"

case "$1" in
    test)
        $NGINX_BIN -t 2>&1
        ;;
    reload)
        $NGINX_BIN -s reload 2>&1
        ;;
    restart)
        brew services restart nginx 2>&1
        ;;
    start)
        brew services start nginx 2>&1
        ;;
    stop)
        brew services stop nginx 2>&1
        ;;
    *)
        echo "用法: nginx-manage {test|reload|restart|start|stop}"
        exit 1
        ;;
esac
SCRIPT

sudo chmod +x /usr/local/bin/nginx-manage
echo "✅ 管理脚本已创建: /usr/local/bin/nginx-manage"
echo ""

# 5. 测试nginx配置
echo "📝 步骤 5/5: 测试 nginx 配置..."
/opt/homebrew/bin/nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过"
    echo ""
    echo "🔄 正在重新加载 nginx..."
    /opt/homebrew/bin/nginx -s reload
    echo "✅ Nginx 已重新加载"
else
    echo "❌ Nginx 配置测试失败"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ 配置完成！"
echo "======================================"
echo ""
echo "📋 配置摘要："
echo "  - servers 目录: $NGINX_CONF_DIR/servers"
echo "  - 日志目录: $NGINX_LOG_DIR"
echo "  - PID 目录: $NGINX_PID_DIR"
echo "  - 管理脚本: /usr/local/bin/nginx-manage"
echo ""
echo "🎯 现在你可以在 Mac Panel 中："
echo "  ✓ 创建/编辑/删除网站"
echo "  ✓ 启用/停用网站"
echo "  ✓ 自动生成 nginx 配置"
echo "  ✓ 自动重新加载 nginx"
echo ""
echo "🔗 测试访问："
echo "  http://localhost:9188"
echo "  http://192.168.0.77:9188"
echo ""
