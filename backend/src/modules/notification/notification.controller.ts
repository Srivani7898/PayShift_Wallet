import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { BadRequestError, NotFoundError } from '../../utils';
import { logger } from '../../config/logger';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid notification ID');
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid notification ID');
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({
      where: { id },
    });

    logger.info(`Deleted notification ${id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (err) {
    next(err);
  }
};

export const clearAllNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    logger.info(`Cleared all notifications for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully.',
    });
  } catch (err) {
    next(err);
  }
};
