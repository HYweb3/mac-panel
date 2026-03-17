import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Checkbox,
  Button,
  message,
  Spin,
  Tag,
  Space,
  Typography,
  Divider,
  Input,
} from 'antd';
import {
  FileOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface FilePermissions {
  user: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  group: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  others: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

interface FileInfo {
  path: string;
  permissions: FilePermissions;
  owner: {
    uid: number;
    gid: number;
  };
  size: number;
  modified: string;
  created: string;
  octal: string;
  isDirectory: boolean;
  isFile: boolean;
}

interface FilePropertiesProps {
  visible: boolean;
  onClose: () => void;
  filePath: string;
  onSuccess: () => void;
}

const FileProperties: React.FC<FilePropertiesProps> = ({
  visible,
  onClose,
  filePath,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [permissions, setPermissions] = useState<FilePermissions>({
    user: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    others: { read: false, write: false, execute: false },
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 计算权限数值
  const calculateOctal = (): string => {
    let octal = 0;
    if (permissions.user.read) octal += 4;
    if (permissions.user.write) octal += 2;
    if (permissions.user.execute) octal += 1;

    let octalStr = octal.toString();

    octal = 0;
    if (permissions.group.read) octal += 4;
    if (permissions.group.write) octal += 2;
    if (permissions.group.execute) octal += 1;
    octalStr += octal.toString();

    octal = 0;
    if (permissions.others.read) octal += 4;
    if (permissions.others.write) octal += 2;
    if (permissions.others.execute) octal += 1;
    octalStr += octal.toString();

    return octalStr;
  };

  // 获取符号权限表示
  const getSymbolicPermissions = (): string => {
    const p = permissions;
    const user = `${p.user.read ? 'r' : '-'}${p.user.write ? 'w' : '-'}${p.user.execute ? 'x' : '-'}`;
    const group = `${p.group.read ? 'r' : '-'}${p.group.write ? 'w' : '-'}${p.group.execute ? 'x' : '-'}`;
    const others = `${p.others.read ? 'r' : '-'}${p.others.write ? 'w' : '-'}${p.others.execute ? 'x' : '-'}`;
    return `${user}${group}${others}`;
  };

  // 加载文件信息
  const loadFileInfo = async () => {
    if (!filePath) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/files/permissions?path=${encodeURIComponent(filePath)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFileInfo(data);
        setPermissions(data.permissions);
      } else {
        const error = await response.json();
        message.error('获取文件信息失败: ' + error.error);
      }
    } catch (error: any) {
      message.error('获取文件信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存权限
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/files/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: filePath,
          permissions,
        }),
      });

      if (response.ok) {
        message.success('权限已更新');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        message.error('更新权限失败: ' + error.error);
      }
    } catch (error: any) {
      message.error('更新权限失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, successMsg: string) => {
    console.log('开始复制:', { text, successMsg });

    try {
      // 确保文本不为空
      if (!text || text.trim() === '') {
        message.error('复制内容为空');
        console.error('复制内容为空');
        return;
      }

      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        console.log('使用 Clipboard API');
        try {
          await navigator.clipboard.writeText(text);
          console.log('Clipboard API 复制成功');
          message.success(successMsg);
          return;
        } catch (clipboardError) {
          console.warn('Clipboard API 失败，尝试传统方法:', clipboardError);
          // 继续尝试传统方法
        }
      }

      // Fallback: 使用传统方法
      console.log('使用传统复制方法');

      // 创建一个更可靠的 textarea
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 关键样式设置
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0.01'; // 几乎透明
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // 先获取焦点
      textArea.focus();

      // 选择所有文本
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      // 强制重新获取焦点（某些浏览器需要）
      textArea.focus();

      try {
        const successful = document.execCommand('copy');
        console.log('传统方法复制结果:', successful);

        if (successful) {
          // 验证复制是否真的成功
          try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText === text) {
              console.log('复制验证成功');
              message.success(successMsg);
            } else {
              console.warn('复制验证失败，剪贴板内容不匹配');
              message.warning('复制可能未成功，请手动检查');
            }
          } catch (verifyError) {
            // 如果无法验证，相信 execCommand 的结果
            console.log('无法验证复制结果，相信 execCommand');
            message.success(successMsg);
          }
        } else {
          message.error('复制失败，请手动复制');
        }
      } catch (err) {
        console.error('传统方法复制错误:', err);
        message.error('复制失败，请手动复制');
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('复制错误:', error);
      message.error('复制失败: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    if (visible && filePath) {
      loadFileInfo();
    }
  }, [visible, filePath]);

  if (loading || !fileInfo) {
    return (
      <Modal
        open={visible}
        onCancel={onClose}
        title="文件属性"
        footer={[
          <Button key="cancel" onClick={onClose}>
            关闭
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="加载文件信息..." />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <Space>
          {fileInfo.isDirectory ? (
            <FolderOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          ) : (
            <FileOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          )}
          <span>文件属性</span>
        </Space>
      }
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          loading={saving}
          icon={<CheckCircleOutlined />}
        >
          保存
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 基本信息 */}
        <div>
          <Divider orientation="left">基本信息</Divider>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="文件名">
              <Space>
                <Text>{fileInfo.path.split('/').filter(Boolean).pop() || (fileInfo.path === '/' ? '/' : 'unknown')}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={async () => {
                    const parts = fileInfo.path.split('/').filter(Boolean);
                    const fileName = parts.length > 0 ? parts[parts.length - 1] : (fileInfo.path === '/' ? '/' : fileInfo.path);
                    console.log('复制文件名:', { fileName, originalPath: fileInfo.path });
                    await copyToClipboard(fileName, '文件名已复制');
                  }}
                >
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="完整路径">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={fileInfo.path}
                  readOnly
                  style={{ fontFamily: 'monospace' }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={async () => {
                    console.log('复制完整路径:', fileInfo.path);
                    await copyToClipboard(fileInfo.path, '完整路径已复制');
                  }}
                >
                  复制
                </Button>
              </Space.Compact>
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag icon={fileInfo.isDirectory ? <FolderOutlined /> : <FileOutlined />}>
                {fileInfo.isDirectory ? '文件夹' : '文件'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="大小">
              {fileInfo.isDirectory ? '-' : formatSize(fileInfo.size)}
            </Descriptions.Item>
            <Descriptions.Item label="权限数值">
              <Tag color="blue">{calculateOctal()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="修改时间">
              {formatDate(fileInfo.modified)}
            </Descriptions.Item>
            <Descriptions.Item label="符号权限">
              <Text code>{getSymbolicPermissions()}</Text>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* 权限设置 */}
        <div>
          <Divider orientation="left">权限设置</Divider>

          {/* 所有者 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              所有者 (User)
            </div>
            <Space>
              <Checkbox
                checked={permissions.user.read}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    user: { ...permissions.user, read: e.target.checked },
                  })
                }
              >
                读取
              </Checkbox>
              <Checkbox
                checked={permissions.user.write}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    user: { ...permissions.user, write: e.target.checked },
                  })
                }
              >
                写入
              </Checkbox>
              <Checkbox
                checked={permissions.user.execute}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    user: { ...permissions.user, execute: e.target.checked },
                  })
                }
              >
                执行
              </Checkbox>
            </Space>
          </div>

          {/* 用户组 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              用户组 (Group)
            </div>
            <Space>
              <Checkbox
                checked={permissions.group.read}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    group: { ...permissions.group, read: e.target.checked },
                  })
                }
              >
                读取
              </Checkbox>
              <Checkbox
                checked={permissions.group.write}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    group: { ...permissions.group, write: e.target.checked },
                  })
                }
              >
                写入
              </Checkbox>
              <Checkbox
                checked={permissions.group.execute}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    group: { ...permissions.group, execute: e.target.checked },
                  })
                }
              >
                执行
              </Checkbox>
            </Space>
          </div>

          {/* 公共 */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              公共 (Others)
            </div>
            <Space>
              <Checkbox
                checked={permissions.others.read}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    others: { ...permissions.others, read: e.target.checked },
                  })
                }
              >
                读取
              </Checkbox>
              <Checkbox
                checked={permissions.others.write}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    others: { ...permissions.others, write: e.target.checked },
                  })
                }
              >
                写入
              </Checkbox>
              <Checkbox
                checked={permissions.others.execute}
                onChange={(e) =>
                  setPermissions({
                    ...permissions,
                    others: { ...permissions.others, execute: e.target.checked },
                  })
                }
              >
                执行
              </Checkbox>
            </Space>
          </div>
        </div>

        {/* 所有者信息 */}
        <div>
          <Divider orientation="left">所有者信息</Divider>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="用户 ID (UID)">
              {fileInfo.owner.uid}
            </Descriptions.Item>
            <Descriptions.Item label="组 ID (GID)">
              {fileInfo.owner.gid}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 8, padding: '8px', background: '#f0f0f0', borderRadius: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              注意：修改所有者需要管理员权限，当前仅支持修改权限设置
            </Text>
          </div>
        </div>
      </Space>
    </Modal>
  );
};

export default FileProperties;
