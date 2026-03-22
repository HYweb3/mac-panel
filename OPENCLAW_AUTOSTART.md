# OpenClaw 开机启动配置指南

## 配置完成 ✅

OpenClaw 已配置为开机自动启动。

## 配置文件信息

**配置文件路径**: `~/Library/LaunchAgents/ai.openclaw.gateway.plist`

**关键配置**:
```xml
<key>RunAtLoad</key>
<true/>        <!-- 加载时自动启动 -->

<key>KeepAlive</key>
<true/>        <!-- 保持运行，崩溃自动重启 -->
```

## 开机启动工作原理

1. **LaunchAgent**: macOS 用户级服务管理器
2. **RunAtLoad**: 用户登录时自动启动服务
3. **KeepAlive**: 服务崩溃时自动重启
4. **ThrottleInterval**: 重启间隔 60 秒，防止频繁重启

## 服务管理命令

### 查看服务状态
```bash
launchctl list | grep openclaw
```

### 启动服务
```bash
launchctl start ai.openclaw.gateway
```

### 停止服务
```bash
launchctl stop ai.openclaw.gateway
```

### 重启服务
```bash
launchctl stop ai.openclaw.gateway
sleep 2
launchctl start ai.openclaw.gateway
```

### 重新加载配置
```bash
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

## 配置文件详解

### 完整配置路径
```bash
~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

### 关键配置项

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Label | ai.openclaw.gateway | 服务唯一标识 |
| RunAtLoad | true | 加载时启动（开机启动） |
| KeepAlive | true | 保持运行 |
| ThrottleInterval | 60 | 重启间隔（秒） |
| WorkingDirectory | ~/.openclaw | 工作目录 |

### 执行路径
```xml
<key>ProgramArguments</key>
<array>
  <string>/Users/www1/.npm-global/bin/node</string>
  <string>/Users/www1/.npm-global/lib/node_modules/openclaw/openclaw.mjs</string>
  <string>gateway</string>
</array>
```

### 日志文件
- **标准输出**: `~/.openclaw/logs/gateway.log`
- **错误输出**: `~/.openclaw/logs/gateway.err.log`

## 验证开机启动

### 方法 1: 查看服务列表
```bash
launchctl list | grep openclaw
# 输出: -  78  ai.openclaw.gateway
# PID 为 "-" 表示服务已加载但未运行
# PID 为数字表示正在运行
```

### 方法 2: 检查进程
```bash
ps aux | grep openclaw | grep -v grep
```

### 方法 3: 检查端口
```bash
lsof -i :18789
```

### 方法 4: 查看 OpenClaw 状态
```bash
openclaw status
```

## 测试开机启动

重启电脑后验证：
```bash
# 1. 检查服务是否自动启动
launchctl list | grep openclaw

# 2. 检查进程是否运行
ps aux | grep openclaw | grep -v grep

# 3. 检查端口是否监听
lsof -i :18789

# 4. 检查 OpenClaw 状态
openclaw status
```

## 配置备份

### 备份当前配置
```bash
cp ~/Library/LaunchAgents/ai.openclaw.gateway.plist \
   ~/Library/LaunchAgents/ai.openclaw.gateway.plist.backup
```

### 恢复配置
```bash
cp ~/Library/LaunchAgents/ai.openclaw.gateway.plist.backup \
   ~/Library/LaunchAgents/ai.openclaw.gateway.plist

launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

## 修改配置

如果需要修改配置：

1. **编辑配置文件**
   ```bash
   vim ~/Library/LaunchAgents/ai.openclaw.gateway.plist
   ```

2. **重新加载服务**
   ```bash
   launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist
   launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
   ```

3. **验证配置**
   ```bash
   launchctl list | grep openclaw
   ```

## 常见问题

### 1. 服务未自动启动

**检查**:
```bash
# 查看服务状态
launchctl list | grep openclaw

# 查看错误日志
cat ~/.openclaw/logs/gateway.err.log
```

**解决**:
```bash
# 手动启动服务
launchctl start ai.openclaw.gateway

# 查看启动失败原因
launchctl list | grep openclaw
```

### 2. 服务频繁重启

**原因**: 程序启动后立即崩溃

**解决**:
```bash
# 查看错误日志
cat ~/.openclaw/logs/gateway.err.log | tail -50

# 检查配置文件
cat ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

### 3. 配置文件无效

**检查 plist 语法**:
```bash
plutil -lint ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

**修复**: 重新创建配置文件

### 4. 权限问题

**确保文件权限正确**:
```bash
chmod 644 ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

## 卸载开机启动

如果需要移除开机启动：

```bash
# 1. 停止服务
launchctl stop ai.openclaw.gateway

# 2. 卸载服务
launchctl unload ~/Library/LaunchAgents/ai.openclaw.gateway.plist

# 3. 删除配置文件
rm ~/Library/LaunchAgents/ai.openclaw.gateway.plist

# 4. 验证
launchctl list | grep openclaw
```

## 相关文档

- **OpenClaw 启动管理指南**: `/Users/www1/Desktop/claude/mac-panel/OPENCLAW_GUIDE.md`
- **插件配置说明**: `/Users/www1/Desktop/claude/mac-panel/OPENCLAW_CONFIG.md`

## 配置历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-09 | v2026.2.26 | 初始配置（使用 nvm 路径） |
| 2026-03-22 | v2026.3.13 | 更新为 npm-global 路径，配置开机启动 |

---

**配置时间**: 2026-03-22
**OpenClaw 版本**: 2026.3.13 (61d171a)
**macOS 版本**: 26.1 (arm64)
