'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui';
import styles from './versements.module.css';

interface Versement {
  id: string;
  montant: number;
  date_versement: string;
  statut: string;
  periode: string;
  commentaire?: string;
  chauffeur: {
    prenom: string;
    nom: string;
  };
  vehicule: {
    immatriculation: string;
    marque: string;
  };
}

export default function ProprietaireVersements() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtreVehicule = searchParams.get('vehicule');
  const filtreChauffeur = searchParams.get('chauffeur');
  
  const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
  
  const [versements, setVersements] = useState<Versement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMois: 0,
    totalAttendu: 0,
    nombreVersements: 0,
    nombreRetards: 0,
  });
  const [filtreMois, setFiltreMois] = useState<string>('');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');

  useEffect(() => {
    if (!profile?.id) return;
    fetchVersements();
  }, [profile, filtreVehicule, filtreChauffeur]);

  const fetchVersements = async () => {
    try {
      // Récupérer les véhicules du propriétaire
      const { data: vehicules } = await supabase
        .from('vehicules')
        .select('id')
        .eq('proprietaire_id', profile?.id);

      const vehiculeIds = vehicules?.map(v => v.id) || [];
      
      if (vehiculeIds.length === 0) {
        setVersements([]);
        setLoading(false);
        return;
      }

      // Construire la requête
      let query = supabase
        .from('versements')
        .select(`
          *,
          chauffeur:profiles!chauffeur_id(prenom, nom),
          vehicule:vehicules!vehicule_id(immatriculation, marque)
        `)
        .in('vehicule_id', vehiculeIds)
        .order('date_versement', { ascending: false });

      if (filtreVehicule) {
        query = query.eq('vehicule_id', filtreVehicule);
      }

      if (filtreChauffeur) {
        query = query.eq('chauffeur_id', filtreChauffeur);
      }

      const { data, error } = await query;

      if (error) throw error;

      const versementsData = data || [];
      setVersements(versementsData);

      // Calculer les stats du mois en cours
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const versementsMois = versementsData.filter(v => 
        new Date(v.date_versement) >= debutMois
      );

      const totalMois = versementsMois.reduce((sum, v) => sum + v.montant, 0);
      const nombreRetards = versementsData.filter(v => v.statut === 'retard').length;

      setStats({
        totalMois,
        totalAttendu: vehiculeIds.length * 50000, // Exemple: 50 000 FCFA par véhicule
        nombreVersements: versementsMois.length,
        nombreRetards,
      });
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadgeClass = (statut: string) => {
    switch (statut) {
      case 'paye': return styles.paye;
      case 'retard': return styles.retard;
      case 'en_attente': return styles.attente;
      default: return '';
    }
  };

  const versementsFiltres = versements.filter(v => {
    if (filtreStatut !== 'tous' && v.statut !== filtreStatut) return false;
    if (filtreMois) {
      const dateVersement = new Date(v.date_versement);
      const [annee, mois] = filtreMois.split('-');
      if (dateVersement.getFullYear() !== parseInt(annee) || 
          dateVersement.getMonth() + 1 !== parseInt(mois)) {
        return false;
      }
    }
    return true;
  });

  const tauxRecouvrement = stats.totalAttendu > 0 
    ? Math.round((stats.totalMois / stats.totalAttendu) * 100)
    : 0;

  if (authLoading || loading) {
    return <div className={styles.loading}>Chargement des versements...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>💰 Versements</h1>
          <p>Suivez les versements de vos chauffeurs</p>
        </div>
        {(filtreVehicule || filtreChauffeur) && (
          <button 
            className={styles.clearFilter}
            onClick={() => router.push('/dashboard/proprietaire/versements')}
          >
            ❌ Effacer les filtres
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalMois.toLocaleString()} FCFA</span>
          <span className={styles.statLabel}>Versé ce mois</span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }}
            />
          </div>
          <span className={styles.progressLabel}>{tauxRecouvrement}% de l&apos;objectif</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.nombreVersements}</span>
          <span className={styles.statLabel}>Versements ce mois</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.totalAttendu.toLocaleString()} FCFA</span>
          <span className={styles.statLabel}>Objectif mensuel</span>
        </div>

        {stats.nombreRetards > 0 && (
          <div className={`${styles.statCard} ${styles.alertCard}`}>
            <span className={styles.statValue}>{stats.nombreRetards}</span>
            <span className={styles.statLabel}>Retards de paiement</span>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Mois</label>
          <input
            type="month"
            value={filtreMois}
            onChange={(e) => setFiltreMois(e.target.value)}
            className={styles.monthInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Statut</label>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className={styles.select}
          >
            <option value="tous">Tous</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="retard">En retard</option>
          </select>
        </div>

        {(filtreVehicule || filtreChauffeur) && (
          <div className={styles.activeFilters}>
            <span>Filtres actifs:</span>
            {filtreVehicule && <span className={styles.filterTag}>🚕 Véhicule</span>}
            {filtreChauffeur && <span className={styles.filterTag}>👨‍✈️ Chauffeur</span>}
          </div>
        )}
      </div>

      {/* Table des versements */}
      {versementsFiltres.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💰</div>
          <h3>Aucun versement trouvé</h3>
          <p>
            {filtreMois || filtreStatut !== 'tous' || filtreVehicule || filtreChauffeur
              ? 'Essayez d\'autres critères de recherche'
              : 'Les versements apparaîtront ici quand vos chauffeurs effectueront des paiements'
            }
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Chauffeur</th>
                <th>Véhicule</th>
                <th>Période</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {versementsFiltres.map((versement) => (
                <tr key={versement.id}>
                  <td>{new Date(versement.date_versement).toLocaleDateString('fr-FR')}</td>
                  <td>
                    {versement.chauffeur?.prenom} {versement.chauffeur?.nom}
                  </td>
                  <td>
                    <span className={styles.plateBadge}>
                      {versement.vehicule?.immatriculation}
                    </span>
                  </td>
                  <td>{versement.periode}</td>
                  <td className={styles.montant}>
                    {versement.montant.toLocaleString()} FCFA
                  </td>
                  <td>
                    <span className={`${styles.statutBadge} ${getStatutBadgeClass(versement.statut)}`}>
                      {versement.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Résumé */}
      {versementsFiltres.length > 0 && (
        <div className={styles.summary}>
          <span>Total affiché: </span>
          <strong>
            {versementsFiltres.reduce((sum, v) => sum + v.montant, 0).toLocaleString()} FCFA
          </strong>
          <span> sur {versementsFiltres.length} versement(s)</span>
        </div>
      )}
    </div>
  );
}
