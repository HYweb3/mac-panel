# OpenClaw 智谱AI (ZhipuAI) 配置指南

## 配置完成 ✅

智谱AI API Key 已成功配置。

## API Key 信息

**API Key**: `112187b015ef42a78cf9b029daac1332.hjxRQaFYRV4PWSHq`

**配置位置**: `~/.openclaw/openclaw.json`

**配置路径**: `models.providers.zai.apiKey`

## 已配置的模型

### GLM-5 (默认模型)
- **模型ID**: `zai/glm-5`
- **别名**: `GLM`
- **上下文窗口**: 200k tokens
- **最大输出**: 131k tokens
- **输入类型**: 文本
- **推理能力**: 支持
- **状态**: ✅ 默认模型

### 其他可用模型
- **GLM-4.7**: `zai/glm-4.7`
- **GLM-4.7 Flash**: `zai/glm-4.7-flash`
- **GLM-4.7 FlashX**: `zai/glm-4.7-flashx`

## API 端点

**Base URL**: `https://open.bigmodel.cn/api/coding/paas/v4`

**API 类型**: OpenAI Completions 兼容

## 配置结构

```json
{
  "models": {
    "providers": {
      "zai": {
        "baseUrl": "https://openbigmodel.cn/api/coding/paas/v4",
        "api": "openai-completions",
        "apiKey": "112187b015ef42a78cf9b029daac1332.hjxRQaFYRV4PWSHq"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "zai/glm-5"
      }
    }
  }
}
```

## 使用方法

### 查看模型列表
```bash
openclaw models list
```

### 切换模型
```bash
# 使用 GLM-4.7 Flash
openclaw config set agents.defaults.model.primary zai/glm-4.7-flash

# 使用 GLM-4.7
openclaw config set agents.defaults.model.primary zai/glm-4.7
```

### 测试模型
```bash
# 通过微信发送消息测试
# 或通过 Dashboard: http://127.0.0.1:18789/
```

## 配置管理命令

### 查看 API Key
```bash
openclaw config get models.providers.zai.apiKey
```

### 更新 API Key
```bash
openclaw config set models.providers.zai.apiKey "新的API密钥"
```

### 查看完整配置
```bash
cat ~/.openclaw/openclaw.json | jq '.models.providers.zai'
```

### 验证配置
```bash
openclaw config validate
```

## 服务状态

### 当前运行状态
```bash
openclaw status
```

**关键信息**:
- Gateway: `ws://127.0.0.1:18789`
- Dashboard: `http://127.0.0.1:18789/`
- 默认模型: `zai/glm-5`
- 服务状态: 运行中

### 查看日志
```bash
# 网关日志
cat ~/.openclaw/logs/gateway.log | tail -50

# OpenClaw 主日志
tail -f /tmp/openclaw/openclaw-*.log
```

## 热重载

OpenClaw 支持配置热重载，修改 API Key 后会自动生效：

```
[reload] config change detected; evaluating reload
[reload] config hot reload applied (models.providers.zai.apiKey)
```

无需手动重启服务。

## 模型特性

### GLM-5 特性
- ✅ 超长上下文 (200k tokens)
- ✅ 强大推理能力
- ✅ 代码生成优化
- ✅ 多轮对话支持

### 使用场景
- 代码生成和审查
- 复杂问题推理
- 长文本处理
- 技术文档编写

## 成本说明

当前配置中成本设为 0：
```json
"cost": {
  "input": 0,
  "output": 0,
  "cacheRead": 0,
  "cacheWrite": 0
}
```

实际使用时需要根据智谱AI的定价策略更新。

## 故障排查

### 1. API Key 无效
**症状**: 模型调用失败，认证错误

**解决**:
```bash
# 检查 API Key 是否正确
openclaw config get models.providers.zai.apiKey

# 更新为正确的 API Key
openclaw config set models.providers.zai.apiKey "正确的API密钥"
```

### 2. 模型未加载
**症状**: 模型列表为空

**解决**:
```bash
# 验证配置
openclaw config validate

# 重启服务
launchctl stop ai.openclaw.gateway
launchctl start ai.openclaw.gateway
```

### 3. 连接超时
**症状**: API 请求超时

**解决**:
- 检查网络连接
- 确认 API 端点可访问: `https://open.bigmodel.cn`
- 查看日志排查具体错误

## 安全建议

1. **保护 API Key**
   - 不要在公开代码中暴露 API Key
   - 定期轮换 API Key
   - 使用环境变量存储（可选）

2. **访问控制**
   - Gateway 使用 token 认证
   - 仅允许本地访问 (loopback)
   - 监控异常使用

3. **备份配置**
   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup
   ```

## 相关资源

- **智谱AI官网**: https://open.bigmodel.cn/
- **API文档**: https://open.bigmodel.cn/dev/api
- **模型列表**: https://open.bigmodel.cn/dev/model
- **OpenClaw文档**: https://docs.openclaw.ai/

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-22 | v2026.3.13 | 配置智谱AI API Key，设置 GLM-5 为默认模型 |

---

**配置时间**: 2026-03-22
**OpenClaw 版本**: 2026.3.13 (61d171a)
**智谱AI API Key**: 112187b015ef42a78cf9b029daac1332.hjxRQaFYRV4PWSHq
