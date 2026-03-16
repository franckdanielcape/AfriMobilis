'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui';
import styles from './pannes.module.css';

interface Panne {
  id: string;
  type_panne: string;
  description: string;
  date_declaration: string;
  date_resolution?: string;
  cout?: number;
  statut: string;
  vehicule: {
    immatriculation: string;
    marque: string;
  };
  declare_par: {
    prenom: string;
    nom: string;
  };
}

export default function ProprietairePannes() {
  const router = useRouter();
  const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
  
  const [pannes, setPannes] = useState<Panne[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    resolues: 0,
    coutTotal: 0,
  });

  useEffect(() => {
    if (!profile?.id) return;
    fetchPannes();
  }, [profile]);

  const fetchPannes = async () => {
    try {
      // Récupérer les véhicules du propriétaire
      const { data: vehicules } = await supabase
        .from('vehicules')
        .select('id')
        .eq('proprietaire_id', profile?.id);

      const vehiculeIds = vehicules?.map(v => v.id) || [];
      
      if (vehiculeIds.length === 0) {
        setPannes([]);
        setLoading(false);
        return;
      }

      // Récupérer les pannes
      const { data, error } = await supabase
        .from('pannes')
        .select(`
          *,
          vehicule:vehicules!vehicule_id(immatriculation, marque),
          declare_par:profiles!declare_par_id(prenom, nom)
        `)
        .in('vehicule_id', vehiculeIds)
        .order('date_declaration', { ascending: false });

      if (error) throw error;

      const pannesData = data || [];
      setPannes(pannesData);

      // Calculer les stats
      const enCours = pannesData.filter(p => p.statut === 'en_cours').length;
      const resolues = pannesData.filter(p => p.statut === 'resolue').length;
      const coutTotal = pannesData.reduce((sum, p) => sum + (p.cout || 0), 0);

      setStats({
        total: pannesData.length,
        enCours,
        resolues,
        coutTotal,
      });
    } catch (error) {
      console.error('Erreur chargement pannes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResoudre = async (panneId: string) => {
    const cout = prompt('Coût de la réparation (FCFA):');
    if (cout === null) return;

    try {
      const { error } = await supabase
        .from('pannes')
        .update({
          statut: 'resolue',
          date_resolution: new Date().toISOString(),
          cout: parseInt(cout) || 0,
        })
        .eq('id', panneId);

      if (error) throw error;

      fetchPannes();
    } catch (error) {
      console.error('Erreur résolution:', error);
      alert('Erreur lors de la résolution');
    }
  };

  const getStatutBadgeClass = (statut: string) => {
    switch (statut) {
      case 'en_cours': return styles.enCours;
      case 'resolue': return styles.resolue;
      case 'signalee': return styles.signalee;
      default: return '';
    }
  };

  const pannesFiltrees = pannes.filter(p => {
    if (filtreStatut === 'tous') return true;
    return p.statut === filtreStatut;
  });

  if (authLoading || loading) {
    return <div className={styles.loading}>Chargement des pannes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>🔧 Pannes & Maintenance</h1>
          <p>Suivez les incidents et réparations de votre flotte</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => router.push('/dashboard/proprietaire/pannes/nouvelle')}
        >
          + Déclarer une panne
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statLabel}>Pannes totales</span>
        </div>
        <div className={`${styles.statCard} ${stats.enCours > 0 ? styles.alert : ''}`}>
          <span className={styles.statValue}>{stats.enCours}</span>
          <span className={styles.statLabel}>En cours</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.resolues}</span>
          <span className={styles.statLabel}>Résolues</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.coutTotal.toLocaleString()} FCFA</span>
          <span className={styles.statLabel}>Coût total</span>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className={styles.select}
        >
          <option value="tous">Tous les statuts</option>
          <option value="signalee">Signalées</option>
          <option value="en_cours">En cours de réparation</option>
          <option value="resolue">Résolues</option>
        </select>
      </div>

      {/* Liste des pannes */}
      {pannesFiltrees.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔧</div>
          <h3>Aucune panne signalée</h3>
          <p>Vos véhicules sont en bon état !</p>
        </div>
      ) : (
        <div className={styles.pannesList}>
          {pannesFiltrees.map((panne) => (
            <div key={panne.id} className={styles.panneCard}>
              <div className={styles.panneHeader}>
                <div className={styles.panneType}>
                  <span className={styles.typeIcon}>🔧</span>
                  <div>
                    <h3>{panne.type_panne}</h3>
                    <span className={styles.vehiculeInfo}>
                      {panne.vehicule?.immatriculation} - {panne.vehicule?.marque}
                    </span>
                  </div>
                </div>
                <span className={`${styles.statutBadge} ${getStatutBadgeClass(panne.statut)}`}>
                  {panne.statut}
                </span>
              </div>

              <div className={styles.panneBody}>
                <p className={styles.description}>{panne.description}</p>
                
                <div className={styles.panneMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Signalé par</span>
                    <span className={styles.metaValue}>
                      {panne.declare_par?.prenom} {panne.declare_par?.nom}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Date</span>
                    <span className={styles.metaValue}>
                      {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {panne.cout && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Coût</span>
                      <span className={styles.metaValue}>
                        {panne.cout.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  {panne.date_resolution && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Résolu le</span>
                      <span className={styles.metaValue}>
                        {new Date(panne.date_resolution).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {panne.statut !== 'resolue' && (
                <div className={styles.panneActions}>
                  <button 
                    className={styles.resolveBtn}
                    onClick={() => handleResoudre(panne.id)}
                  >
                    ✅ Marquer comme résolue
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
