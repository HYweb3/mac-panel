#!/bin/bash

# Mac Panel 控制脚本
# 使用 PM2 管理守护进程

# 设置 PATH
export PATH="/Users/www1/.npm-global/bin:$PATH"
export PM2_HOME="/Users/www1/.pm2"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/Users/www1/Desktop/claude/mac-panel"
cd "$PROJECT_DIR"

# 显示帮助信息
show_help() {
    echo -e "${BLUE}Mac Panel 控制脚本${NC}"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  status    查看状态"
    echo "  logs      查看日志"
    echo "  reload    热重载（零停机）"
    echo "  monitor   实时监控"
    echo "  help      显示帮助"
    echo ""
}

# 启动服务
start_services() {
    echo -e "${GREEN}启动 Mac Panel 服务...${NC}"
    pm2 start ecosystem.config.json
    echo -e "${GREEN}✓ 服务启动成功${NC}"
    show_status
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止 Mac Panel 服务...${NC}"
    pm2 stop all
    echo -e "${GREEN}✓ 服务已停止${NC}"
}

# 重启服务
restart_services() {
    echo -e "${YELLOW}重启 Mac Panel 服务...${NC}"
    pm2 restart all
    echo -e "${GREEN}✓ 服务已重启${NC}"
    show_status
}

# 显示状态
show_status() {
    echo -e "\n${BLUE}=== Mac Panel 服务状态 ===${NC}\n"
    pm2 status

    echo -e "\n${BLUE}=== 端口监听 ===${NC}"
    echo -e "后端 (3001): $(curl -s http://localhost:3001/health 2>/dev/null && echo '✓ 正常' || echo '✗ 异常')"
    echo -e "前端 (5188): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5188 2>/dev/null | grep -q '200' && echo '✓ 正常' || echo '✗ 异常')"

    echo -e "\n${BLUE}=== 访问地址 ===${NC}"
    echo -e "本地: ${GREEN}http://localhost:5188${NC}"
    echo -e "局域网: ${GREEN}http://192.168.0.77:5188${NC}"
}

# 查看日志
show_logs() {
    echo -e "${BLUE}查看最近50行日志...${NC}"
    pm2 logs --lines 50 --nostream
}

# 热重载
reload_services() {
    echo -e "${YELLOW}热重载 Mac Panel 服务...${NC}"
    pm2 reload all
    echo -e "${GREEN}✓ 服务已热重载${NC}"
}

# 实时监控
monitor_services() {
    pm2 monit
}

# 主逻辑
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    reload)
        reload_services
        ;;
    monitor)
        monitor_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}错误: 未知命令 '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0
