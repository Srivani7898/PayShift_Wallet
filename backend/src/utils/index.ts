import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Custom HTTP Error classes
export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

// Bcrypt Hashing functions
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT token helpers
export const generateAccessToken = (payload: { userId: number; role: string }): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'payshift_access_secret_key';
  const expiry = (process.env.JWT_ACCESS_EXPIRY || '15m') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn: expiry });
};

export const generateRefreshToken = (payload: { userId: number }): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'payshift_refresh_secret_key';
  const expiry = (process.env.JWT_REFRESH_EXPIRY || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn: expiry });
};

export const verifyAccessToken = (token: string): { userId: number; role: string } => {
  const secret = process.env.JWT_ACCESS_SECRET || 'payshift_access_secret_key';
  try {
    return jwt.verify(token, secret) as { userId: number; role: string };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  const secret = process.env.JWT_REFRESH_SECRET || 'payshift_refresh_secret_key';
  try {
    return jwt.verify(token, secret) as { userId: number };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

// OTP simulator helper
export const generateOtp = (): string => {
  // Always return '123456' for simulated testing environment
  return '123456';
};
