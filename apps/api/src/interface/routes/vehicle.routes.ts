import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

export const vehicleRoutes = Router();

// Routes publiques (lecture)
vehicleRoutes.get('/', VehicleController.getVehicles);

// Recherche véhicule par plaque (pour Chefs de Ligne - gestion incidents)
vehicleRoutes.get(
    '/search/:plaque',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN, UserRole.CHEF_LIGNE),
    VehicleController.getVehicleByPlaque
);

// Routes protégées - Création/modification (Chefs de Ligne uniquement pour création)
vehicleRoutes.post(
    '/',
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN, UserRole.CHEF_LIGNE),
    VehicleController.createVehicle
);
