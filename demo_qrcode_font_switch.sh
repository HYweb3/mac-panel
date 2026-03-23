#!/bin/bash

# 演示智能字体切换功能

echo "========================================"
echo "智能字体切换演示"
echo "========================================"
echo ""
echo "这个脚本演示终端的智能字体切换功能："
echo "- 普通文本使用舒适的默认字体"
echo "- 二维码自动切换到优化的等宽字体"
echo ""
echo "按任意键继续..."
read -n 1
echo ""
echo ""

# 显示普通文本（使用默认字体）
echo "=== 普通文本（默认字体） ==="
echo ""
echo "欢迎使用 Mac Panel 终端！"
echo "这是一个普通的命令行界面。"
echo "默认字体经过优化，适合长时间阅读和编码。"
echo ""
echo "你可以看到："
echo "- 清晰的字符显示"
echo "- 舒适的字体间距"
echo "- 适合日常使用的样式"
echo ""
sleep 2

echo ""
echo "=== 正在生成二维码... ==="
echo ""
sleep 1

# 生成二维码（会自动切换字体）
echo "请用手机扫描下方的二维码："
echo ""
./qrcode.sh "https://github.com/HYweb3/mac-panel"

echo ""
echo "=== 二维码显示完毕 ==="
echo ""
echo "注意观察："
echo "1. 显示二维码时，字体自动切换为等宽字体"
echo "2. 二维码结束后，字体自动恢复为默认样式"
echo "3. 整个过程完全自动化"
echo ""
echo "按任意键继续演示..."
read -n 1
echo ""

# 再次显示普通文本
echo "=== 普通文本（字体已恢复） ==="
echo ""
echo "看！字体已经自动恢复为默认样式。"
echo "你可以继续正常使用终端，"
echo "享受舒适的阅读体验。"
echo ""
echo "提示："
echo "- 运行 ./qrcode.sh 可生成二维码"
echo "- 或直接使用 qrencode 命令"
echo "- 系统会自动优化字体显示"
echo ""
