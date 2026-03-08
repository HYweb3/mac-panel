#!/bin/bash
# 验证修复效果

echo "========================================"
echo "Nginx 修复验证"
echo "========================================"
echo ""

# 检查目录结构
echo "📋 当前配置目录结构："
ls -la /opt/homebrew/etc/nginx/servers/ 2>/dev/null | grep -v "^total" | sed 's/^/   /'
echo ""

# 检查 custom 目录
if [ -d "/opt/homebrew/etc/nginx/servers/custom" ]; then
    echo "❌ custom 目录仍然存在"
    echo "   请运行: sudo ./fix-nginx-config-error.sh"
else
    echo "✅ custom 目录不存在（正常）"
fi

# 检查符号链接
SYMLINK_COUNT=$(find /opt/homebrew/etc/nginx/servers -maxdepth 1 -type l 2>/dev/null | wc -l)
if [ "$SYMLINK_COUNT" -gt 0 ]; then
    echo "⚠️  发现 $SYMLINK_COUNT 个符号链接"
    find /opt/homebrew/etc/nginx/servers -maxdepth 1 -type l -exec basename {} \; | sed 's/^/   /'
else
    echo "✅ 没有符号链接（正常）"
fi
echo ""

# 测试配置
echo "🧪 Nginx 配置测试："
if nginx-manage test 2>&1 | grep -q "successful\|syntax is ok"; then
    echo "✅ 配置测试通过"
    echo ""
    echo "🎉 修复成功！现在可以："
    echo "   1. 在网站管理中编辑配置"
    echo "   2. 在 Nginx 管理中编辑配置"
    echo "   3. 保存配置会自动测试并重载"
else
    echo "❌ 配置测试失败"
    echo ""
    nginx-manage test 2>&1 | sed 's/^/   /'
    echo ""
    echo "请检查配置文件或运行: sudo ./fix-nginx-config-error.sh"
fi

echo ""
echo "========================================"
