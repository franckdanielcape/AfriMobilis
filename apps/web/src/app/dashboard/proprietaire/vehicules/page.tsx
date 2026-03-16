'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import styles from './vehicules.module.css';

interface Vehicule {
  id: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee?: number;
  statut: string;
  statut_conformite: string;
  date_dernier_controle?: string;
  syndicat_id: string;
}

interface ChauffeurAffecte {
  vehicule_id: string;
  chauffeur: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
  };
  date_debut: string;
}

export default function ProprietaireVehicules() {
  const router = useRouter();
  const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
  
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Record<string, ChauffeurAffecte>>({});
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    fetchVehicules();
  }, [profile]);

  const fetchVehicules = async () => {
    try {
      // Récupérer les véhicules du propriétaire
      const { data: vehiculesData, error: vError } = await supabase
        .from('vehicules')
        .select('*')
        .eq('proprietaire_id', profile.id)
        .order('created_at', { ascending: false });

      if (vError) throw vError;
      setVehicules(vehiculesData || []);

      // Récupérer les chauffeurs affectés
      const vehiculeIds = vehiculesData?.map(v => v.id) || [];
      if (vehiculeIds.length > 0) {
        const { data: affectations, error: aError } = await supabase
          .from('affectations')
          .select(`
            vehicule_id,
            date_debut,
            chauffeur:profiles!chauffeur_id(id, nom, prenom, telephone)
          `)
          .in('vehicule_id', vehiculeIds)
          .is('date_fin', null);

        if (!aError && affectations) {
          const chauffeursMap: Record<string, ChauffeurAffecte> = {};
          affectations.forEach((a: { vehicule_id: string }) => {
            chauffeursMap[a.vehicule_id] = a;
          });
          setChauffeurs(chauffeursMap);
        }
      }
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutConformiteColor = (statut: string) => {
    switch (statut) {
      case 'conforme': return styles.conforme;
      case 'bientot_expire': return styles.warning;
      case 'non_conforme': return styles.danger;
      default: return '';
    }
  };

  const vehiculesFiltres = vehicules.filter(v => {
    const matchStatut = filtreStatut === 'tous' || v.statut === filtreStatut;
    const matchSearch = 
      v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modele.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatut && matchSearch;
  });

  if (authLoading || loading) {
    return <div className={styles.loading}>Chargement de vos véhicules...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>🚕 Mes Véhicules</h1>
          <p>Gérez votre flotte et suivez la conformité</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{vehicules.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>
              {vehicules.filter(v => v.statut === 'actif').length}
            </span>
            <span className={styles.statLabel}>Actifs</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un véhicule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          value={filtreStatut} 
          onChange={(e) => setFiltreStatut(e.target.value)}
          className={styles.select}
        >
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="maintenance">En maintenance</option>
        </select>
      </div>

      {/* Liste des véhicules */}
      {vehiculesFiltres.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚕</div>
          <h3>Aucun véhicule trouvé</h3>
          <p>
            {searchTerm || filtreStatut !== 'tous' 
              ? 'Essayez d\'autres critères de recherche'
              : 'Contactez votre syndicat pour ajouter des véhicules à votre compte'
            }
          </p>
        </div>
      ) : (
        <div className={styles.vehiculesGrid}>
          {vehiculesFiltres.map((vehicule) => {
            const chauffeur = chauffeurs[vehicule.id];
            
            return (
              <div key={vehicule.id} className={styles.vehiculeCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.plateBadge}>
                    {vehicule.immatriculation}
                  </div>
                  <span className={`${styles.statutBadge} ${styles[vehicule.statut]}`}>
                    {vehicule.statut}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.vehiculeName}>
                    {vehicule.marque} {vehicule.modele}
                    {vehicule.annee && <span className={styles.annee}> ({vehicule.annee})</span>}
                  </h3>

                  {/* Chauffeur affecté */}
                  <div className={styles.chauffeurSection}>
                    <span className={styles.sectionLabel}>Chauffeur</span>
                    {chauffeur ? (
                      <div className={styles.chauffeurInfo}>
                        <span className={styles.chauffeurName}>
                          👤 {chauffeur.chauffeur.prenom} {chauffeur.chauffeur.nom}
                        </span>
                        <span className={styles.chauffeurPhone}>
                          📞 {chauffeur.chauffeur.telephone || 'Non renseigné'}
                        </span>
                        <span className={styles.affectationDate}>
                          Depuis le {new Date(chauffeur.date_debut).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.noChauffeur}>
                        <span>Aucun chauffeur affecté</span>
                        <button 
                          className={styles.inviteBtn}
                          onClick={() => router.push(`/dashboard/proprietaire/chauffeurs/inviter?vehicule=${vehicule.id}`)}
                        >
                          + Inviter
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Conformité */}
                  <div className={styles.conformiteSection}>
                    <span className={styles.sectionLabel}>Conformité</span>
                    <span className={`${styles.conformiteBadge} ${getStatutConformiteColor(vehicule.statut_conformite)}`}>
                      {vehicule.statut_conformite === 'conforme' && '✅ '}
                      {vehicule.statut_conformite === 'bientot_expire' && '⚠️ '}
                      {vehicule.statut_conformite === 'non_conforme' && '❌ '}
                      {vehicule.statut_conformite?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => router.push(`/dashboard/proprietaire/vehicules/${vehicule.id}`)}
                  >
                    📄 Détails
                  </button>
                  {chauffeur && (
                    <button 
                      className={styles.actionBtn}
                      onClick={() => router.push(`/dashboard/proprietaire/versements?vehicule=${vehicule.id}`)}
                    >
                      💰 Versements
                    </button>
                  )}
                  <button 
                    className={styles.actionBtn}
                    onClick={() => router.push(`/dashboard/proprietaire/pannes/nouvelle?vehicule=${vehicule.id}`)}
                  >
                    🔧 Panne
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
