# OpenClaw 插件白名单配置说明

## 配置完成 ✅

已成功配置 openclaw-weixin 插件白名单。

## 配置文件位置

```bash
~/.openclaw/openclaw.json
```

## 当前配置

```json
{
  "plugins": {
    "allow": [
      "openclaw-weixin"
    ],
    "entries": {
      "openclaw-weixin": {
        "enabled": true
      }
    }
  }
}
```

## 配置说明

### plugins.allow 字段

- **作用**: 指定允许自动加载的插件 ID 列表
- **格式**: 字符串数组
- **必要性**: 防止未授权插件自动加载，提高安全性

### plugins.entries 字段

- **作用**: 定义已安装插件的启用状态
- **enabled**: true 表示启用该插件

## 添加其他插件到白名单

如果需要添加更多插件到白名单，编辑配置文件：

```bash
# 方法1: 使用 jq 命令
cat ~/.openclaw/openclaw.json | jq '.plugins.allow += ["plugin-id"]' > /tmp/config.json
mv /tmp/config.json ~/.openclaw/openclaw.json

# 方法2: 手动编辑
vim ~/.openclaw/openclaw.json
```

示例配置：
```json
{
  "plugins": {
    "allow": [
      "openclaw-weixin",
      "telegram-tts-plugin",
      "custom-plugin"
    ]
  }
}
```

## 重启服务使配置生效

修改配置后需要重启服务：

```bash
# 重启 OpenClaw
launchctl stop ai.openclaw.gateway
sleep 2
launchctl start ai.openclaw.gateway

# 验证配置
openclaw status
```

## 已安装的插件

当前系统已安装的插件：

### 1. openclaw-weixin
- **ID**: `openclaw-weixin`
- **版本**: 1.0.2
- **包名**: @tencent-weixin/openclaw-weixin
- **路径**: ~/.openclaw/extensions/openclaw-weixin
- **状态**: ✅ 已启用，已添加到白名单

### 2. telegram-tts-plugin
- **状态**: 已通过 npm 全局链接
- **配置**: 需要时可以添加到白名单

## 安全建议

1. **最小权限原则**: 只添加必要的插件到白名单
2. **定期审查**: 定期检查白名单中的插件是否仍然需要
3. **来源验证**: 只从可信来源安装插件
4. **版本管理**: 保持插件为最新稳定版本

## 故障排查

### 插件未加载

如果插件未加载，检查：

1. **白名单配置**
   ```bash
   cat ~/.openclaw/openclaw.json | jq '.plugins.allow'
   ```

2. **插件启用状态**
   ```bash
   cat ~/.openclaw/openclaw.json | jq '.plugins.entries'
   ```

3. **插件文件是否存在**
   ```bash
   ls -la ~/.openclaw/extensions/
   ```

4. **查看日志**
   ```bash
   tail -f ~/.openclaw/logs/*.log
   ```

### 警告信息

如果看到类似警告：
```
[plugins] plugins.allow is empty; discovered non-bundled plugins may auto-load
```

说明白名单为空，需要添加插件 ID。

## 配置备份

建议定期备份配置文件：

```bash
# 备份配置
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup

# 恢复配置
cp ~/.openclaw/openclaw.json.backup ~/.openclaw/openclaw.json
```

## 参考文档

- OpenClaw 启动管理指南: `/Users/www1/Desktop/claude/mac-panel/OPENCLAW_GUIDE.md`
- 插件开发文档: ~/.openclaw/extensions/openclaw-weixin/README.md

---

**配置时间**: 2026-03-22
**OpenClaw 版本**: 2026.3.13 (61d171a)
