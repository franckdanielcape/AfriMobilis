import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Récupérer les notifications d'un utilisateur - protégé
router.get(
    '/user/:userId',
    authenticateToken,
    NotificationController.getNotifications
);

// Créer une notification - chef de ligne ou super admin
router.post(
    '/',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN, UserRole.CHEF_LIGNE),
    NotificationController.createNotification
);

// Marquer une notification comme lue - protégé
router.patch(
    '/:id/read',
    authenticateToken,
    NotificationController.markAsRead
);

// Marquer toutes les notifications comme lues - protégé
router.patch(
    '/user/:userId/read-all',
    authenticateToken,
    NotificationController.markAllAsRead
);

export { router as notificationRoutes };
