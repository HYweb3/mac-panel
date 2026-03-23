import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, Space, message } from 'antd';
import { PlusOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useTerminalStore } from '../store';
import 'xterm/css/xterm.css';
import './Terminal.css';

// 重连配置
const MAX_RECONNECT_ATTEMPTS = 10; // 最大重连次数
const INITIAL_RECONNECT_DELAY = 1000; // 初始重连延迟（1秒）
const MAX_RECONNECT_DELAY = 30000; // 最大重连延迟（30秒）
const HEARTBEAT_INTERVAL = 30000; // 心跳间隔（30秒）

interface TerminalInstance {
  terminal: Terminal;
  fitAddon: FitAddon;
  container: HTMLDivElement;
  ws: WebSocket | null;
  resizeTimeout: ReturnType<typeof setTimeout> | null;
  heartbeatTimeout: ReturnType<typeof setInterval> | null;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
}

export default function TerminalPage() {
  const [searchParams] = useSearchParams();
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const terminalInstancesRef = useRef<Map<string, TerminalInstance>>(new Map());

  const [activeTerminalStatus, setActiveTerminalStatus] = useState<Map<string, {
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempt: number;
  }>>(new Map());

  const { tabs, activeTab, addTab, removeTab, setActiveTab } = useTerminalStore();

  // 启动心跳
  const startHeartbeat = useCallback((ws: WebSocket, tabId: string) => {
    console.log(`[Terminal ${tabId}] Starting heartbeat...`);

    const instance = terminalInstancesRef.current.get(tabId);
    if (!instance) return;

    if (instance.heartbeatTimeout) {
      clearInterval(instance.heartbeatTimeout);
    }

    instance.heartbeatTimeout = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`[Terminal ${tabId}] Sending ping...`);
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // 停止心跳
  const stopHeartbeat = useCallback((tabId: string) => {
    const instance = terminalInstancesRef.current.get(tabId);
    if (instance && instance.heartbeatTimeout) {
      clearInterval(instance.heartbeatTimeout);
      instance.heartbeatTimeout = null;
      console.log(`[Terminal ${tabId}] Heartbeat stopped`);
    }
  }, []);

  // 计算重连延迟（指数退避）
  const calculateReconnectDelay = useCallback((attempt: number) => {
    return Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(2, attempt),
      MAX_RECONNECT_DELAY
    );
  }, []);

  // 自动重连
  const scheduleReconnect = useCallback((terminal: Terminal, tabId: string, attempt: number) => {
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`[Terminal ${tabId}] Max reconnect attempts reached`);
      setActiveTerminalStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(tabId, { isConnected: false, isReconnecting: false, reconnectAttempt: 0 });
        return newStatus;
      });
      terminal.write('\r\n✗ Max reconnect attempts reached. Please refresh.\r\n');
      message.error('连接失败，请刷新页面重试');
      return;
    }

    const delay = calculateReconnectDelay(attempt);
    setActiveTerminalStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(tabId, { isConnected: false, isReconnecting: true, reconnectAttempt: attempt });
      return newStatus;
    });

    terminal.write(`\r\n⚠ Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s... (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS})\r\n`);

    const instance = terminalInstancesRef.current.get(tabId);
    if (instance) {
      instance.reconnectTimeout = setTimeout(() => {
        console.log(`[Terminal ${tabId}] Reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS}`);
        connectWebSocket(terminal, tabId, attempt + 1);
      }, delay);
    }
  }, [calculateReconnectDelay]);

  // 连接 WebSocket
  const connectWebSocket = useCallback((terminal: Terminal, tabId: string, attempt = 0) => {
    console.log(`[Terminal ${tabId}] Connecting to WebSocket...`);
    const token = localStorage.getItem('token');

    const TERMINAL_WS_URL = import.meta.env.VITE_TERMINAL_WS_URL || 'ws://localhost:3002';
    const wsUrl = `${TERMINAL_WS_URL}/ws/terminal?token=${token}`;

    console.log(`[Terminal ${tabId}] WebSocket URL:`, token ? wsUrl.replace(token, '***') : wsUrl);

    const ws = new WebSocket(wsUrl);

    // 保存到实例中
    const instance = terminalInstancesRef.current.get(tabId);
    if (instance) {
      instance.ws = ws;
    }

    ws.onopen = () => {
      console.log(`[Terminal ${tabId}] WebSocket connected`);
      setActiveTerminalStatus(prev => {
        const newStatus = new Map(prev);
        newStatus.set(tabId, { isConnected: true, isReconnecting: false, reconnectAttempt: 0 });
        return newStatus;
      });

      // 清除重连定时器
      const instance = terminalInstancesRef.current.get(tabId);
      if (instance && instance.reconnectTimeout) {
        clearTimeout(instance.reconnectTimeout);
        instance.reconnectTimeout = null;
      }

      // 启动心跳
      startHeartbeat(ws, tabId);

      // 清空终端内容（干净的终端）
      terminal.clear();
      terminal.write('\r\n✓ Connected to terminal\r\n');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'data':
            terminal.write(message.data);
            break;

          case 'ready':
            console.log(`[Terminal ${tabId}] Terminal ready:`, message);
            // 清空终端，显示干净的状态
            terminal.clear();
            terminal.write(`\r\n✓ Terminal ready\r\n`);
            terminal.write(`Session: ${message.sessionId}\r\n`);
            terminal.write(`Shell: ${message.shell}\r\n`);
            terminal.write(`Directory: ${message.cwd}\r\n\r\n`);

            // Check if workdir parameter is provided
            const workDir = searchParams.get('workdir');
            if (workDir && ws.readyState === WebSocket.OPEN) {
              console.log('[Terminal] Changing to work directory:', workDir);
              terminal.write(`→ Changing to: ${workDir}\r\n`);
              ws.send(JSON.stringify({ type: 'input', data: `cd "${workDir}"\r` }));
            }
            break;

          case 'exit':
            console.log('[Terminal] Terminal exited:', message);
            terminal.write(`\r\n✓ Terminal exited (code: ${message.exitCode})\r\n`);
            setActiveTerminalStatus(prev => {
              const newStatus = new Map(prev);
              const current = newStatus.get(tabId) || { isConnected: false, isReconnecting: false, reconnectAttempt: 0 };
              newStatus.set(tabId, { ...current, isConnected: false });
              return newStatus;
            });
            break;

          case 'error':
            console.error('[Terminal] Error:', message);
            terminal.write(`\r\n✗ Error: ${message.message}\r\n`);
            setActiveTerminalStatus(prev => {
              const newStatus = new Map(prev);
              const current = newStatus.get(tabId) || { isConnected: false, isReconnecting: false, reconnectAttempt: 0 };
              newStatus.set(tabId, { ...current, isConnected: false });
              return newStatus;
            });
            break;

          case 'pong':
            // 心跳响应
            console.log('[Terminal] Pong received');
            break;

          default:
            if (message.data) {
              terminal.write(message.data);
            }
        }
      } catch (error) {
        console.error('[Terminal] Error parsing message:', error);
        terminal.write(event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('[Terminal] WebSocket error:', error);
      if (attempt === 0) {
        terminal.write('\r\n✗ Connection error\r\n');
      }
      setActiveTerminalStatus(prev => {
        const newStatus = new Map(prev);
        const current = newStatus.get(tabId) || { isConnected: false, isReconnecting: false, reconnectAttempt: 0 };
        newStatus.set(tabId, { ...current, isConnected: false });
        return newStatus;
      });
    };

    ws.onclose = (event) => {
      console.log(`[Terminal ${tabId}] WebSocket closed:`, { code: event.code, reason: event.reason });
      setActiveTerminalStatus(prev => {
        const newStatus = new Map(prev);
        const current = newStatus.get(tabId) || { isConnected: false, isReconnecting: false, reconnectAttempt: 0 };
        newStatus.set(tabId, { ...current, isConnected: false });
        return newStatus;
      });
      stopHeartbeat(tabId);

      // 如果不是主动关闭，尝试重连
      if (event.code !== 1000) {
        console.log(`[Terminal ${tabId}] Connection lost, scheduling reconnect...`);
        scheduleReconnect(terminal, tabId, attempt);
      }
    };

    terminal.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // 监听终端尺寸变化
    const handleResize = () => {
      const currentInstance = terminalInstancesRef.current.get(tabId);
      if (currentInstance && currentInstance.ws && currentInstance.ws.readyState === WebSocket.OPEN) {
        currentInstance.fitAddon.fit();
        const dims = { cols: terminal.cols, rows: terminal.rows };
        currentInstance.ws.send(JSON.stringify({ type: 'resize', data: dims }));
      }
    };

    window.addEventListener('resize', handleResize);

    // 初始尺寸
    const currentInstance = terminalInstancesRef.current.get(tabId);
    if (currentInstance) {
      if (currentInstance.resizeTimeout) {
        clearTimeout(currentInstance.resizeTimeout);
      }
      currentInstance.resizeTimeout = setTimeout(() => {
        handleResize();
      }, 500);
    }
  }, [startHeartbeat, stopHeartbeat, scheduleReconnect, searchParams]);

  // 手动重连
  const handleManualReconnect = useCallback((tabId: string) => {
    const instance = terminalInstancesRef.current.get(tabId);
    if (!instance) return;

    console.log(`[Terminal ${tabId}] Manual reconnect triggered`);

    // 关闭现有连接
    if (instance.ws) {
      instance.ws.close(1000, 'Manual reconnect');
    }

    // 重置状态
    setActiveTerminalStatus(prev => {
      const newStatus = new Map(prev);
      newStatus.set(tabId, { isConnected: false, isReconnecting: true, reconnectAttempt: 0 });
      return newStatus;
    });

    // 立即重连
    connectWebSocket(instance.terminal, tabId, 0);
  }, [connectWebSocket, startHeartbeat]);

  const initTerminal = useCallback((tabId: string) => {
    console.log(`[Terminal ${tabId}] Initializing terminal...`);

    // 为每个终端创建独立的 DOM 容器
    const container = document.createElement('div');
    container.className = 'terminal-instance';

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "SF Mono", monospace',
      fontWeight: 400,
      fontWeightBold: 700,
      lineHeight: 1.0,
      letterSpacing: 0,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
      convertEol: false,
      scrollback: 1000,
      cursorStyle: 'block',
      macOptionIsMeta: false,
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(container);
    fitAddon.fit();

    const instance: TerminalInstance = {
      terminal,
      fitAddon,
      container,
      ws: null,
      resizeTimeout: null,
      heartbeatTimeout: null,
      reconnectTimeout: null,
      isConnected: false,
      isReconnecting: false,
      reconnectAttempt: 0,
    };

    terminalInstancesRef.current.set(tabId, instance);
    console.log(`[Terminal ${tabId}] Terminal instance created`);

    connectWebSocket(terminal, tabId, 0);
  }, [connectWebSocket, startHeartbeat]);

  // 初始化或切换终端
  useEffect(() => {
    if (activeTab && !terminalInstancesRef.current.has(activeTab)) {
      console.log(`[Terminal] Initializing terminal for tab: ${activeTab}`);
      initTerminal(activeTab);
    }

    // 切换显示活跃的终端
    terminalInstancesRef.current.forEach((instance, tabId) => {
      if (instance.container) {
        instance.container.style.display = tabId === activeTab ? 'block' : 'none';
        // 确保容器在 DOM 中
        if (terminalContainerRef.current && !terminalContainerRef.current.contains(instance.container)) {
          terminalContainerRef.current.appendChild(instance.container);
        }
      }
      // 切换标签时调整活跃终端的尺寸
      if (tabId === activeTab) {
        setTimeout(() => {
          instance.fitAddon.fit();
        }, 100);
      }
    });
  }, [activeTab, initTerminal]);

  // 组件卸载时清理所有资源
  useEffect(() => {
    console.log('[Terminal] Component mounted');

    return () => {
      console.log('[Terminal] Component unmounting, cleaning up all terminals...');
      terminalInstancesRef.current.forEach((instance, tabId) => {
        console.log(`[Terminal] Cleaning up terminal: ${tabId}`);
        if (instance.ws) {
          instance.ws.close(1000, 'Component unmount');
        }
        if (instance.heartbeatTimeout) {
          clearInterval(instance.heartbeatTimeout);
        }
        if (instance.reconnectTimeout) {
          clearTimeout(instance.reconnectTimeout);
        }
        if (instance.resizeTimeout) {
          clearTimeout(instance.resizeTimeout);
        }
      });
      terminalInstancesRef.current.clear();
    };
  }, []);

  const handleNewTab = () => {
    const newTabId = Date.now().toString();
    const newTab = {
      id: newTabId,
      title: `Terminal ${tabs.length + 1}`,
    };
    addTab(newTab);
    setActiveTab(newTabId);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) {
      return;
    }
    removeTab(tabId);
  };

  // 格式化重连延迟
  const formatDelay = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="terminal-page">
      <div className="terminal-header">
        <Space className="terminal-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`terminal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.title}</span>
              {tabs.length > 1 && (
                <CloseOutlined
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                />
              )}
            </div>
          ))}
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleNewTab}
          >
            新建
          </Button>
        </Space>

        <Space>
          <div className="connection-status">
            <span className={`status-indicator ${(activeTerminalStatus.get(activeTab)?.isConnected || false) ? 'connected' : ''}`} />
            {(activeTerminalStatus.get(activeTab)?.isConnected || false) ? '已连接' :
             (activeTerminalStatus.get(activeTab)?.isReconnecting || false) ?
              `重连中... (${activeTerminalStatus.get(activeTab)?.reconnectAttempt || 0}/${MAX_RECONNECT_ATTEMPTS})` : '未连接'}
          </div>

          {!(activeTerminalStatus.get(activeTab)?.isConnected || false) && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleManualReconnect(activeTab)}
              loading={activeTerminalStatus.get(activeTab)?.isReconnecting || false}
            >
              重连
            </Button>
          )}
        </Space>
      </div>

      <Card className="terminal-card" bodyStyle={{ padding: 0 }}>
        <div ref={terminalContainerRef} className="terminal-container" />
      </Card>
    </div>
  );
}
