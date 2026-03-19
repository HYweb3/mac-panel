import { Router, Request, Response } from 'express';
import * as fileShareService from '../services/fileShareService';
import fs from 'fs-extra';
import path from 'path';

const router = Router();

// Export download handler for public access
export const downloadHandler = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;

    // Validate share
    const validation = await fileShareService.validateShare(shareId);

    if (!validation.valid) {
      return res.status(404).json({ error: validation.error || 'Share not found or expired' });
    }

    const share = validation.share!;
    const filePath = share.filePath;
    const fileName = share.fileName;

    // Check if file exists
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment download count
    await fileShareService.incrementDownloadCount(shareId);

    // Send file
    res.download(filePath, fileName);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to download file' });
  }
};

// Create a new share
router.post('/', async (req, res) => {
  try {
    const { filePath, expiresAt, maxDownloads } = req.body;
    const userId = (req as any).user?.id || 'anonymous';

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const share = await fileShareService.createShare(filePath, userId, {
      expiresAt,
      maxDownloads,
    });

    res.json({
      success: true,
      share,
      shareUrl: `/api/files/download/${share.shareId}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create share' });
  }
});

// Get share information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const share = await fileShareService.getShare(id);

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    res.json({
      success: true,
      share: {
        shareId: share.shareId,
        fileName: share.fileName,
        fileSize: share.fileSize,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        downloadCount: share.downloadCount,
        maxDownloads: share.maxDownloads,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get share' });
  }
});


// List all shares
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { active } = req.query;

    const shares = await fileShareService.listShares({
      createdBy: userId,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });

    res.json({
      success: true,
      shares: shares.map(share => ({
        shareId: share.shareId,
        fileName: share.fileName,
        fileSize: share.fileSize,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        downloadCount: share.downloadCount,
        maxDownloads: share.maxDownloads,
        shareUrl: `/api/files/download/${share.shareId}`,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list shares' });
  }
});

// Delete share
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    // Check if share exists and belongs to user (optional, if you want to restrict deletion)
    const share = await fileShareService.getShare(id);
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Optional: Only allow creator or admin to delete
    // if (share.createdBy !== userId && (req as any).user?.role !== 'admin') {
    //   return res.status(403).json({ error: 'Permission denied' });
    // }

    const deleted = await fileShareService.deleteShare(id);

    if (deleted) {
      res.json({ success: true, message: 'Share deleted successfully' });
    } else {
      res.status(404).json({ error: 'Share not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete share' });
  }
});

// Cleanup expired shares (admin only or scheduled task)
router.post('/cleanup', async (req, res) => {
  try {
    const cleanedCount = await fileShareService.cleanupExpiredShares();

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired share(s)`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cleanup shares' });
  }
});

export default router;
