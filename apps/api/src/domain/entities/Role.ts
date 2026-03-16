/**
 * Rôles AfriMobilis - Définition centralisée
 * Selon Cahier des Charges v2.0
 */

export enum UserRole {
    // Administrateurs
    SUPER_ADMIN = 'super_admin',
    
    // Syndicat Grand-Bassam (6 personnes)
    CHEF_LIGNE = 'chef_ligne',           // Chef syndicat local (anciennement admin_syndicat)
    
    // Propriétaires
    PROPRIETAIRE = 'proprietaire',
    PROPRIETAIRE_CHAUFFEUR = 'proprietaire_chauffeur',  // Propriétaire qui conduit
    
    // Gérant
    GERANT = 'gerant',
    
    // Chauffeurs
    CHAUFFEUR_TITULAIRE = 'chauffeur_titulaire',
    CHAUFFEUR_SECONDAIRE = 'chauffeur_secondaire',
    CHAUFFEUR_SANS_VEHICULE = 'chauffeur_sans_vehicule',
    
    // Passager
    PASSAGER = 'passager',
}

// Rôles ayant accès au dashboard admin/syndicat
export const ADMIN_ROLES = [
    UserRole.SUPER_ADMIN,
    UserRole.CHEF_LIGNE,
];

// Rôles pouvant gérer des véhicules
export const VEHICLE_MANAGER_ROLES = [
    UserRole.SUPER_ADMIN,
    UserRole.CHEF_LIGNE,
    UserRole.PROPRIETAIRE,
    UserRole.PROPRIETAIRE_CHAUFFEUR,
    UserRole.GERANT,
];

// Rôles pouvant déclarer des pannes
export const PANNE_DECLARANT_ROLES = [
    UserRole.CHAUFFEUR_TITULAIRE,
    UserRole.CHAUFFEUR_SECONDAIRE,
    UserRole.PROPRIETAIRE_CHAUFFEUR,  // Si son véhicule
];

// Rôles pouvant effectuer des versements
export const VERSEMENT_ROLES = [
    UserRole.CHAUFFEUR_TITULAIRE,
    UserRole.CHAUFFEUR_SECONDAIRE,
    UserRole.PROPRIETAIRE_CHAUFFEUR,
];

// Rôles créés par le Super Admin uniquement
export const SUPER_ADMIN_CREATION_ROLES = [
    UserRole.CHEF_LIGNE,
];

// Rôles avec accès propriétaire
export const PROPRIETAIRE_ROLES = [
    UserRole.PROPRIETAIRE,
    UserRole.PROPRIETAIRE_CHAUFFEUR,
];

// Rôles chauffeur (tous types)
export const CHAUFFEUR_ROLES = [
    UserRole.CHAUFFEUR_TITULAIRE,
    UserRole.CHAUFFEUR_SECONDAIRE,
    UserRole.CHAUFFEUR_SANS_VEHICULE,
    UserRole.PROPRIETAIRE_CHAUFFEUR,
];
