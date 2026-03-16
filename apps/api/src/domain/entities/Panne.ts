export interface Panne {
    id: string;
    vehicule_id: string;
    chauffeur_id?: string;
    declare_par?: string;
    type_panne: string;
    description?: string;
    gravite?: 'mineure' | 'majeure' | 'critique';
    localisation?: any;
    statut: 'declaree' | 'en_reparation' | 'resolue';
    cout_reparation?: number;
    garage_nom?: string;
    dates?: any;
    perte_revenus_estimee?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreatePanneDTO {
    vehicule_id: string;
    chauffeur_id?: string;
    declare_par?: string;
    type_panne: string;
    description?: string;
    gravite?: 'mineure' | 'majeure' | 'critique';
    localisation?: any;
    statut?: 'declaree' | 'en_reparation' | 'resolue';
    cout_reparation?: number;
    garage_nom?: string;
}
