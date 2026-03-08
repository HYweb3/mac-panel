#!/bin/bash

TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_NAME="mac-panel-data-backup-${TIMESTAMP}"

echo "========================================="
echo "  数据库文件单独备份"
echo "========================================="
echo ""

# 备份数据库文件
if [ -f "backend/data/db.json" ]; then
    cp backend/data/db.json "backend/data/db.json.backup_${TIMESTAMP}"
    echo "✓ 数据库已备份: db.json.backup_${TIMESTAMP}"
    ls -lh "backend/data/db.json.backup_${TIMESTAMP}"
else
    echo "⚠ 数据库文件不存在"
fi

echo ""

# 备份终端日志
if [ -d "backend/logs/terminal" ]; then
    mkdir -p "backup/logs"
    cp -r backend/logs/terminal "backup/logs/terminal-${TIMESTAMP}"
    echo "✓ 终端日志已备份"
    du -sh "backup/logs/terminal-${TIMESTAMP}"
fi

echo ""
echo "========================================="
echo "  ✓ 数据备份完成！"
echo "========================================="
