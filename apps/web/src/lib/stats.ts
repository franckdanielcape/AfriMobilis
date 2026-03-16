import { supabase } from '@/utils/supabase/client';

// Stats pour Chef de Ligne / Admin Syndicat (par zone)
export async function getChefLigneStats(zoneId?: string) {
    try {
        // Valeurs par défaut si les tables n'existent pas
        const defaultStats = {
            totalVehicules: 0,
            vehiculesActifs: 0,
            vehiculesEnAlerte: 0,
            totalChauffeurs: 0,
            chauffeursActifs: 0,
            chauffeursEnAttente: 0,
            totalAgents: 0,
            agentsActifs: 0,
            recensementsEnAttente: 0,
            conformiteAJour: 0,
            conformiteExpiree: 0,
            conformiteBientotExpiree: 0,
            versementsMois: 0,
            versementsRetard: 0,
            totalVersements: 0,
            incidentsMois: 0,
            sanctionsEnCours: 0,
            controlesMois: 0,
            vehicules: [],
            chauffeurs: [],
            agents: [],
            alertes: []
        };

        // Récupérer les données de base (profiles, vehicules)
        const [{ data: vehicules }, { data: chauffeurs }, { data: agents }] = await Promise.all([
            supabase.from('vehicules').select('*').limit(100),
            supabase.from('profiles').select('*').eq('role', 'chauffeur').limit(100),
            supabase.from('profiles').select('*').eq('role', 'agent_terrain').limit(100)
        ]);

        // Essayons de récupérer les autres données sans bloquer
        interface StatItem {
        id: string;
        created_at?: string;
        [key: string]: unknown;
    }
        let versements: StatItem[] = [];
        let documents: StatItem[] = [];
        let incidents: StatItem[] = [];
        let sanctions: StatItem[] = [];
        let controles: StatItem[] = [];
        let recensements: StatItem[] = [];

        try {
            const debutMois = new Date();
            debutMois.setDate(1);
            
            const [{ data: v }, { data: d }, { data: i }, { data: s }, { data: c }, { data: r }] = await Promise.all([
                supabase.from('versements').select('*').gte('date_versement', debutMois.toISOString()).limit(100),
                supabase.from('documents_conformite').select('*').limit(100),
                supabase.from('incidents').select('*').gte('date_incident', debutMois.toISOString()).limit(100),
                supabase.from('sanctions').select('*').eq('statut', 'active').limit(100),
                supabase.from('controles').select('*').gte('date_controle', debutMois.toISOString()).limit(100),
                supabase.from('recensements').select('*').eq('statut', 'en_attente').limit(100)
            ]);
            
            versements = v || [];
            documents = d || [];
            incidents = i || [];
            sanctions = s || [];
            controles = c || [];
            recensements = r || [];
        } catch (e) {
            // Les tables n'existent peut-être pas encore - on continue avec les valeurs par défaut
            // Ignorer - les tables n'existent peut-être pas encore
        }

        const now = new Date();
        const conformiteAJour = documents?.filter(d => new Date(d.date_expiration) > now).length || 0;
        const conformiteExpiree = documents?.filter(d => new Date(d.date_expiration) < now).length || 0;
        
        const dans30Jours = new Date();
        dans30Jours.setDate(dans30Jours.getDate() + 30);
        
        const alertesConformite = documents?.filter(d => {
            const exp = new Date(d.date_expiration);
            return exp > now && exp <= dans30Jours;
        }).length || 0;

        return {
            // Véhicules
            totalVehicules: vehicules?.length || 0,
            vehiculesActifs: vehicules?.filter(v => v.statut === 'actif').length || 0,
            vehiculesEnAlerte: vehicules?.filter(v => v.statut === 'en_conformite').length || 0,
            
            // Chauffeurs
            totalChauffeurs: chauffeurs?.length || 0,
            chauffeursActifs: chauffeurs?.filter(c => c.statut === 'actif').length || 0,
            chauffeursEnAttente: chauffeurs?.filter(c => c.statut === 'en_attente').length || 0,
            
            // Agents
            totalAgents: agents?.length || 0,
            agentsActifs: agents?.filter(a => a.statut === 'actif').length || 0,
            recensementsEnAttente: recensements?.length || 0,
            
            // Conformité
            conformiteAJour,
            conformiteExpiree,
            conformiteBientotExpiree: alertesConformite,
            
            // Versements
            versementsMois: versements?.filter(v => v.statut === 'recu').length || 0,
            versementsRetard: versements?.filter(v => v.statut === 'en_retard').length || 0,
            totalVersements: versements?.reduce((acc, v) => acc + (v.montant || 0), 0) || 0,
            
            // Incidents & Sanctions
            incidentsMois: incidents?.length || 0,
            sanctionsEnCours: sanctions?.length || 0,
            
            // Contrôles
            controlesMois: controles?.length || 0,
            
            // Données brutes pour affichage
            vehicules: vehicules || [],
            chauffeurs: chauffeurs || [],
            agents: agents || [],
            alertes: [
                ...(conformiteExpiree > 0 ? [{
                    id: 'conf-exp',
                    type: 'conformite' as const,
                    niveau: 'critique' as const,
                    titre: `${conformiteExpiree} document(s) expiré(s)`,
                    description: 'Documents de conformité expirés nécessitant une action immédiate',
                    date: new Date().toISOString()
                }] : []),
                ...(alertesConformite > 0 ? [{
                    id: 'conf-bientot',
                    type: 'conformite' as const,
                    niveau: 'warning' as const,
                    titre: `${alertesConformite} document(s) bientôt expiré(s)`,
                    description: 'Documents expirant dans moins de 30 jours',
                    date: new Date().toISOString()
                }] : []),
                ...(versements?.filter(v => v.statut === 'en_retard').length > 0 ? [{
                    id: 'verse-retard',
                    type: 'versement' as const,
                    niveau: 'warning' as const,
                    titre: `${versements.filter(v => v.statut === 'en_retard').length} versement(s) en retard`,
                    description: 'Chauffeurs n\'ayant pas versé leurs quotes-parts',
                    date: new Date().toISOString()
                }] : [])
            ]
        };
    } catch {
        // Retourner des valeurs par défaut au lieu de throw
        return {
            totalVehicules: 0,
            vehiculesActifs: 0,
            vehiculesEnAlerte: 0,
            totalChauffeurs: 0,
            chauffeursActifs: 0,
            chauffeursEnAttente: 0,
            totalAgents: 0,
            agentsActifs: 0,
            recensementsEnAttente: 0,
            conformiteAJour: 0,
            conformiteExpiree: 0,
            conformiteBientotExpiree: 0,
            versementsMois: 0,
            versementsRetard: 0,
            totalVersements: 0,
            incidentsMois: 0,
            sanctionsEnCours: 0,
            controlesMois: 0,
            vehicules: [],
            chauffeurs: [],
            agents: [],
            alertes: []
        };
    }
}

// Stats pour Super Admin (global)
export async function getSuperAdminStats() {
    try {
        // Récupérer les données de base
        const [
            { data: syndicats },
            { data: utilisateurs },
            { data: vehicules }
        ] = await Promise.all([
            supabase.from('syndicats').select('*').limit(100),
            supabase.from('profiles').select('*').limit(100),
            supabase.from('vehicules').select('*').limit(100)
        ]);

        // Calculer les stats
        const allUsers = utilisateurs || [];
        const chauffeurs = allUsers.filter(u => u.role === 'chauffeur');
        const proprietaires = allUsers.filter(u => u.role === 'proprietaire');

        return {
            totalSyndicats: syndicats?.length || 0,
            totalUtilisateurs: allUsers.length,
            totalVehicules: vehicules?.length || 0,
            totalChauffeurs: chauffeurs.length,
            totalProprietaires: proprietaires.length,
            vehiculesActifs: vehicules?.filter(v => v.statut === 'actif').length || 0,
            
            // Répartition par rôle
            repartitionRoles: {
                super_admin: allUsers.filter(u => u.role === 'super_admin').length,
                admin_syndicat: allUsers.filter(u => u.role === 'admin_syndicat' || u.role === 'chef_ligne').length,
                agent_terrain: allUsers.filter(u => u.role === 'agent_terrain').length,
                proprietaire: proprietaires.length,
                chauffeur: chauffeurs.length,
                passager: allUsers.filter(u => u.role === 'passager').length,
            }
        };
    } catch {
        // Retourner des valeurs par défaut
        return {
            totalSyndicats: 0,
            totalUtilisateurs: 0,
            totalVehicules: 0,
            totalChauffeurs: 0,
            totalProprietaires: 0,
            vehiculesActifs: 0,
            repartitionRoles: {
                super_admin: 0,
                admin_syndicat: 0,
                agent_terrain: 0,
                proprietaire: 0,
                chauffeur: 0,
                passager: 0,
            }
        };
    }
}

// Stats pour Propriétaire
export async function getProprietaireStats(proprietaireId: string) {
    try {
        // Véhicules du propriétaire
        const { data: vehicules, error: vehError } = await supabase
            .from('vehicules')
            .select('*')
            .eq('proprietaire_id', proprietaireId);
        
        if (vehError) throw vehError;

        const vehiculeIds = vehicules?.map(v => v.id) || [];

        // Chauffeurs liés
        const { data: affectations, error: affError } = await supabase
            .from('affectations')
            .select('chauffeur_id')
            .in('vehicule_id', vehiculeIds)
            .eq('statut', 'actif');
        
        if (affError) throw affError;

        const chauffeurIds = [...new Set(affectations?.map(a => a.chauffeur_id) || [])];

        const { data: chauffeurs, error: chauffError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', chauffeurIds);
        
        if (chauffError) throw chauffError;

        // Versements
        const debutMois = new Date();
        debutMois.setDate(1);
        
        const { data: versements, error: verseError } = await supabase
            .from('versements')
            .select('*')
            .in('vehicule_id', vehiculeIds)
            .gte('date_versement', debutMois.toISOString());
        
        if (verseError) throw verseError;

        // Pannes
        const { data: pannes, error: pannError } = await supabase
            .from('pannes')
            .select('*')
            .in('vehicule_id', vehiculeIds)
            .eq('statut', 'en_cours');
        
        if (pannError) throw pannError;

        return {
            totalVehicules: vehicules?.length || 0,
            vehiculesActifs: vehicules?.filter(v => v.statut === 'actif').length || 0,
            totalChauffeurs: chauffeurs?.length || 0,
            versementsMois: versements?.reduce((acc, v) => acc + (v.montant || 0), 0) || 0,
            versementsAttendus: (vehicules?.length || 0) * 50000, // Exemple: 50k par véhicule
            pannesEnCours: pannes?.length || 0,
            vehicules: vehicules || [],
            chauffeurs: chauffeurs || []
        };
    } catch (error) {
        throw error;
    }
}

// Stats pour Chauffeur
export async function getChauffeurStats(chauffeurId: string) {
    try {
        // Véhicule assigné
        const { data: affectation, error: affError } = await supabase
            .from('affectations')
            .select('vehicule_id')
            .eq('chauffeur_id', chauffeurId)
            .eq('statut', 'actif')
            .single();
        
        if (affError && affError.code !== 'PGRST116') throw affError; // PGRST116 = pas de résultat

        const vehiculeId = affectation?.vehicule_id;

        // Versements du chauffeur
        const { data: versements, error: verseError } = await supabase
            .from('versements')
            .select('*')
            .eq('chauffeur_id', chauffeurId)
            .order('date_versement', { ascending: false })
            .limit(10);
        
        if (verseError) throw verseError;

        // Sanctions
        const { data: sanctions, error: sancError } = await supabase
            .from('sanctions')
            .select('*')
            .eq('chauffeur_id', chauffeurId)
            .eq('statut', 'active');
        
        if (sancError) throw sancError;

        // Notifications non lues
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', chauffeurId)
            .eq('lu', false);
        
        if (notifError) throw notifError;

        return {
            vehiculeAssigne: vehiculeId,
            totalVersements: versements?.length || 0,
            montantTotalVerse: versements?.reduce((acc, v) => acc + (v.montant || 0), 0) || 0,
            dernierVersement: versements?.[0] || null,
            sanctionsActives: sanctions?.length || 0,
            notificationsNonLues: notifications?.length || 0,
            versements: versements || [],
            sanctions: sanctions || []
        };
    } catch (error) {
        throw error;
    }
}
