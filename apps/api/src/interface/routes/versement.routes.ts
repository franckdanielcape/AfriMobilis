import { Router } from 'express';
import { VersementController } from '../controllers/VersementController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Liste des versements - protégé (lecture selon rôle)
router.get(
    '/',
    authenticateToken,
    requireRole(
        UserRole.SUPER_ADMIN,
        UserRole.CHEF_LIGNE,
        UserRole.PROPRIETAIRE,
        UserRole.PROPRIETAIRE_CHAUFFEUR,
        UserRole.GERANT,
        UserRole.CHAUFFEUR_TITULAIRE,
        UserRole.CHAUFFEUR_SECONDAIRE
    ),
    VersementController.getVersements
);

// Créer un versement - protégé (chauffeurs et propriétaires)
router.post(
    '/',
    authenticateToken,
    requireRole(
        UserRole.CHEF_LIGNE,
        UserRole.PROPRIETAIRE,
        UserRole.PROPRIETAIRE_CHAUFFEUR,
        UserRole.GERANT,
        UserRole.CHAUFFEUR_TITULAIRE,
        UserRole.CHAUFFEUR_SECONDAIRE
    ),
    VersementController.createVersement
);

export { router as versementRoutes };
