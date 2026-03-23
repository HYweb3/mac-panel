# 终端二维码显示优化

## 问题描述
终端中显示的二维码无法扫描，通常是因为字符编码、字体渲染或终端配置不当导致的。

## 优化内容

### 1. 前端优化 (`frontend/src/pages/Terminal.tsx`)

**xterm.js 配置优化**:
- 添加更完整的等宽字体列表：`Monaco, Menlo, "Ubuntu Mono", "SF Mono", monospace`
- 设置 `lineHeight: 1.0` 和 `letterSpacing: 0` 确保字符精确对齐
- 添加完整的颜色主题支持
- 启用 `allowProposedApi` 使用最新 API
- 禁用可能干扰二维码的选项

### 2. 前端 CSS 优化 (`frontend/src/pages/Terminal.css`)

**样式优化**:
```css
/* 确保字符正确渲染 - 二维码需要精确的字符对齐 */
.terminal-instance .xterm-screen {
  font-feature-settings: "liga" 0, "calt" 0;
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 确保等宽字体正确显示 */
.terminal-instance .xterm-rows {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'SF Mono', 'Courier New', monospace;
  font-variant-ligatures: none;
}
```

### 3. 后端优化 (`backend/src/services/terminalService.ts`)

**环境变量优化**:
```typescript
const env = {
  ...process.env,
  TERM: 'xterm-256color',
  COLORTERM: 'truecolor',
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  LC_CTYPE: 'en_US.UTF-8',
  LESSCHARSET: 'utf-8',
  PYTHONIOENCODING: 'utf-8',  // Python 脚本的二维码
  NODE_ENV: process.env.NODE_ENV || 'development'
};
```

## 测试方法

### 方法 1: 使用测试脚本

运行项目根目录的测试脚本：
```bash
./test_qrcode_display.sh
```

### 方法 2: 在终端中测试

1. 打开 Mac Panel 的终端页面
2. 运行以下命令生成二维码：
```bash
echo "https://github.com/HYweb3/mac-panel" | qrencode -t ANSIUTF8
```

3. 使用手机扫描二维码验证是否可扫描

### 方法 3: 使用 npm login

某些 npm 命令会显示二维码用于登录：
```bash
npm login
# 按提示操作后会显示二维码
```

## 预期效果

- ✅ 二维码字符清晰对齐
- ✅ 没有变形或扭曲
- ✅ 手机可以成功扫描
- ✅ Unicode 块字符（█ ▀ ▄）正确显示

## 常见问题

### Q: 二维码仍然无法扫描
A: 请确保：
1. 终端窗口足够大（建议至少 80x24）
2. 浏览器缩放比例为 100%
3. 使用等宽字体
4. 系统已安装 qrencode：`brew install qrencode`

### Q: 二维码显示为乱码
A: 可能是编码问题，检查：
1. 后端环境变量中的 UTF-8 设置
2. 前端 xterm.js 的 encoding 配置
3. 浏览器的字符编码设置

### Q: 二维码字符间距不均匀
A: 检查：
1. CSS 中的 `letterSpacing: 0` 是否生效
2. 是否使用了等宽字体
3. 浏览器的渲染设置

## 依赖

- qrencode (用于生成测试二维码): `brew install qrencode`
- xterm.js (前端终端库)
- node-pty (后端伪终端)

## 相关文件

- `frontend/src/pages/Terminal.tsx` - 终端配置
- `frontend/src/pages/Terminal.css` - 终端样式
- `backend/src/services/terminalService.ts` - 终端服务
- `test_qrcode_display.sh` - 测试脚本

## 更新日期

2025-03-23
