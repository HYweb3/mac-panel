#!/bin/bash

# 二维码显示测试脚本
# 用于测试终端是否能正确显示二维码

echo "========================================="
echo "终端二维码显示测试"
echo "========================================="
echo ""

# 检查 qrcode 命令是否安装
if command -v qrcode &> /dev/null; then
    echo "✓ qrcode 命令已安装"
    echo ""
    echo "测试 1: 生成二维码（使用 qrcode 命令）"
    echo "----------------------------------------"
    qrcode "https://github.com/HYweb3/mac-panel"
    echo ""
else
    echo "✗ qrcode 命令未安装，使用备用方法"
    echo ""

    # 检查 Python 是否可用
    if command -v python3 &> /dev/null; then
        echo "测试 1: 使用 Python 生成二维码"
        echo "----------------------------------------"
        python3 -c "
import sys
try:
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=2, border=1)
    qr.add_data('https://github.com/HYweb3/mac-panel')
    qr.make(fit=True)
    qr.print_ascii()
except ImportError:
    print('需要安装 qrcode 库: pip3 install qrcode')
    sys.exit(1)
"
        echo ""
    else
        echo "✗ 无法生成二维码测试"
        echo "请安装: brew install qrcode"
    fi
fi

echo ""
echo "测试 2: Unicode 字符测试（二维码使用这些字符）"
echo "----------------------------------------"
echo "█ ▀ ▄ ■ □ ▬ ▮ ▯"
echo ""

echo "测试 3: 对齐测试"
echo "----------------------------------------"
echo "████████████████"
echo "██░░░░░░░░░░░░██"
echo "██░████████░░██"
echo "██░██░░░░██░░██"
echo "██░██░░░░██░░██"
echo "██░████████░░██"
echo "██░░░░░░░░░░░░██"
echo "████████████████"
echo ""

echo "========================================="
echo "测试完成！"
echo "========================================="
echo ""
echo "提示："
echo "1. 如果二维码显示正常，你应该能看到清晰的方块图案"
echo "2. 如果二维码扭曲或变形，可能是字体或编码问题"
echo "3. 尝试使用手机扫描测试二维码来验证"
echo ""
