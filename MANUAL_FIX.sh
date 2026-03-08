#!/bin/bash

# 手动修复权限 - 分步执行版本

echo "======================================"
echo "Mac Panel 权限手动修复"
echo "======================================"
echo ""

# 获取当前用户
CURRENT_USER=$(whoami)
echo "📋 当前用户: $CURRENT_USER"
echo ""

echo "🔧 即将执行以下操作："
echo ""
echo "1. 修改nginx配置目录所有者为 $CURRENT_USER"
echo "2. 修改nginx日志目录所有者为 $CURRENT_USER"
echo "3. 修改网站目录权限为755"
echo ""
read -p "是否继续？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

echo ""
echo "📝 步骤 1/3: 修复 nginx 配置目录..."
echo "执行: sudo chown -R $CURRENT_USER:admin /opt/homebrew/etc/nginx/servers/"
sudo chown -R $CURRENT_USER:admin /opt/homebrew/etc/nginx/servers/

if [ $? -eq 0 ]; then
    echo "✅ 成功"
    ls -la /opt/homebrew/etc/nginx/servers/ | head -3
else
    echo "❌ 失败"
    exit 1
fi
echo ""

echo "📝 步骤 2/3: 修复 nginx 日志目录..."
echo "执行: sudo chown -R $CURRENT_USER:admin /opt/homebrew/var/log/nginx/"
sudo chown -R $CURRENT_USER:admin /opt/homebrew/var/log/nginx/

if [ $? -eq 0 ]; then
    echo "✅ 成功"
    ls -la /opt/homebrew/var/log/nginx/ | head -3
else
    echo "❌ 失败"
    exit 1
fi
echo ""

echo "📝 步骤 3/3: 修复网站目录权限..."
echo "执行: chmod 755 /Users/$CURRENT_USER/www"
chmod 755 /Users/$CURRENT_USER/www

if [ $? -eq 0 ]; then
    echo "✅ 成功"
    ls -ld /Users/$CURRENT_USER/www
else
    echo "❌ 失败"
    exit 1
fi
echo ""

echo "======================================"
echo "✅ 权限修复完成！"
echo "======================================"
echo ""

# 验证
echo "📋 验证权限："
echo ""
echo "配置目录："
ls -ld /opt/homebrew/etc/nginx/servers/
echo ""
echo "日志目录："
ls -ld /opt/homebrew/var/log/nginx/
echo ""
echo "网站目录："
ls -ld /Users/$CURRENT_USER/www/
echo ""

# 测试写入
echo "🧪 测试写入权限..."
touch /opt/homebrew/etc/nginx/servers/.test-write 2>/dev/null
if [ $? -eq 0 ]; then
    rm /opt/homebrew/etc/nginx/servers/.test-write
    echo "✅ 配置目录可写 - 自动化配置已就绪！"
else
    echo "❌ 配置目录仍不可写"
fi
echo ""

echo "🎉 现在可以在 Mac Panel 中创建网站，将自动生成nginx配置！"
