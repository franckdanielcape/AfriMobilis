export interface Syndicat {
    id: string;
    nom: string;
    code: string;
    zone_geographique?: any;
    statut: 'actif' | 'inactif' | 'suspendu';
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateSyndicatDTO {
    nom: string;
    code: string;
    zone_geographique?: any;
    statut?: 'actif' | 'inactif' | 'suspendu';
}
