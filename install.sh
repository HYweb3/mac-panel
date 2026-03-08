#!/bin/bash

################################################################################
# Mac Panel 一键安装脚本
# 支持 macOS 12.0+
# 使用方法: sudo ./install.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 检查是否为root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        log_info "命令: sudo ./install.sh"
        exit 1
    fi
}

# 检查macOS版本
check_macos_version() {
    log_step "检查系统版本"

    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "此脚本仅支持 macOS 系统"
        exit 1
    fi

    MACOS_VERSION=$(sw_vers -productVersion)
    MACOS_MAJOR=$(echo "$MACOS_VERSION" | cut -d. -f1)

    log_info "检测到 macOS 版本: $MACOS_VERSION"

    if [ "$MACOS_MAJOR" -lt 12 ]; then
        log_error "需要 macOS 12.0 或更高版本"
        exit 1
    fi

    log_info "✅ 系统版本检查通过"
}

# 检查并安装Homebrew
check_homebrew() {
    log_step "检查 Homebrew"

    if ! command -v brew &> /dev/null; then
        log_info "Homebrew 未安装，正在安装..."

        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        if [ $? -eq 0 ]; then
            log_info "✅ Homebrew 安装成功"
        else
            log_error "Homebrew 安装失败"
            exit 1
        fi
    else
        log_info "✅ Homebrew 已安装: $(brew --version | cut -d' ' -f1)"
    fi

    # 确保 Homebrew 在 PATH 中
    eval "$(/opt/homebrew/bin/brew shellenv)"
}

# 安装Node.js
install_nodejs() {
    log_step "安装 Node.js"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js 已安装: $NODE_VERSION"

        # 检查版本是否满足要求
        NODE_MAJOR=$(node --version | cut -d. -f1 | cut -d'v' -f2)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            log_warn "Node.js 版本过低，需要 18.x 或更高版本"
            log_info "正在更新 Node.js..."
            brew reinstall node
        else
            log_info "✅ Node.js 版本满足要求"
        fi
    else
        log_info "正在安装 Node.js..."
        brew install node

        if [ $? -eq 0 ]; then
            log_info "✅ Node.js 安装成功: $(node --version)"
        else
            log_error "Node.js 安装失败"
            exit 1
        fi
    fi

    # 设置npm镜像（可选，加速国内下载）
    log_info "配置 npm 镜像源..."
    npm config set registry https://registry.npmmirror.com
}

# 创建专用用户
create_user() {
    log_step "创建 Mac Panel 用户"

    USERNAME="macpanel"

    if id "$USERNAME" &>/dev/null; then
        log_warn "用户 $USERNAME 已存在"

        # 检查用户是否在 admin 组
        if groups "$USERNAME" | grep -q admin; then
            log_info "✅ 用户已在 admin 组"
        else
            log_info "将用户添加到 admin 组..."
            dseditgroup -o edit -t $USERNAME admin
            log_info "✅ 用户已添加到 admin 组"
        fi
    else
        log_info "创建专用用户: $USERNAME"

        # 创建用户
        sysadminctl -addUser "$USERNAME" \
            -fullName "Mac Panel User" \
            -password "$(openssl rand -base64 16)" \
            -admin

        if [ $? -eq 0 ]; then
            log_info "✅ 用户 $USERNAME 创建成功"
        else
            log_warn "自动创建用户失败，请手动创建"
            log_info "命令: sudo sysadminctl -addUser $USERNAME -admin"
        fi
    fi
}

# 设置项目目录
setup_project_directory() {
    log_step "设置项目目录"

    PROJECT_DIR="/opt/mac-panel"

    if [ -d "$PROJECT_DIR" ]; then
        log_warn "项目目录已存在: $PROJECT_DIR"
        read -p "是否删除并重新安装? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "删除旧目录..."
            rm -rf "$PROJECT_DIR"
        else
            log_error "安装已取消"
            exit 1
        fi
    fi

    log_info "创建项目目录: $PROJECT_DIR"
    mkdir -p "$PROJECT_DIR"

    # 复制项目文件
    log_info "复制项目文件..."
    CURRENT_DIR=$(pwd)
    cd ..

    # 复制所有文件，排除 node_modules 和其他临时文件
    rsync -av \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.vite' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='*.log' \
        mac-panel/ "$PROJECT_DIR/"

    cd "$CURRENT_DIR"

    log_info "✅ 项目文件已复制到: $PROJECT_DIR"
}

# 安装依赖
install_dependencies() {
    log_step "安装项目依赖"

    PROJECT_DIR="/opt/mac-panel"

    cd "$PROJECT_DIR/backend"
    log_info "安装后端依赖..."
    npm install

    cd "$PROJECT_DIR/frontend"
    log_info "安装前端依赖..."
    npm install

    cd "$PROJECT_DIR"
    log_info "构建前端..."
    cd frontend
    npm run build

    log_info "✅ 依赖安装完成"
}

# 配置权限
setup_permissions() {
    log_step "配置权限"

    PROJECT_DIR="/opt/mac-panel"
    USERNAME="macpanel"

    # 设置项目目录所有者
    chown -R "$USERNAME:staff" "$PROJECT_DIR"

    # 设置权限
    chmod -R 755 "$PROJECT_DIR"

    # 数据目录需要写权限
    mkdir -p "$PROJECT_DIR/backend/data"
    chmod 775 "$PROJECT_DIR/backend/data"

    log_info "✅ 权限配置完成"
}

# 配置sudoers
setup_sudoers() {
    log_step "配置 Sudoers"

    SUDOERS_FILE="/etc/sudoers.d/mac-panel"

    log_info "创建 sudoers 配置..."

    cat > "$SUDOERS_FILE" << EOF
# Mac Panel Sudoers Configuration
# 允许 macpanel 用户管理服务和管理 nginx

# 管理后端服务
macpanel ALL=(ALL) NOPASSWD: /bin/launchctl kickstart -k gui/$(id -u macpanel) com.github.macpanel.backend
macpanel ALL=(ALL) NOPASSWD: /bin/launchctl kickstart -k gui/$(id -u macpanel) com.github.macpanel.frontend
macpanel ALL=(ALL) NOPASSWD: /usr/local/bin/nginx-manage

# 管理 nginx (macOS Homebrew)
macpanel ALL=(ALL) NOPASSWD: /opt/homebrew/bin/nginx -s *
macpanel ALL=(ALL) NOPASSWD: /usr/local/bin/nginx-manage
EOF

    chmod 440 "$SUDOERS_FILE"

    log_info "✅ Sudoers 配置完成"
}

# 创建启动脚本
create_launch_scripts() {
    log_step "创建启动脚本"

    PROJECT_DIR="/opt/mac-panel"
    USERNAME="macpanel"

    # 创建后端启动脚本
    cat > "$PROJECT_DIR/start-backend.sh" << EOF
#!/bin/bash
cd "$PROJECT_DIR/backend"
export NODE_ENV=production
nohup node dist/app.js > "$PROJECT_DIR/backend/backend.log" 2>&1 &
echo \$! > "$PROJECT_DIR/backend/backend.pid"
EOF

    # 创建前端启动脚本
    cat > "$PROJECT_DIR/start-frontend.sh" << EOF
#!/bin/bash
cd "$PROJECT_DIR/frontend/dist"
nohup python3 -m http.server 5173 > "$PROJECT_DIR/frontend/frontend.log" 2>&1 &
echo \$! > "$PROJECT_DIR/frontend/frontend.pid"
EOF

    chmod +x "$PROJECT_DIR/start-backend.sh"
    chmod +x "$PROJECT_DIR/start-frontend.sh"

    log_info "✅ 启动脚本已创建"
}

# 创建系统服务（可选）
create_system_services() {
    log_step "配置系统服务"

    log_info "创建系统服务需要额外配置"
    log_info "已创建启动脚本，可手动启动"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙"

    # 检查防火墙是否开启
    if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled: 1"; then
        log_info "防火墙已启用，添加端口规则..."

        # 添加端口规则
        /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/nginx
        /usr/libexec/ApplicationFirewall/socketfilterfw --add 3001
        /usr/libexec/ApplicationFirewall/socketfilterfw --add 5173

        log_info "✅ 防火墙规则已添加"
    else
        log_info "防火墙未启用，跳过配置"
    fi
}

# 测试服务
test_services() {
    log_step "测试服务"

    PROJECT_DIR="/opt/mac-panel"

    # 停止现有服务
    log_info "停止现有服务..."
    cd "$PROJECT_DIR"
    pkill -f "backend/dist/app.js" || true
    pkill -f "http.server 5173" || true
    sleep 2

    # 启动后端
    log_info "启动后端服务..."
    cd "$PROJECT_DIR/backend"
    export NODE_ENV=production
    nohup node dist/app.js > "$PROJECT_DIR/backend/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_DIR/backend/backend.pid"

    sleep 3

    # 检查后端
    if curl -s http://localhost:3001/api/system/info > /dev/null; then
        log_info "✅ 后端服务启动成功"
    else
        log_error "后端服务启动失败"
        cat "$PROJECT_DIR/backend/backend.log"
        exit 1
    fi

    # 启动前端
    log_info "启动前端服务..."
    cd "$PROJECT_DIR/frontend/dist"
    nohup python3 -m http.server 5173 > "$PROJECT_DIR/frontend/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_DIR/frontend/frontend.pid"

    sleep 2

    # 检查前端
    if curl -s http://localhost:5173 > /dev/null; then
        log_info "✅ 前端服务启动成功"
    else
        log_error "前端服务启动失败"
        exit 1
    fi
}

# 创建快捷命令
create_shortcuts() {
    log_step "创建管理命令"

    BIN_DIR="/usr/local/bin"
    PROJECT_DIR="/opt/mac-panel"

    cat > "$BIN_DIR/mac-panel" << 'EOF'
#!/bin/bash
# Mac Panel 管理命令

PROJECT_DIR="/opt/mac-panel"
ACTION="$1"

case "$ACTION" in
    start)
        echo "启动 Mac Panel 服务..."
        cd "$PROJECT_DIR/backend"
        export NODE_ENV=production
        nohup node dist/app.js > "$PROJECT_DIR/backend/backend.log" 2>&1 &
        echo $! > "$PROJECT_DIR/backend/backend.pid"

        cd "$PROJECT_DIR/frontend/dist"
        nohup python3 -m http.server 5173 > "$PROJECT_DIR/frontend/frontend.log" 2>&1 &
        echo $! > "$PROJECT_DIR/frontend/frontend.pid"

        echo "✅ 服务已启动"
        echo "前端: http://localhost:5173"
        echo "后端: http://localhost:3001"
        ;;

    stop)
        echo "停止 Mac Panel 服务..."
        pkill -f "backend/dist/app.js"
        pkill -f "http.server 5173"
        echo "✅ 服务已停止"
        ;;

    restart)
        echo "重启 Mac Panel 服务..."
        "$0" stop
        sleep 2
        "$0" start
        ;;

    status)
        echo "Mac Panel 服务状态:"
        echo ""

        # 后端状态
        if pgrep -f "backend/dist/app.js" > /dev/null; then
            echo "✅ 后端: 运行中 (PID: $(pgrep -f 'backend/dist/app.js' | head -1))"
            echo "   访问地址: http://localhost:3001"
        else
            echo "❌ 后端: 未运行"
        fi

        # 前端状态
        if pgrep -f "http.server 5173" > /dev/null; then
            echo "✅ 前端: 运行中 (PID: $(pgrep -f 'http.server 5173' | head -1))"
            echo "   访问地址: http://localhost:5173"
        else
            echo "❌ 前端: 未运行"
        fi

        # Nginx状态
        if pgrep nginx > /dev/null; then
            echo "✅ Nginx: 运行中"
        else
            echo "❌ Nginx: 未运行"
        fi
        ;;

    logs)
        echo "后端日志 (最近50行):"
        tail -50 "$PROJECT_DIR/backend/backend.log"
        ;;

    update)
        echo "更新 Mac Panel..."
        cd "$PROJECT_DIR"
        git pull
        cd backend && npm install
        cd frontend && npm install && npm run build
        "$0" restart
        echo "✅ 更新完成"
        ;;

    *)
        echo "Mac Panel 管理工具"
        echo ""
        echo "用法: mac-panel {start|stop|restart|status|logs|update}"
        echo ""
        echo "命令:"
        echo "  start    - 启动所有服务"
        echo "  stop     - 停止所有服务"
        echo "  restart  - 重启所有服务"
        echo "  status   - 查看服务状态"
        echo "  logs     - 查看后端日志"
        echo "  update   - 更新到最新版本"
        echo ""
        ;;
esac
EOF

    chmod +x "$BIN_DIR/mac-panel"

    log_info "✅ 管理命令已创建: $BIN_DIR/mac-panel"
}

# 显示安装完成信息
show_completion() {
    log_step "安装完成！"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Mac Panel 安装成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📱 访问地址："
    echo "   前端: http://localhost:5173"
    echo "   后端: http://localhost:3001"
    echo ""
    echo "🔑 默认管理员账号："
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo ""
    echo "📚 管理命令："
    echo "   mac-panel start    - 启动服务"
    echo "   mac-panel stop     - 停止服务"
    echo "   mac-panel restart  - 重启服务"
    echo "   mac-panel status   - 查看状态"
    echo "   mac-panel logs     - 查看日志"
    echo ""
    echo "📖 详细文档："
    echo "   查看 README.md 和 INSTALL.md"
    echo ""
    echo -e "${YELLOW}⚠️  重要提示：${NC}"
    echo "   1. 请记录管理员密码"
    echo "   2. 首次登录后请立即修改密码"
    echo "   3. 建议配置 SSL 证书（生产环境）"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Mac Panel 一键安装脚本             ║${NC}"
    echo -e "${BLUE}║     版本: v2.8.1                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""

    check_root
    check_macos_version
    check_homebrew
    install_nodejs
    create_user
    setup_project_directory
    install_dependencies
    setup_permissions
    setup_sudoers
    create_launch_scripts
    create_system_services
    configure_firewall
    test_services
    create_shortcuts
    show_completion
}

# 运行主函数
main "$@"
