import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/authService'
import { User } from '../models/User'

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      })
      return
    }

    const user = await AuthService.verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token'
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message
      }
    })
  }
}

/**
 * Middleware to optionally authenticate JWT tokens (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const user = await AuthService.verifyToken(token)
      req.user = user
    }

    next()
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

/**
 * Middleware to check if user's email is verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required'
      }
    })
    return
  }

  if (!(req.user as any).isEmailVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required'
      }
    })
    return
  }

  next()
}

/**
 * Middleware to check if user owns the resource
 */
export const requireOwnership = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      })
      return
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField]
    
    if ((req.user as any).id !== resourceUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only access your own resources'
        }
      })
      return
    }

    next()
  }
}