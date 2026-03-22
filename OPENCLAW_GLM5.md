# OpenClaw 智谱 GLM-5 模型配置

## 配置完成 ✅

已成功添加智谱 GLM-5 系列最新模型。

## 已配置的模型

### GLM-5 系列（最新）

#### 1. GLM-5（旗舰模型）
- **模型ID**: `zai/glm-5`
- **别名**: `GLM`
- **上下文窗口**: 200k tokens
- **最大输出**: 131k tokens
- **推理能力**: ✅ 支持
- **状态**: ✅ 默认模型

#### 2. GLM-5 Flash（快速版）
- **模型ID**: `zai/glm-5-flash`
- **上下文窗口**: 200k tokens
- **最大输出**: 131k tokens
- **推理能力**: ✅ 支持
- **特点**: 响应速度快

#### 3. GLM-5 Air（轻量版）
- **模型ID**: `zai/glm-5-air`
- **上下文窗口**: 200k tokens
- **最大输出**: 131k tokens
- **推理能力**: ✅ 支持
- **特点**: 资源占用少

### GLM-4.7 系列

#### 4. GLM-4.7
- **模型ID**: `zai/glm-4.7`
- **上下文窗口**: 200k tokens
- **最大输出**: 131k tokens

#### 5. GLM-4.7 Flash
- **模型ID**: `zai/glm-4.7-flash`
- **上下文窗口**: 200k tokens

#### 6. GLM-4.7 FlashX
- **模型ID**: `zai/glm-4.7-flashx`
- **上下文窗口**: 200k tokens

## 模型切换

### 切换到 GLM-5 Flash
```bash
openclaw config set agents.defaults.model.primary zai/glm-5-flash
```

### 切换到 GLM-5 Air
```bash
openclaw config set agents.defaults.model.primary zai/glm-5-air
```

### 切换到 GLM-4.7
```bash
openclaw config set agents.defaults.model.primary zai/glm-4.7
```

### 恢复到 GLM-5（默认）
```bash
openclaw config set agents.defaults.model.primary zai/glm-5
```

## 模型特性对比

| 模型 | 上下文 | 速度 | 推理 | 适用场景 |
|------|--------|------|------|----------|
| GLM-5 | 200k | 中 | ✅ | 复杂推理、长文本 |
| GLM-5 Flash | 200k | 快 | ✅ | 快速响应、日常对话 |
| GLM-5 Air | 200k | 最快 | ✅ | 轻量任务、API调用 |
| GLM-4.7 | 200k | 中 | ✅ | 通用任务 |
| GLM-4.7 Flash | 200k | 快 | ✅ | 快速响应 |
| GLM-4.7 FlashX | 200k | 最快 | ✅ | 实时交互 |

## 配置文件

**配置路径**: `~/.openclaw/openclaw.json`

**模型配置**:
```json
{
  "models": {
    "providers": {
      "zai": {
        "baseUrl": "https://open.bigmodel.cn/api/coding/paas/v4",
        "api": "openai-completions",
        "apiKey": "112187b015ef42a78cf9b029daac1332.hjxRQaFYRV4PWSHq",
        "models": [
          {
            "id": "glm-5",
            "name": "GLM-5",
            "reasoning": true,
            "contextWindow": 204800,
            "maxTokens": 131072
          },
          {
            "id": "glm-5-flash",
            "name": "GLM-5 Flash",
            "reasoning": true,
            "contextWindow": 204800,
            "maxTokens": 131072
          },
          {
            "id": "glm-5-air",
            "name": "GLM-5 Air",
            "reasoning": true,
            "contextWindow": 204800,
            "maxTokens": 131072
          }
        ]
      }
    }
  }
}
```

## 使用场景推荐

### GLM-5（旗舰）
- 复杂代码生成
- 长文档分析
- 深度推理任务
- 技术架构设计

### GLM-5 Flash（快速）
- 日常对话
- 快速问答
- 实时交互
- 聊天助手

### GLM-5 Air（轻量）
- API 批量调用
- 成本敏感场景
- 简单任务处理
- 高并发需求

## API Key

**当前使用**: `112187b015ef42a78cf9b029daac1332.hjxRQaFYRV4PWSHq`

**更新 API Key**:
```bash
openclaw config set models.providers.zai.apiKey "新的API密钥"
```

## 验证配置

### 查看当前默认模型
```bash
openclaw config get agents.defaults.model.primary
```

### 查看所有模型
```bash
openclaw models list
```

### 测试模型
```bash
# 通过微信发送测试消息
# 或访问 Dashboard: http://127.0.0.1:18789/
```

## 性能优化建议

1. **长文本处理**: 使用 GLM-5（200k 上下文）
2. **实时交互**: 使用 GLM-5 Flash 或 Air
3. **批量任务**: 使用 GLM-5 Air 降低成本
4. **复杂推理**: 使用 GLM-5 获得最佳效果

## 热重载

配置修改后会自动热重载：
```bash
# 日志会显示
[reload] config hot reload applied
```

无需手动重启服务。

## 相关资源

- **智谱AI官网**: https://open.bigmodel.cn/
- **GLM-5 文档**: https://open.bigmodel.cn/dev/api#glm-5
- **模型对比**: https://open.bigmodel.cn/dev/model
- **OpenClaw 文档**: https://docs.openclaw.ai/

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-03-22 | 添加 GLM-5 系列最新模型（Flash、Air） |

---

**配置时间**: 2026-03-22
**OpenClaw 版本**: 2026.3.13 (61d171a)
**智谱AI 版本**: GLM-5 系列
