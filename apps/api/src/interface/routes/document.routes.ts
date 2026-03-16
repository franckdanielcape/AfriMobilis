import { Router } from 'express';
import { DocumentConformiteController } from '../controllers/DocumentConformiteController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

// Liste des documents - protégé
router.get(
    '/',
    authenticateToken,
    DocumentConformiteController.getDocuments
);

// Ajouter un document - chef de ligne ou proprietaire
router.post(
    '/',
    authenticateToken,
    requireRole(
        UserRole.SUPER_ADMIN,
        UserRole.CHEF_LIGNE,
        UserRole.PROPRIETAIRE,
        UserRole.PROPRIETAIRE_CHAUFFEUR,
        UserRole.GERANT
    ),
    DocumentConformiteController.createDocument
);

export { router as documentRoutes };
