/**
 * Rôles AfriMobilis - Types partagés
 * Cahier des Charges v2.0
 */

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    CHEF_LIGNE = 'chef_ligne',
    PROPRIETAIRE = 'proprietaire',
    PROPRIETAIRE_CHAUFFEUR = 'proprietaire_chauffeur',
    GERANT = 'gerant',
    CHAUFFEUR_TITULAIRE = 'chauffeur_titulaire',
    CHAUFFEUR_SECONDAIRE = 'chauffeur_secondaire',
    CHAUFFEUR_SANS_VEHICULE = 'chauffeur_sans_vehicule',
    PASSAGER = 'passager',
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.CHEF_LIGNE]: 'Chef de Ligne',
    [UserRole.PROPRIETAIRE]: 'Propriétaire',
    [UserRole.PROPRIETAIRE_CHAUFFEUR]: 'Propriétaire-Chauffeur',
    [UserRole.GERANT]: 'Gérant',
    [UserRole.CHAUFFEUR_TITULAIRE]: 'Chauffeur Titulaire',
    [UserRole.CHAUFFEUR_SECONDAIRE]: 'Chauffeur Secondaire',
    [UserRole.CHAUFFEUR_SANS_VEHICULE]: 'Chauffeur (sans véhicule)',
    [UserRole.PASSAGER]: 'Passager',
};
