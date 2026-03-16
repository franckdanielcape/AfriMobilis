import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Demo view - accessible aux super_admin uniquement
router.get(
    '/demo-view/:role',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN),
    AdminController.getDemoData
);

export { router as adminRoutes };
