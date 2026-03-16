import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { setupCronJobs } from './jobs';

// Config & Routes
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
// import { paymentRoutes } from './interface/routes/payment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AfriMobilis API is running.' });
});

// Routes
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
// app.use('/api/payments', paymentRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);

    // Initialize Cron Jobs
    setupCronJobs();
});
