export interface Vehicle {
    id: string;
    syndicat_id: string;
    ligne_id: string;
    proprietaire_id: string;
    gerant_id?: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
    annee?: number;
    couleur?: string;
    statut: 'actif' | 'en_panne' | 'inactif' | 'suspendu';
    conformite_status: 'conforme' | 'bientot_expire' | 'non_conforme';
    created_at: Date;
    updated_at: Date;
}

export interface CreateVehicleDTO {
    syndicat_id: string;
    ligne_id: string;
    proprietaire_id: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
}
