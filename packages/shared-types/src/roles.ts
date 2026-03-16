/**
 * Rôles AfriMobilis - Types partagés
 * Conforme au Cahier des Charges v1 (Mars 2026)
 * 
 * Hiérarchie :
 * 1. Super Admin (global)
 * 2. Super Chef de Ligne (1 par ville)
 * 3. Chef de Ligne (plusieurs par ville, collègues)
 * 4. Agent Terrain (créé par Super Chef)
 * 5. Propriétaire
 * 6. Gérant (délégué par propriétaire, restriction vente)
 * 7. Chauffeur (créé par propriétaire)
 * 8. Passager
 */

export enum UserRole {
    // Niveau 1 - Global
    SUPER_ADMIN = 'super_admin',
    
    // Niveau 2 - Ville (1 par ville)
    SUPER_CHEF_DE_LIGNE = 'super_chef_de_ligne',
    
    // Niveau 3 - Ville (plusieurs par ville)
    CHEF_DE_LIGNE = 'chef_de_ligne',
    
    // Niveau 4 - Terrain
    AGENT_TERRAIN = 'agent_terrain',
    
    // Niveau 5 - Propriétaires
    PROPRIETAIRE = 'proprietaire',
    
    // Niveau 6 - Délégué
    GERANT = 'gerant',
    
    // Niveau 7 - Chauffeurs
    CHAUFFEUR = 'chauffeur',
    
    // Niveau 8 - Passagers
    PASSAGER = 'passager',
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.SUPER_CHEF_DE_LIGNE]: 'Super Chef de Ligne',
    [UserRole.CHEF_DE_LIGNE]: 'Chef de Ligne',
    [UserRole.AGENT_TERRAIN]: 'Agent Terrain',
    [UserRole.PROPRIETAIRE]: 'Propriétaire',
    [UserRole.GERANT]: 'Gérant',
    [UserRole.CHAUFFEUR]: 'Chauffeur',
    [UserRole.PASSAGER]: 'Passager',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 1,
    [UserRole.SUPER_CHEF_DE_LIGNE]: 2,
    [UserRole.CHEF_DE_LIGNE]: 3,
    [UserRole.AGENT_TERRAIN]: 4,
    [UserRole.PROPRIETAIRE]: 5,
    [UserRole.GERANT]: 6,
    [UserRole.CHAUFFEUR]: 7,
    [UserRole.PASSAGER]: 8,
};

/**
 * Vérifie si un rôle a un niveau hiérarchique supérieur ou égal
 */
export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

/**
 * Rôles qui peuvent créer des chauffeurs
 * Selon le CDC : Propriétaire (primaire) et Chef de Ligne (recensement)
 */
export const ROLES_CREATE_CHAUFFEUR: UserRole[] = [
    UserRole.PROPRIETAIRE,
    UserRole.CHEF_DE_LIGNE,
    UserRole.SUPER_CHEF_DE_LIGNE,
    UserRole.SUPER_ADMIN,
];

/**
 * Rôles qui peuvent vendre des véhicules
 * Le gérant est EXCLU selon le CDC
 */
export const ROLES_CAN_SELL_VEHICLE: UserRole[] = [
    UserRole.PROPRIETAIRE,
    UserRole.SUPER_ADMIN,
];

/**
 * Rôles qui peuvent créer des Chefs de Ligne
 * Seul le Super Chef peut créer des collègues
 */
export const ROLES_CREATE_CHEF_LIGNE: UserRole[] = [
    UserRole.SUPER_CHEF_DE_LIGNE,
    UserRole.SUPER_ADMIN,
];
