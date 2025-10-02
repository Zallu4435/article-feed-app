import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ErrorCode, HttpStatusCode } from '@/constants/status-codes';
import { ERROR_MESSAGES } from '@/constants/messages';

export interface DecodedToken {
  userId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatusCode;
  };
}


export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const tokenCookie = request.cookies.get('access_token');
  return tokenCookie?.value || null;
}


export function verifyToken(token: string): { success: true; decoded: DecodedToken } | { success: false; error: ErrorCode } {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    
    if (!decoded.userId) {
      return { success: false, error: ErrorCode.INVALID_TOKEN };
    }

    return { success: true, decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: ErrorCode.TOKEN_EXPIRED };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: ErrorCode.INVALID_TOKEN };
    }
    return { success: false, error: ErrorCode.INVALID_TOKEN };
  }
}


export function authenticateRequest(request: NextRequest): AuthResult {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return {
      success: false,
      error: {
        code: ErrorCode.UNAUTHORIZED,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      },
    };
  }

  const verificationResult = verifyToken(token);
  
  if (!verificationResult.success) {
    const errorMessage = verificationResult.error === ErrorCode.TOKEN_EXPIRED 
      ? ERROR_MESSAGES.TOKEN_EXPIRED 
      : ERROR_MESSAGES.INVALID_TOKEN;

    return {
      success: false,
      error: {
        code: verificationResult.error,
        message: errorMessage,
        statusCode: HttpStatusCode.UNAUTHORIZED,
      },
    };
  }

  return {
    success: true,
    userId: verificationResult.decoded.userId,
  };
}


export function optionalAuthentication(request: NextRequest): string | null {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  const verificationResult = verifyToken(token);
  
  if (!verificationResult.success) {
    return null;
  }

  return verificationResult.decoded.userId;
}


export function generateToken(userId: string, email?: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload: DecodedToken = {
    userId,
    ...(email && { email }),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}


export function generateRefreshToken(userId: string): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
  );
}


export function verifyRefreshToken(token: string): { success: true; userId: string } | { success: false; error: ErrorCode } {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as { userId: string };
    
    if (!decoded.userId) {
      return { success: false, error: ErrorCode.INVALID_TOKEN };
    }

    return { success: true, userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: ErrorCode.TOKEN_EXPIRED };
    }
    return { success: false, error: ErrorCode.INVALID_TOKEN };
  }
}


export function hasPermission(userId: string, permission: string): boolean {
  return !!userId;
}


export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
}
