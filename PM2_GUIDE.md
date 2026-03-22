# Mac Panel 守护进程使用指南

## ✅ 已完成的配置

1. ✅ 前端端口已修改为 **5188**（原5173）
2. ✅ 安装 PM2 进程管理器
3. ✅ 配置守护进程自动重启
4. ✅ 创建控制脚本 `mac-panel-ctl.sh`

## 🚀 使用方法

### 方式一：使用控制脚本（推荐）

```bash
cd /Users/www1/Desktop/claude/mac-panel
./mac-panel-ctl.sh [命令]
```

**可用命令：**
- `start` - 启动服务
- `stop` - 停止服务
- `restart` - 重启服务
- `status` - 查看状态
- `logs` - 查看日志
- `reload` - 热重载（零停机）
- `monitor` - 实时监控

### 方式二：直接使用 PM2

```bash
export PATH="/Users/www1/.npm-global/bin:$PATH"

# 启动服务
pm2 start ecosystem.config.json

# 停止服务
pm2 stop all

# 重启服务
pm2 restart all

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 实时监控
pm2 monit
```

## 🌐 访问地址

- **本地访问**: http://localhost:5188
- **局域网访问**: http://192.168.0.77:5188

## 🛡️ 守护进程特性

### 自动重启
- ✅ 进程崩溃时自动重启
- ✅ 最多重启10次（防止无限重启）
- ✅ 内存超限自动重启（后端500MB，前端1GB）

### 日志管理
- ✅ 所有日志保存在 `logs/` 目录
- ✅ 自动分割错误日志和输出日志
- ✅ 日志文件带时间戳

### 配置文件
- **PM2配置**: `ecosystem.config.json`
- **前端配置**: `frontend/vite.config.ts`（端口5188）

## 📊 服务状态

### 后端服务
- **端口**: 3001
- **进程名**: mac-panel-backend
- **内存限制**: 500MB

### 前端服务
- **端口**: 5188
- **进程名**: mac-panel-frontend
- **内存限制**: 1GB

## 🔧 故障排查

### 服务无法启动
```bash
# 查看详细日志
./mac-panel-ctl.sh logs

# 检查端口占用
lsof -i:3001,5188

# 强制停止所有服务
pm2 delete all
```

### 查看实时日志
```bash
# 查看所有日志
pm2 logs

# 只看后端日志
pm2 logs mac-panel-backend

# 只看前端日志
pm2 logs mac-panel-frontend
```

### 重启单个服务
```bash
# 重启后端
pm2 restart mac-panel-backend

# 重启前端
pm2 restart mac-panel-frontend
```

## 💡 开机自启（可选）

如果需要开机自动启动，可以运行：

```bash
export PATH="/Users/www1/.npm-global/bin:$PATH"
pm2 startup
```

这会生成一个启动命令，按照提示执行即可。

## 📝 常用命令速查

| 命令 | 说明 |
|------|------|
| `./mac-panel-ctl.sh status` | 查看服务状态 |
| `./mac-panel-ctl.sh restart` | 重启所有服务 |
| `./mac-panel-ctl.sh logs` | 查看日志 |
| `pm2 monit` | 实时监控仪表盘 |
| `pm2 flush` | 清空日志文件 |

## 🎉 优势

1. **稳定性**: 进程崩溃自动恢复
2. **便捷性**: 一个命令管理所有服务
3. **监控性**: 实时查看资源使用情况
4. **日志性**: 完整的日志记录和查询
