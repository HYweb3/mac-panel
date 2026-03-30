#!/bin/bash

# 网站自动配置脚本 - 解决权限和nginx配置问题

echo "======================================"
echo "网站自动配置脚本"
echo "======================================"
echo ""

DOMAIN="${1:-ai.ai9188.us}"
PORT="${2:-9188}"
ROOT_DIR="/Users/www1/www/wwwroot/$DOMAIN"

echo "📋 配置信息："
echo "  域名: $DOMAIN"
echo "  端口: $PORT"
echo "  根目录: $ROOT_DIR"
echo ""

# 1. 修复目录权限
echo "📝 步骤 1/4: 修复目录权限..."
chmod 755 /Users/www1
chmod 755 /Users/www1/www
if [ -d "$ROOT_DIR" ]; then
    chmod 755 "$ROOT_DIR"
    chmod 644 "$ROOT_DIR"/*.html 2>/dev/null
    chmod 644 "$ROOT_DIR"/*.css 2>/dev/null
    chmod 644 "$ROOT_DIR"/*.js 2>/dev/null
    echo "✅ 目录权限已修复"
else
    echo "⚠️  网站根目录不存在: $ROOT_DIR"
fi
echo ""

# 2. 创建nginx配置
echo "📝 步骤 2/4: 创建 nginx 配置..."
cat > /opt/homebrew/etc/nginx/servers/${DOMAIN}.conf << EOF
server {
    listen 0.0.0.0:${PORT};
    server_name ${DOMAIN};

    root ${ROOT_DIR};
    index index.html index.htm;

    access_log /opt/homebrew/var/log/nginx/${DOMAIN}-access.log;
    error_log /opt/homebrew/var/log/nginx/${DOMAIN}-error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\.ht {
        deny all;
    }

    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
echo "✅ Nginx 配置已创建"
echo ""

# 3. 测试配置
echo "📝 步骤 3/4: 测试 nginx 配置..."
/opt/homebrew/bin/nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx 配置测试失败"
    exit 1
fi
echo ""

# 4. 重新加载nginx
echo "📝 步骤 4/4: 重新加载 nginx..."
sudo /opt/homebrew/bin/nginx -s reload 2>/dev/null || /opt/homebrew/bin/nginx -s reload 2>/dev/null
sleep 2

# 测试访问
echo ""
echo "🧪 测试访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT})
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 网站运行正常！"
    echo ""
    echo "🔗 访问地址："
    echo "  http://localhost:${PORT}"
    echo "  http://192.168.1.77:${PORT}"
    echo ""
    echo "✅ 配置完成！"
else
    echo "⚠️  网站可能有问题，HTTP状态码: $HTTP_CODE"
    echo "查看错误日志："
    tail -20 /opt/homebrew/var/log/nginx/${DOMAIN}-error.log
fi
