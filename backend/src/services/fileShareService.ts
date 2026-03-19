import fs from 'fs-extra';
import path from 'path';
import { db } from './database';
import crypto from 'crypto';

// Share Record Interface
export interface ShareRecord {
  shareId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  downloadCount: number;
  maxDownloads?: number;
}

// Helper: Generate unique share ID
const generateShareId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `share_${timestamp}_${randomStr}`;
};

// Helper: Validate and resolve path (security check)
const validatePath = (userPath: string): string => {
  const resolvedPath = path.resolve(userPath);
  // Prevent directory traversal attacks
  if (resolvedPath.includes('..')) {
    throw new Error('Invalid path: path traversal not allowed');
  }
  return resolvedPath;
};

// Create a new share
export const createShare = async (
  filePath: string,
  createdBy: string,
  options?: {
    expiresAt?: string;
    maxDownloads?: number;
  }
): Promise<ShareRecord> => {
  const validPath = validatePath(filePath);

  // Check if file exists
  if (!(await fs.pathExists(validPath))) {
    throw new Error('File not found');
  }

  // Get file stats
  const stats = await fs.stat(validPath);
  const fileName = path.basename(validPath);

  // Generate share ID
  const shareId = generateShareId();

  // Create share record
  const share: ShareRecord = {
    shareId,
    filePath: validPath,
    fileName,
    fileSize: stats.size,
    createdBy,
    createdAt: new Date().toISOString(),
    downloadCount: 0,
    ...(options?.expiresAt && { expiresAt: options.expiresAt }),
    ...(options?.maxDownloads && { maxDownloads: options.maxDownloads }),
  };

  // Save to database
  await db.createShare(share);

  return share;
};

// Get share information
export const getShare = async (shareId: string): Promise<ShareRecord | null> => {
  const share = await db.getShareById(shareId);
  return share || null;
};

// Validate share (check if it's still valid)
export const validateShare = async (shareId: string): Promise<{ valid: boolean; share?: ShareRecord; error?: string }> => {
  const share = await getShare(shareId);

  if (!share) {
    return { valid: false, error: 'Share not found' };
  }

  // Check if file still exists
  if (!(await fs.pathExists(share.filePath))) {
    return { valid: false, error: 'File not found' };
  }

  // Check expiration
  if (share.expiresAt) {
    const expiresAt = new Date(share.expiresAt);
    if (new Date() > expiresAt) {
      return { valid: false, error: 'Share has expired' };
    }
  }

  // Check download limit
  if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
    return { valid: false, error: 'Download limit reached' };
  }

  return { valid: true, share };
};

// List all shares (with optional filters)
export const listShares = async (filters?: {
  createdBy?: string;
  active?: boolean;
}): Promise<ShareRecord[]> => {
  let shares = await db.getShares();

  // Filter by creator
  if (filters?.createdBy) {
    shares = shares.filter((s: ShareRecord) => s.createdBy === filters.createdBy);
  }

  // Filter active/expired
  if (filters?.active !== undefined) {
    const now = new Date();
    shares = shares.filter((s: ShareRecord) => {
      const isExpired = s.expiresAt && new Date(s.expiresAt) < now;
      return filters.active ? !isExpired : isExpired;
    });
  }

  // Sort by creation date (newest first)
  shares.sort((a: ShareRecord, b: ShareRecord) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return shares;
};

// Increment download count
export const incrementDownloadCount = async (shareId: string): Promise<void> => {
  const share = await db.getShareById(shareId);
  if (share) {
    await db.updateShare(shareId, {
      downloadCount: share.downloadCount + 1
    });
  }
};

// Delete share
export const deleteShare = async (shareId: string): Promise<boolean> => {
  const share = await db.getShareById(shareId);
  if (share) {
    await db.deleteShare(shareId);
    return true;
  }
  return false;
};

// Cleanup expired shares
export const cleanupExpiredShares = async (): Promise<number> => {
  const shares = await db.getShares();
  const now = new Date();
  let cleanedCount = 0;

  for (const share of shares) {
    if (share.expiresAt && new Date(share.expiresAt) < now) {
      await db.deleteShare(share.shareId);
      cleanedCount++;
    }
  }

  return cleanedCount;
};
