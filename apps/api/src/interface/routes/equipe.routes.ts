import { Router } from 'express';
import { EquipeController } from '../controllers/EquipeController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

export const equipeRoutes = Router();

// Récupérer l'équipe du syndicat (protégé)
equipeRoutes.get(
    '/members',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN, UserRole.CHEF_LIGNE),
    EquipeController.getEquipe
);

// Créer un rôle personnalisé (chef de ligne ou super admin)
equipeRoutes.post(
    '/roles',
    authenticateToken,
    requireRole(UserRole.CHEF_LIGNE, UserRole.SUPER_ADMIN),
    EquipeController.createCustomRole
);

// Créer un membre de l'équipe (chef de ligne ou super admin)
equipeRoutes.post(
    '/members',
    authenticateToken,
    requireRole(UserRole.CHEF_LIGNE, UserRole.SUPER_ADMIN),
    EquipeController.createMember
);

// Route spéciale pour le Super Admin créer un Chef de Ligne
equipeRoutes.post(
    '/create-chef-ligne',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN),
    EquipeController.createMember
);
