export interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    annee?: number;
    statut: 'actif' | 'inactif' | 'maintenance' | 'suspendu';
    statut_conformite: 'conforme' | 'bientot_expire' | 'non_conforme';
    date_dernier_controle?: string;
    syndicat_id: string;
    proprietaire_id: string;
    created_at: string;
    updated_at: string;
}

export interface Chauffeur {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    permis_numero?: string;
    permis_categorie?: string;
    permis_date_expiration?: string;
    statut: 'actif' | 'inactif' | 'suspendu';
    created_at: string;
}

export interface Affectation {
    id: string;
    vehicule_id: string;
    chauffeur_id: string;
    date_debut: string;
    date_fin?: string;
    statut: 'en_cours' | 'terminee';
    chauffeur?: Chauffeur;
    vehicule?: Vehicule;
}

export interface Versement {
    id: string;
    vehicule_id: string;
    chauffeur_id: string;
    montant_attendu: number;
    montant_verse: number;
    date_versement: string;
    statut: 'attendu' | 'recu' | 'en_retard' | 'litige';
    commentaire?: string;
    created_at: string;
}

export interface Panne {
    id: string;
    vehicule_id: string;
    chauffeur_id: string;
    type: 'mecanique' | 'electrique' | 'carrosserie' | 'pneumatique' | 'autre';
    description: string;
    date_declaration: string;
    date_resolution?: string;
    cout_reparation?: number;
    statut: 'declaree' | 'en_cours' | 'resolue' | 'annulee';
    photos?: string[];
    created_at: string;
}

export interface Document {
    id: string;
    vehicule_id: string;
    type: 'visite_technique' | 'patente' | 'assurance' | 'carte_stationnement' | 'autre';
    numero?: string;
    date_emission?: string;
    date_expiration: string;
    fichier_url?: string;
    statut: 'valide' | 'expire' | 'bientot_expire';
    valide_par?: string;
    date_validation?: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    telephone?: string;
    role: 'super_admin' | 'super_chef_ligne' | 'chef_ligne' | 'agent_terrain' | 'proprietaire' | 'gerant' | 'chauffeur' | 'passager';
    syndicat_id?: string;
    ville_id?: string;
    photo_url?: string;
    statut: 'actif' | 'inactif' | 'en_attente';
    created_at: string;
}

export interface OCRResult {
    dateExpiration?: string;
    numeroCarte?: string;
    confiance: number;
    texteComplet: string;
}
