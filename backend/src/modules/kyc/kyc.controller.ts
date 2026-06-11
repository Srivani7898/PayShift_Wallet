import { Response, NextFunction } from 'express';
import prisma from '../../database';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { ConflictError } from '../../utils';
import { logger } from '../../config/logger';

export const getKYCStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const kyc = await prisma.kYCRecord.findUnique({
      where: { userId },
    });

    if (!kyc) {
      res.status(200).json({
        success: true,
        data: {
          status: 'UNSUBMITTED',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: kyc,
    });
  } catch (err) {
    next(err);
  }
};

export const submitKYC = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { aadhaarNumber, panNumber, aadhaarUrl, panUrl } = req.body;

    const existingKyc = await prisma.kYCRecord.findUnique({
      where: { userId },
    });

    if (existingKyc) {
      throw new ConflictError('KYC documents have already been submitted.');
    }

    const defaultAadhaarUrl = aadhaarUrl || 'https://res.cloudinary.com/payshift/image/upload/v1/kyc/aadhaar_placeholder.png';
    const defaultPanUrl = panUrl || 'https://res.cloudinary.com/payshift/image/upload/v1/kyc/pan_placeholder.png';

    const kyc = await prisma.kYCRecord.create({
      data: {
        userId: userId!,
        aadhaarNumber,
        panNumber,
        aadhaarUrl: defaultAadhaarUrl,
        panUrl: defaultPanUrl,
        status: 'PENDING',
      },
    });

    logger.info(`KYC documents submitted by user ID: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'KYC documents submitted successfully. Status is now PENDING review.',
      data: kyc,
    });
  } catch (err) {
    next(err);
  }
};
