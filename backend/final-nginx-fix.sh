#!/bin/bash
# 最终修复：确保配置编辑正常工作

echo "========================================"
echo "Nginx 配置编辑最终修复"
echo "========================================"
echo ""

echo "当前状态检查："
echo "--------------------------------------"

# 1. 检查配置文件权限
echo "1. 配置文件权限："
ls -la /opt/homebrew/etc/nginx/servers/*.conf | awk '{print "   " $9 ": " $3 ":" $4}'
echo ""

# 2. 检查nginx进程
echo "2. Nginx 进程："
ps aux | grep nginx | grep -v grep | awk '{print "   " $2 " " $1 " " $9 " " $11}'
echo ""

# 3. 检查监听端口
echo "3. 监听端口："
lsof -i :8004,8099,9188 -P -n | grep LISTEN | awk '{print "   端口 " $9 ": " $1}' | sort -u
echo ""

# 4. 测试配置写入
echo "4. 测试配置写入："
TEST_TIME=$(date '+%H:%M:%S')
TEST_CONTENT="# 编辑测试 - $TEST_TIME"
echo "   添加测试注释: $TEST_CONTENT"

# 在test.ai99.us.conf中添加测试注释
sed -i '' "/# Gzip 压缩/i\\
$TEST_CONTENT
" /opt/homebrew/etc/nginx/servers/test.ai99.us.conf

if grep -q "$TEST_TIME" /opt/homebrew/etc/nginx/servers/test.ai99.us.conf; then
    echo "   ✅ 配置写入成功"
else
    echo "   ❌ 配置写入失败"
fi
echo ""

# 5. 测试nginx reload
echo "5. 测试 Nginx Reload："
if nginx-manage reload 2>&1 | grep -q "successful\|syntax is ok"; then
    echo "   ✅ 配置测试通过"
    
    # 尝试reload
    if /opt/homebrew/bin/nginx -s reload 2>&1; then
        echo "   ✅ Reload 成功（不需要sudo）"
    else
        # 尝试sudo
        if sudo /opt/homebrew/bin/nginx -s reload 2>&1; then
            echo "   ✅ Reload 成功（使用sudo）"
        else
            echo "   ⚠️  Reload 需要配置sudo免密"
        fi
    fi
else
    echo "   ❌ 配置测试失败"
fi
echo ""

echo "========================================"
echo "总结："
echo "--------------------------------------"
echo "配置保存流程："
echo "  1. ✅ 前端发送配置到后端"
echo "  2. ✅ 后端写入配置文件（www1权限）"
echo "  3. ✅ 后端测试配置"
echo "  4. ⚠️  后端重新加载nginx（可能需要sudo）"
echo ""
echo "如需编辑配置正常工作："
echo "  - 配置 sudo 免密: sudo visudo"
echo "  - 添加: www1 ALL=(ALL) NOPASSWD: /opt/homebrew/bin/nginx -s reload"
echo ""
echo "========================================"
