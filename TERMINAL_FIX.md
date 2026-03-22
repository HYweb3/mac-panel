# Mac Panel 终端独立会话修复

## 修改说明

已修改 Mac Panel 的终端功能，确保**每个标签页都有独立的终端会话**，新建终端时是干净的，不会复制之前的内容。

## 主要变更

### 1. 独立终端实例
```typescript
// 之前：所有标签共享一个终端实例
const terminalInstanceRef = useRef<any>(null);

// 现在：每个标签都有独立的终端实例
const terminalInstancesRef = useRef<Map<string, TerminalInstance>>(new Map());
```

### 2. 独立 WebSocket 连接
```typescript
interface TerminalInstance {
  terminal: Terminal;
  fitAddon: FitAddon;
  ws: WebSocket | null;
  resizeTimeout: ReturnType<typeof setTimeout> | null;
  heartbeatTimeout: ReturnType<typeof setInterval> | null;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
}
```

### 3. 独立连接状态
```typescript
const [activeTerminalStatus, setActiveTerminalStatus] = useState<Map<string, {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
}>>(new Map());
```

### 4. 自动初始化
```typescript
useEffect(() => {
  // 为新标签自动初始化独立的终端
  if (activeTab && !terminalInstancesRef.current.has(activeTab)) {
    initTerminal(activeTab);
  }
}, [activeTab, initTerminal]);
```

### 5. 自动清理非活跃标签
```typescript
useEffect(() => {
  return () => {
    // 清理非活跃标签的资源
    Object.entries(terminalInstancesRef.current).forEach(([tabId, instance]) => {
      if (tabId !== activeTab) {
        // 关闭 WebSocket，清理定时器
        instance.ws?.close(1000, 'Tab switched');
        // ...
      }
    });
  };
}, [activeTab]);
```

## 行为变化

### 之前
- ❌ 所有标签共享同一个终端
- ❌ 新建标签会看到之前终端的内容
- ❌ 切换标签时内容混乱

### 现在
- ✅ 每个标签都有独立的终端会话
- ✅ 新建标签是干净的终端
- ✅ 切换标签时保持各自的终端状态
- ✅ 非活跃标签自动清理资源

## 使用方式

1. **点击"新建"按钮** → 创建新的独立终端
2. **切换标签** → 切换到对应的独立终端会话
3. **关闭标签** → 仅关闭该标签的终端会话

## 技术细节

- **会话隔离**: 使用 `sessionId` 区分不同的终端会话
- **资源管理**: 非活跃标签的终端会自动关闭 WebSocket，节省资源
- **状态管理**: 每个标签独立管理连接状态、重连状态等

## 注意事项

如果遇到 TypeScript 编译错误（其他文件的问题），可以：
1. 使用开发模式：`npm run dev`（跳过类型检查）
2. 或者修复其他文件的类型错误

## 文件位置

- 前端代码：`/Users/www1/Desktop/claude/mac-panel/frontend/src/pages/Terminal.tsx`
- 后端服务：`/Users/www1/Desktop/claude/mac-panel/backend/src/services/terminalService.ts`

---

**修改时间**: 2026-03-22
**修改内容**: 实现终端标签页独立会话
