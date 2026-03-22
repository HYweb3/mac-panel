# OpenClaw 启动管理指南

## 基本信息

- **版本**: OpenClaw 2026.3.13 (61d171a)
- **安装路径**: `/Users/www1/.npm-global/lib/node_modules/openclaw`
- **命令路径**: `/Users/www1/.nvm/versions/node/v24.14.0/bin/openclaw`
- **配置目录**: `~/.openclaw`

## 服务架构

OpenClaw 包含以下组件：
- **openclaw-gateway**: 网关服务
- **openclaw-plugins**: 插件服务
- **openclaw**: 主命令行工具

## 启动方式

### 1. 系统服务方式（推荐）

OpenClaw 通过 launchd 管理，作为系统服务运行：

```bash
# 启动服务
launchctl start ai.openclaw.gateway

# 停止服务
launchctl stop ai.openclaw.gateway

# 重启服务
launchctl stop ai.openclaw.gateway
sleep 2
launchctl start ai.openclaw.gateway

# 查看服务状态
launchctl list | grep openclaw
```

### 2. 命令行方式

```bash
# 查看状态
openclaw status

# 直接启动（如果服务未运行）
openclaw
```

### 3. 进程管理方式

```bash
# 查看运行中的进程
ps aux | grep openclaw | grep -v grep

# 强制终止所有进程
pkill -9 -f "openclaw-gateway|openclaw-plugins"

# 重启（终止后通过 launchd 自动启动）
pkill -9 -f openclaw
launchctl start ai.openclaw.gateway
```

## 完整重启脚本

```bash
#!/bin/bash
echo "重启 OpenClaw 服务..."

# 1. 停止服务
launchctl stop ai.openclaw.gateway

# 2. 强制终止所有进程
pkill -9 -f "openclaw-gateway|openclaw-plugins"

# 3. 等待清理
sleep 2

# 4. 启动服务
launchctl start ai.openclaw.gateway

# 5. 等待启动完成
sleep 3

# 6. 验证状态
openclaw status | head -15

echo "✓ OpenClaw 重启完成"
```

## 访问地址

- **Dashboard**: http://127.0.0.1:18789/
- **Gateway**: ws://127.0.0.1:18789

## 状态检查

```bash
# 检查服务状态
openclaw status

# 检查进程
ps aux | grep -E "openclaw-gateway|openclaw-plugins" | grep -v grep

# 检查端口
lsof -i :18789

# 检查 launchd 服务
launchctl list | grep openclaw
```

## 配置说明

### 插件白名单配置

如果使用了扩展插件（如 openclaw-weixin），需要在配置中设置白名单：

```json
{
  "plugins.allow": ["openclaw-weixin"]
}
```

配置文件位置：`~/.openclaw/config.json`

### 扩展目录

自定义插件放置在：
```
~/.openclaw/extensions/
├── openclaw-weixin/
│   └── index.ts
└── telegram-tts-plugin/
    └── ...
```

## 常见问题

### 1. 服务无法启动
```bash
# 检查日志
cat ~/.openclaw/logs/*.log

# 重新安装
npm install -g openclaw@latest
```

### 2. 网关连接失败
```bash
# 重启服务
launchctl stop ai.openclaw.gateway
launchctl start ai.openclaw.gateway

# 检查端口占用
lsof -i :18789
```

### 3. 插件无法加载
```bash
# 检查插件白名单配置
cat ~/.openclaw/config.json | grep plugins.allow

# 检查插件目录
ls -la ~/.openclaw/extensions/
```

## 卸载与重装

### 完全卸载
```bash
# 1. 停止服务
launchctl stop ai.openclaw.gateway

# 2. 卸载 npm 包
npm uninstall -g openclaw

# 3. 删除配置目录
rm -rf ~/.openclaw

# 4. 删除符号链接
rm -f /Users/www1/.nvm/versions/node/v24.14.0/bin/openclaw
```

### 重新安装
```bash
# 安装
npm install -g openclaw@latest

# 创建符号链接
ln -sf /Users/www1/.npm-global/lib/node_modules/openclaw/openclaw.mjs \
       /Users/www1/.nvm/versions/node/v24.14.0/bin/openclaw

# 启动服务
launchctl start ai.openclaw.gateway

# 验证
openclaw --version
openclaw status
```

## 快捷命令

可以创建别名简化操作：

```bash
# 添加到 ~/.zshrc
alias oc-status='openclaw status'
alias oc-restart='launchctl stop ai.openclaw.gateway && sleep 2 && launchctl start ai.openclaw.gateway'
alias oc-logs='tail -f ~/.openclaw/logs/*.log'
```

## 注意事项

1. **备份配置**: 卸载前务必备份 `~/.openclaw` 目录
2. **权限问题**: 确保有权限访问 `~/.openclaw` 目录
3. **端口冲突**: 确保 18789 端口未被其他服务占用
4. **Node 版本**: 当前使用 Node 24.14.0，注意版本兼容性

## 更新日志

- **2026-03-22**: 创建文档，记录启动方式和配置说明
- **版本**: 2026.3.13 (61d171a)
