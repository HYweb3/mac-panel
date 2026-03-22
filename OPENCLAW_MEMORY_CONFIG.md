# OpenClaw Memory (LanceDB Pro) 配置指南

## 配置完成 ✅

JINA API Key 已成功配置，memory-lancedb-pro 插件已启用。

## API Key 配置

**JINA API Key**: `jina_4dd4fc365eb848289812b3d13e1b8bc3ea250XzRb-pW8wicqv3JsAs6wJEo`

**配置状态**: ✅ 已配置并启用

## 插件配置

### 基础配置
```json
{
  "plugins": {
    "entries": {
      "memory-lancedb-pro": {
        "enabled": true,
        "config": {
          "embedding": {
            "apiKey": "jina_4dd4fc365eb848289812b3d13e1b8bc3ea250XzRb-pW8wicqv3JsAs6wJEo",
            "model": "jina-embeddings-v5-text-small",
            "baseURL": "https://api.jina.ai/v1",
            "dimensions": 1024,
            "taskQuery": "retrieval.query",
            "taskPassage": "retrieval.passage",
            "normalized": true
          },
          "retrieval": {
            "mode": "hybrid",
            "rerank": "cross-encoder",
            "rerankApiKey": "jina_4dd4fc365eb848289812b3d13e1b8bc3ea250XzRb-pW8wicqv3JsAs6wJEo"
          },
          "autoRecall": true,
          "enableManagementTools": true
        }
      }
    },
    "slots": {
      "memory": "memory-lancedb-pro"
    },
    "allow": [
      "openclaw-weixin",
      "telegram",
      "lossless-claw",
      "memory-lancedb-pro"
    ]
  }
}
```

## 插件功能

### 核心特性
- ✅ **混合检索**: 向量搜索 + BM25 全文搜索
- ✅ **重排序**: 使用 Jina Cross-Encoder 进行结果重排序
- ✅ **多范围隔离**: 支持不同内存范围（scopes）
- ✅ **长文本分块**: 自动处理超过上下文限制的文档
- ✅ **自动捕获**: 自动从对话中捕获重要信息
- ✅ **自动召回**: 自动注入相关记忆到上下文

### 配置选项

#### Embedding（向量化）
- **模型**: jina-embeddings-v5-text-small
- **维度**: 1024
- **任务分离**:
  - 查询: retrieval.query
  - 文档: retrieval.passage
- **标准化**: 已启用

#### Retrieval（检索）
- **模式**: hybrid（混合搜索）
- **向量权重**: 0.7
- **BM25权重**: 0.3
- **重排序**: cross-encoder
- **重排序模型**: jina-reranker-v3

#### 自动功能
- **自动召回**: 启用
- **管理工具**: 启用（memory_list, memory_stats）

## 数据库位置

**数据库路径**: `~/.openclaw/memory/lancedb-pro`

**数据结构**:
```
~/.openclaw/memory/lancedb-pro/
├── *.lance           # LanceDB 数据文件
└── metadata/         # 元数据
```

## 使用方法

### 查看内存统计
```bash
# 通过微信或 API 调用
memory_stats
```

### 列出记忆
```bash
memory_list
```

### 手动添加记忆
通过对话自动捕获，或使用 API 手动添加。

### 配置调整
```bash
# 修改配置
openclaw config set plugins.entries.memory-lancedb-pro.config.autoRecall true

# 查看配置
openclaw config get plugins.entries.memory-lancedb-pro
```

## 性能优化

### 检索参数调整
```json
{
  "retrieval": {
    "vectorWeight": 0.7,      // 向量搜索权重（0-1）
    "bm25Weight": 0.3,        // BM25 权重（0-1）
    "minScore": 0.3,          // 最小相关性分数
    "candidatePoolSize": 20   // 候选池大小
  }
}
```

### 时间衰减
```json
{
  "retrieval": {
    "recencyHalfLifeDays": 14,    // 新近度半衰期（天）
    "recencyWeight": 0.1,         // 新近度最大提升因子
    "timeDecayHalfLifeDays": 60   // 时间衰减半衰期（天）
  }
}
```

## 验证配置

### 检查插件状态
```bash
openclaw plugins list | grep "memory-lancedb-pro"
```

**预期输出**:
```
│ Memory (LanceDB Pro) │ memory-lancedb-pro │ loaded │ global:memory-lancedb-pro/index.ts │ 1.0.32
```

### 查看服务状态
```bash
openclaw status | grep Memory
```

**预期输出**:
```
│ Memory │ enabled (plugin memory-lancedb-pro)
```

### 测试 API Key
```bash
curl -s https://api.jina.ai/v1/embeddings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"test","model":"jina-embeddings-v5-text-small"}'
```

## 故障排查

### 1. Embedding/Retrieval FAIL
**症状**: 日志显示 `embedding: FAIL, retrieval: FAIL`

**可能原因**:
- API Key 无效
- 网络连接问题
- API 配额限制

**解决**:
```bash
# 验证 API Key
curl -s https://api.jina.ai/v1/embeddings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":"test","model":"jina-embeddings-v5-text-small"}'

# 查看详细日志
tail -f ~/.openclaw/logs/gateway.log | grep memory_lancedb
```

### 2. 插件未加载
**症状**: 插件列表中显示 disabled

**解决**:
```bash
# 检查白名单
openclaw config get plugins.allow

# 添加到白名单
openclaw config set plugins.allow '["memory-lancedb-pro"]'

# 重启服务
launchctl stop ai.openclaw.gateway
launchctl start ai.openclaw.gateway
```

### 3. 内存未自动捕获
**检查配置**:
```bash
openclaw config get plugins.entries.memory-lancedb-pro.config.autoCapture
```

**启用自动捕获**:
```bash
openclaw config set plugins.entries.memory-lancedb-pro.config.autoCapture true
```

## API 费用

**JINA Embeddings 定价**:
- 免费层：每月 100万 tokens
- jina-embeddings-v5-text-small：低成本

**监控使用**:
访问 JINA 控制台查看使用情况和账单。

## 高级配置

### 多范围隔离
```json
{
  "scopes": {
    "default": "global",
    "definitions": {
      "work": {
        "description": "工作相关记忆"
      },
      "personal": {
        "description": "个人记忆"
      }
    },
    "agentAccess": {
      "default": ["global", "work"],
      "work-agent": ["work"]
    }
  }
}
```

### Markdown 镜像
```json
{
  "mdMirror": {
    "enabled": true,
    "dir": "~/.openclaw/memory/md-mirror"
  }
}
```

## 相关资源

- **JINA AI**: https://jina.ai/
- **JINA Embeddings**: https://jina.ai/embeddings
- **LanceDB**: https://lancedb.com/
- **OpenClaw 文档**: https://docs.openclaw.ai/

## 配置历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-22 | 1.0.32 | 配置 JINA API Key，启用 memory-lancedb-pro |

---

**配置时间**: 2026-03-22
**OpenClaw 版本**: 2026.3.13 (61d171a)
**插件版本**: memory-lancedb-pro@1.0.32
**JINA 模型**: jina-embeddings-v5-text-small
