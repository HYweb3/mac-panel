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

export default function TerminalPage() {
  const [searchParams] = useSearchParams();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [reconnectDelay, setReconnectDelay] = useState(INITIAL_RECONNECT_DELAY);

  const { tabs, activeTab, addTab, removeTab, setActiveTab } = useTerminalStore();

  // 清理所有定时器
  const cleanupTimers = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 启动心跳
  const startHeartbeat = useCallback((ws: WebSocket) => {
    console.log('[Terminal] Starting heartbeat...');
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('[Terminal] Sending ping...');
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // 停止心跳
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
      console.log('[Terminal] Heartbeat stopped');
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
  const scheduleReconnect = useCallback((terminal: Terminal, attempt: number) => {
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Terminal] Max reconnect attempts reached');
      setIsReconnecting(false);
      setReconnectAttempt(0);
      terminal.write('\r\n✗ Max reconnect attempts reached. Please refresh.\r\n');
      message.error('连接失败，请刷新页面重试');
      return;
    }

    const delay = calculateReconnectDelay(attempt);
    setReconnectDelay(delay);
    setReconnectAttempt(attempt);
    setIsReconnecting(true);

    terminal.write(`\r\n⚠ Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s... (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS})\r\n`);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`[Terminal] Reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS}`);
      connectWebSocket(terminal, attempt + 1);
    }, delay);
  }, [calculateReconnectDelay]);

  // 连接 WebSocket
  const connectWebSocket = useCallback((terminal: Terminal, attempt = 0) => {
    console.log('[Terminal] Connecting to WebSocket...');
    const token = localStorage.getItem('token');

    const TERMINAL_WS_URL = import.meta.env.VITE_TERMINAL_WS_URL || 'ws://localhost:3002';
    const wsUrl = `${TERMINAL_WS_URL}/ws/terminal?token=${token}`;

    console.log('[Terminal] WebSocket URL:', wsUrl.replace(token, '***'));

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Terminal] WebSocket connected');
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempt(0);

      // 清除重连定时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // 启动心跳
      startHeartbeat(ws);

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
            console.log('[Terminal] Terminal ready:', message);
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
            setIsConnected(false);
            break;

          case 'error':
            console.error('[Terminal] Error:', message);
            terminal.write(`\r\n✗ Error: ${message.message}\r\n`);
            setIsConnected(false);
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
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('[Terminal] WebSocket closed:', { code: event.code, reason: event.reason });
      setIsConnected(false);
      stopHeartbeat();

      // 如果不是主动关闭，尝试重连
      if (event.code !== 1000) {
        console.log('[Terminal] Connection lost, scheduling reconnect...');
        scheduleReconnect(terminal, attempt);
      }
    };

    terminal.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // 监听终端尺寸变化
    const handleResize = () => {
      if (terminalInstanceRef.current && ws.readyState === WebSocket.OPEN) {
        terminalInstanceRef.current.fitAddon.fit();
        const dims = { cols: terminal.cols, rows: terminal.rows };
        ws.send(JSON.stringify({ type: 'resize', data: dims }));
      }
    };

    window.addEventListener('resize', handleResize);

    // 初始尺寸
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(() => {
      handleResize();
    }, 500);
  }, [searchParams, startHeartbeat, stopHeartbeat, scheduleReconnect]);

  // 手动重连
  const handleManualReconnect = useCallback(() => {
    if (!terminalInstanceRef.current) return;

    const { terminal } = terminalInstanceRef.current;
    console.log('[Terminal] Manual reconnect triggered');

    // 关闭现有连接
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual reconnect');
    }

    // 重置状态
    setIsReconnecting(true);
    setReconnectAttempt(0);
    terminal.write('\r\n⚠ Reconnecting...\r\n');

    // 立即重连
    connectWebSocket(terminal, 0);
  }, [connectWebSocket]);

  const initTerminal = useCallback(() => {
    console.log('[Terminal] Initializing terminal...');
    if (!terminalRef.current) {
      console.error('[Terminal] terminalRef.current is null!');
      return;
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = { terminal, fitAddon };
    console.log('[Terminal] Terminal instance created');

    connectWebSocket(terminal, 0);
  }, [connectWebSocket]);

  useEffect(() => {
    console.log('[Terminal] Component mounted');
    initTerminal();

    return () => {
      console.log('[Terminal] Component unmounting, cleaning up...');
      cleanupTimers();
      stopHeartbeat();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [initTerminal, cleanupTimers, stopHeartbeat]);

  const handleNewTab = () => {
    const newTab = {
      id: Date.now().toString(),
      title: `Terminal ${tabs.length + 1}`,
    };
    addTab(newTab);
    setActiveTab(newTab.id);
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
            <span className={`status-indicator ${isConnected ? 'connected' : ''}`} />
            {isConnected ? '已连接' : isReconnecting ? `重连中... (${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS})` : '未连接'}
          </div>

          {!isConnected && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleManualReconnect}
              loading={isReconnecting}
            >
              重连
            </Button>
          )}
        </Space>
      </div>

      <Card className="terminal-card" bodyStyle={{ padding: 0 }}>
        <div ref={terminalRef} className="terminal-container" />
      </Card>
    </div>
  );
}
