#!/bin/bash

# 便利的二维码生成脚本
# 用于在终端中生成可扫描的二维码

if [ -z "$1" ]; then
  echo "用法: qrcode.sh <URL或文本>"
  echo ""
  echo "示例:"
  echo "  qrcode.sh 'https://github.com/HYweb3/mac-panel'"
  echo "  qrcode.sh 'https://example.com/login?token=abc123'"
  echo ""
  echo "提示：使用手机扫描二维码即可访问链接"
  exit 1
fi

# 检查 qrencode 是否安装
if ! command -v qrencode &> /dev/null; then
  echo "错误：需要安装 qrencode"
  echo "安装命令：brew install qrencode"
  exit 1
fi

URL="$1"

# 显示二维码
echo ""
echo "=========================================="
echo "扫描二维码访问："
echo "$URL"
echo "=========================================="
echo ""

# 使用 ASCII 模式生成二维码（最可扫描）
qrencode -t ASCII -m 2 "$URL"

echo ""
echo "=========================================="
echo ""
