# Cloudflare Tunnel 运行状态报告

## ✅ Tunnel 运行状态

### 当前状态
```
✅ Cloudflare Tunnel 运行中
   Tunnel ID: 63d3b14f-801a-47b7-a808-d02ff28fe982
   版本: 2026.2.0
   连接数: 2 (lax06, lax09)
   协议: HTTP/2
```

### 已配置的域名路由

| 域名 | 本地服务 | 端口 | 状态 |
|------|---------|------|------|
| open.ai9188.us | localhost | 9999 | ✅ 已配置 |
| www.ai9188.us | localhost | 80 | ✅ 已配置 |
| rss.ai9188.us | localhost | 8001 | ✅ 已配置 |
| deep.ai9188.us | localhost | 8002 | ✅ 已配置 |
| **im.ai99.us** | **localhost** | **8888** | ✅ 主要域名 |
| ims.ai9188.us | localhost | 8878 | ✅ 已配置 |
| ai9188.us | localhost | 9188 | ✅ 已配置 |
| www.ai99.us | localhost | 8099 | ✅ 已配置 |
| ai99.us | localhost | 8099 | ✅ 已配置 |
| test.ai9188.us | localhost | 8003 | ✅ 已配置 |
| test.ai99.us | localhost | 8004 | ✅ 已配置 |

### 主要访问地址

#### IM 服务
- **外网**: https://im.ai99.us
- **本地**: http://localhost:8888
- **WebSocket**: ws://im.ai99.us (通过 tunnel)

#### 其他服务
- https://www.ai99.us (端口 8099)
- https://ai99.us (端口 8099)

## 管理命令

### 使用服务脚本

```bash
# 进入服务目录
cd /Users/www1/services

# 查看状态
./cloudflare.sh status

# 启动 Tunnel
./cloudflare.sh start

# 停止 Tunnel
./cloudflare.sh stop

# 重启 Tunnel
./cloudflare.sh restart

# 查看日志
./cloudflare.sh logs

# 实时日志
./cloudflare.sh follow
```

### 直接使用 cloudflared

```bash
# 查看运行的 tunnel
ps aux | grep cloudflared

# 查看日志
cat /Users/www1/.cloudflared/tunnel.log
tail -f /Users/www1/.cloudflared/tunnel.log

# 停止所有 tunnel
pkill -9 cloudflared

# 手动启动（不使用 sudo）
cloudflared tunnel run --token <TOKEN> &
```

## 日志位置

- **主日志**: `/Users/www1/.cloudflared/tunnel.log`
- **凭证文件**: `/Users/www1/.cloudflared/63d3b14f-801a-47b7-a808-d02ff28ef982.json`
- **Metrics**: `http://127.0.0.1:20243/metrics`

## 连接信息

```
Tunnel ID: 63d3b14f-801a-47b7-a808-d02ff28ef982
Connector ID: baed8ef1-56cb-4d49-9d65-bd6b373e9f2c

连接位置:
- lax06 (Los Angeles, CA)
- lax09 (Los Angeles, CA)

协议: HTTP/2
ICMP 代理: 192.168.1.77
```

## 故障排查

### 1. Tunnel 未运行

**症状**: 无法通过外网访问服务

**解决**:
```bash
cd /Users/www1/services
./cloudflare.sh start
```

### 2. 连接超时

**检查本地服务**:
```bash
# 检查 IM 服务
curl http://localhost:8888/actuator/health

# 检查端口
lsof -i :8888
```

**检查 Tunnel 日志**:
```bash
tail -50 /Users/www1/.cloudflared/tunnel.log
```

### 3. DNS 解析问题

**验证 DNS**:
```bash
nslookup im.ai99.us
dig im.ai99.us
```

**检查 Cloudflare DNS 设置**:
访问 Cloudflare Dashboard → DNS → 查看对应的 CNAME 记录

### 4. 需要 sudo 权限

脚本使用 `sudo` 启动 cloudflared，如果遇到权限问题：

**选项 1**: 手动启动（不使用 sudo）
```bash
cloudflared tunnel run --token <TOKEN> &
```

**选项 2**: 配置 sudo 免密（谨慎）
```bash
# 编辑 sudoers
sudo visudo

# 添加以下行
www1 ALL=(ALL) NOPASSWD: /opt/homebrew/bin/cloudflared
```

## 性能监控

### 查看实时指标

```bash
curl http://127.0.0.1:20243/metrics
```

### 关键指标

- `tunnel_ha_connections`: HA 连接数
- `tunnel_counts`: Tunnel 计数
- `chunk_server_upload_streams`: 上传流数
- `chunk_server_download_streams`: 下载流数

## 安全建议

1. **使用 Cloudflare Access**
   - 添加额外的身份验证层
   - 配置 IP 白名单
   - 设置地理位置限制

2. **定期更新**
   ```bash
   brew upgrade cloudflare/cloudflared/cloudflared
   ```

3. **监控日志**
   ```bash
   # 定期检查异常访问
   tail -f /Users/www1/.cloudflared/tunnel.log | grep -i error
   ```

## 配置优化

### 调整 HA 连接数

当前配置尝试使用 4 个 HA 连接，但系统最多支持 2 个。

如需优化，在 Cloudflare Dashboard 中修改 tunnel 配置。

### 添加新域名

1. 在 Cloudflare Dashboard 中添加 DNS 记录
2. Tunnel 配置会自动更新（通过 cloudflared）

或使用命令：
```bash
cloudflared tunnel route dns <tunnel-id> <new-domain>
```

## 相关资源

- **Cloudflare Tunnel 文档**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **cloudflared GitHub**: https://github.com/cloudflare/cloudflared
- **项目 README**: `/Users/www1/services/README.md`

---

**报告时间**: 2026-03-22
**cloudflared 版本**: 2026.2.0
**Tunnel 状态**: ✅ 运行正常
**外网访问**: ✅ https://im.ai99.us
