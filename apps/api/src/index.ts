import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { setupCronJobs } from './jobs';
import { cache } from './infrastructure/cache/RedisCache';

// Middlewares
import { generalLimiter, authLimiter, paymentLimiter } from './interface/middlewares/rateLimit.middleware';

// Routes
import { vehicleRoutes } from './interface/routes/vehicle.routes';
import { syndicatRoutes } from './interface/routes/syndicat.routes';
import { versementRoutes } from './interface/routes/versement.routes';
import { panneRoutes } from './interface/routes/panne.routes';
import { ticketRoutes } from './interface/routes/ticket.routes';
import { objetRoutes } from './interface/routes/objet.routes';
import { documentRoutes } from './interface/routes/document.routes';
import { notificationRoutes } from './interface/routes/notification.routes';
import { adminRoutes } from './interface/routes/admin.routes';
import { equipeRoutes } from './interface/routes/equipe.routes';
import { authRoutes } from './interface/routes/auth.routes';
import { paymentRoutes } from './interface/routes/payment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Redis cache
(async () => {
    await cache.connect();
})();

// Security middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/payments', paymentLimiter);

// Health check
app.get('/health', async (req, res) => {
    const redisStatus = cache ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        message: 'AfriMobilis API is running.',
        timestamp: new Date().toISOString(),
        services: {
            redis: redisStatus,
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/syndicats', syndicatRoutes);
app.use('/api/versements', versementRoutes);
app.use('/api/pannes', panneRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/objets', objetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Error]', err);
    
    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors,
        });
    }

    // Supabase errors
    if (err.code && err.message) {
        return res.status(400).json({
            error: err.message,
            code: err.code,
        });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await cache.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await cache.disconnect();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log(`[server]: Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize Cron Jobs
    setupCronJobs();
});

export default app;
