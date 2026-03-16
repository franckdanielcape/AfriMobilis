/**
 * Middleware de rate limiting pour l'API
 * Protection contre les abus et attaques brute force
 */
import { Request, Response, NextFunction } from 'express';
import { cache } from '../../infrastructure/cache/RedisCache';

// Rate limiter simple basé sur Redis
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const key = `ratelimit:${req.ip}:${req.path}`;
        
        try {
            const count = await cache.incrementRateLimit(key, Math.ceil(windowMs / 1000));
            
            if (count > maxRequests) {
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    retryAfter: Math.ceil(windowMs / 1000),
                });
            }
            
            next();
        } catch (error) {
            // En cas d'erreur Redis, continuer sans rate limiting
            next();
        }
    };
};

// Rate limiter général
export const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 req / 15 min

// Rate limiter strict pour l'authentification
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 req / 15 min

// Rate limiter pour les paiements
export const paymentLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 req / hour

// Rate limiter pour les uploads
export const uploadLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 req / hour
