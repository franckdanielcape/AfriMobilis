import { Router } from 'express';
import { ObjetController } from '../controllers/ObjetController';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Liste des objets - public
router.get('/', ObjetController.getObjets);

// Déclarer un objet perdu/retrouvé - auth optionnel
router.post('/', optionalAuth, ObjetController.createObjet);

export { router as objetRoutes };
