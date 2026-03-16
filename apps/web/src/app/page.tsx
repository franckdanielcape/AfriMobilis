'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';

interface StatsPubliques {
  totalVehicules: number;
  objetsRetrouves: number;
  recherchesActives: number;
}

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<StatsPubliques>({
    totalVehicules: 0,
    objetsRetrouves: 0,
    recherchesActives: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    // Récupérer les stats publiques en temps réel
    const fetchStats = async () => {
      try {
        // Compter les véhicules
        const { count: vehiculesCount } = await supabase
          .from('vehicules')
          .select('*', { count: 'exact', head: true });

        // Compter les objets retrouvés (statut = 'rendu')
        const { count: objetsRetrouvesCount } = await supabase
          .from('objets_perdus')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'rendu');

        // Compter les recherches actives (objets perdus en attente)
        const { count: recherchesCount } = await supabase
          .from('objets_perdus')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'en_attente');

        setStats({
          totalVehicules: vehiculesCount || 0,
          objetsRetrouves: objetsRetrouvesCount || 0,
          recherchesActives: recherchesCount || 0,
        });
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    fetchStats();
  }, []);

  // Éviter le flash de contenu
  if (!mounted) {
    return <div style={{ height: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }} />;
  }

  return (
    <div className={styles.main}>
      {/* Abstract Background Elements */}
      <div className={styles.bgCircle1}></div>
      <div className={styles.bgCircle2}></div>

      <header className={styles.header}>
        <div className="container">
          <nav className={styles.nav}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoHighlight}>Afri</span>Mobilis
            </Link>
            <div className={styles.navLinks}>
              <Link href="/objets" className={styles.supportLink} style={{ fontWeight: 600, marginRight: '1rem' }}>
                Objets Trouvés
              </Link>
              <Link href="/marketplace" className={styles.supportLink} style={{ fontWeight: 600, marginRight: '1rem' }}>
                Marketplace
              </Link>
              <Link href="/login" className={styles.loginBtn}>
                Connexion
              </Link>
              <Link href="/register" className={styles.supportLink} style={{ marginLeft: '1rem' }}>
                Créer un compte
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className={styles.heroSection}>
          <div className={`${styles.heroContent} fade-in`}>
            <h1 className={styles.title}>
              Le futur du <span className={styles.highlightText}>Taxi Informel</span> <br /> à Grand-Bassam
            </h1>
            <p className={styles.subtitle}>
              Une plateforme centralisée pour les syndicats, propriétaires, chauffeurs et passagers. 
              Gérez vos véhicules, suivez vos versements et déclarez vos objets perdus en toute transparence.
            </p>
            <div className={styles.ctaGroup}>
              <Link href={isAuthenticated ? "/dashboard" : "/login"} className="btn-primary">
                Accéder au Dashboard
              </Link>
              <Link href="/marketplace" className={styles.btnSecondary} style={{ marginLeft: '1rem' }}>
                Acheter un véhicule
              </Link>
              <Link href="/register" className={styles.btnSecondary} style={{ marginLeft: '1rem' }}>
                Rejoignez le réseau
              </Link>
            </div>
          </div>

          <div className={`${styles.heroCards} fade-in`}>
            <div className={styles.cardInfo}>
              <div className={styles.cardIcon}>🚕</div>
              <div className={styles.cardContent}>
                <h3>{loading ? '...' : `${stats.totalVehicules}+ Véhicules`}</h3>
                <p>Déjà enregistrés sur la plateforme</p>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardIcon}>✅</div>
              <div className={styles.cardContent}>
                <h3>Conformité</h3>
                <p>Suivi en temps réel des documents</p>
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardIcon}>🤝</div>
              <div className={styles.cardContent}>
                <h3>Transparence</h3>
                <p>Versements et contrôles sécurisés</p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories - DONNÉES RÉELLES */}
        <section className={`${styles.successSection} fade-in`}>
          <h2 className={styles.successTitle}>Un réseau de confiance à votre service</h2>
          <p className={styles.successSubtitle}>
            AfriMobilis connecte directement passagers et chauffeurs. Grâce à notre système de traçabilité, 
            de nombreux passagers retrouvent leurs objets oubliés à bord.
          </p>
          <div className={styles.statsGrid}>
            <div className={styles.statBadge}>
              <div className={styles.statIcon} style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎁</div>
              <div className={styles.statNumber}>
                {loading ? '...' : `${stats.objetsRetrouves}`}
              </div>
              <div className={styles.statLabel}>Objets Retrouvés</div>
              <div className={styles.statDesc}>Rendus à leurs propriétaires via l&apos;application</div>
            </div>
            <div className={styles.statBadge}>
              <div className={styles.statIcon} style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <div className={styles.statNumber} style={{ color: '#eab308' }}>
                {loading ? '...' : `${stats.recherchesActives}`}
              </div>
              <div className={styles.statLabel}>Recherches Actives</div>
              <div className={styles.statDesc}>Avis de recherche en cours avec nos chauffeurs</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <h2 className={styles.featuresTitle}>Pour qui ?</h2>
          <div className={styles.featuresGrid}>
            <Link href="/register/syndicat" className={styles.featureCard}>
              <div className={styles.featureIcon}>👑</div>
              <h3>Chefs de Ligne</h3>
              <p>Gérez votre parc, validez les documents et contrôlez la conformité</p>
            </Link>
            <Link href="/register" className={styles.featureCard}>
              <div className={styles.featureIcon}>🔑</div>
              <h3>Propriétaires</h3>
              <p>Suivez vos véhicules, vos chauffeurs et vos versements en temps réel</p>
            </Link>
            <Link href="/register/chauffeur" className={styles.featureCard}>
              <div className={styles.featureIcon}>👨‍✈️</div>
              <h3>Chauffeurs</h3>
              <p>Accédez à vos versements, signalez des pannes et retrouvez des offres</p>
            </Link>
            <Link href="/objets" className={styles.featureCard}>
              <div className={styles.featureIcon}>🎒</div>
              <h3>Passagers</h3>
              <p>Déclarez vos objets perdus et suivez les avis de recherche</p>
            </Link>
          </div>
        </section>

      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>&copy; 2024 AfriMobilis - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}
