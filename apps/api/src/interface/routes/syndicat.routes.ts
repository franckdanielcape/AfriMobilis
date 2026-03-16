import { Router } from 'express';
import { SyndicatController } from '../controllers/SyndicatController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Routes publiques (lecture)
router.get('/', SyndicatController.getSyndicats);

// Routes protégées (super admin uniquement)
router.post(
    '/',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN),
    SyndicatController.createSyndicat
);

export { router as syndicatRoutes };
