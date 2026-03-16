import { Router } from 'express';
import { PanneController } from '../controllers/PanneController';
import { authenticateToken, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Liste des pannes - auth optionnel
router.get('/', optionalAuth, PanneController.getPannes);

// Déclarer une panne - auth requis (chauffeurs et propriétaires)
router.post(
    '/',
    authenticateToken,
    requireRole(
        UserRole.CHAUFFEUR_TITULAIRE,
        UserRole.CHAUFFEUR_SECONDAIRE,
        UserRole.PROPRIETAIRE_CHAUFFEUR,
        UserRole.CHEF_LIGNE
    ),
    PanneController.createPanne
);

export { router as panneRoutes };
