'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Modal } from '@/components/ui';
import styles from './admin.module.css';

interface ObjetPerdu {
    id: string;
    categorie: string;
    description: string;
    couleur?: string;
    marque?: string;
    lieu_perte: string;
    date_perte: string;
    statut: 'en_attente' | 'matched' | 'rendu' | 'abandonne';
    passager_prenom?: string;
    passager_nom?: string;
    passager_telephone?: string;
    objet_trouve_description?: string;
}

interface ObjetTrouve {
    id: string;
    categorie: string;
    description: string;
    couleur?: string;
    marque?: string;
    lieu_trouve: string;
    date_trouve: string;
    statut: 'en_attente' | 'matched' | 'rendu';
    trouve_par_nom?: string;
    lieu_depose?: string;
}

interface Correspondance {
    objet_perdu_id: string;
    objet_perdu_description: string;
    objet_perdu_categorie: string;
    objet_perdu_couleur?: string;
    lieu_perte: string;
    date_perte: string;
    passager_prenom?: string;
    passager_nom?: string;
    passager_telephone?: string;
    objet_trouve_id: string;
    objet_trouve_description: string;
    objet_trouve_categorie: string;
    objet_trouve_couleur?: string;
    lieu_trouve: string;
    date_trouve: string;
    score_correspondance: number;
}

interface Stats {
    perdus_total: number;
    perdus_en_attente: number;
    perdus_matched: number;
    perdus_rendus: number;
    trouves_total: number;
    trouves_en_attente: number;
    trouves_matched: number;
    trouves_rendus: number;
}

export default function AdminObjetsPage(): JSX.Element {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'correspondances' | 'perdus' | 'trouves'>('correspondances');
    const [correspondances, setCorrespondances] = useState<Correspondance[]>([]);
    const [objetsPerdus, setObjetsPerdus] = useState<ObjetPerdu[]>([]);
    const [objetsTrouves, setObjetsTrouves] = useState<ObjetTrouve[]>([]);
    const [stats, setStats] = useState<Stats>({
        perdus_total: 0, perdus_en_attente: 0, perdus_matched: 0, perdus_rendus: 0,
        trouves_total: 0, trouves_en_attente: 0, trouves_matched: 0, trouves_rendus: 0,
    });
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<Correspondance | null>(null);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [renduNotes, setRenduNotes] = useState('');
    const [selectedObjetPerdu, setSelectedObjetPerdu] = useState<ObjetPerdu | null>(null);
    const [isRenduModalOpen, setIsRenduModalOpen] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/stats', {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    }, []);

    const fetchCorrespondances = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/matching', {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.status === 403) {
                setIsAuthorized(false);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setCorrespondances(data.correspondances || []);
            }
        } catch (error) {
            console.error('Erreur correspondances:', error);
        }
    }, []);

    const fetchObjetsPerdus = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/perdus', {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                setObjetsPerdus(data.objets || []);
            }
        } catch (error) {
            console.error('Erreur objets perdus:', error);
        }
    }, []);

    const fetchObjetsTrouves = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/trouves', {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                setObjetsTrouves(data.objets || []);
            }
        } catch (error) {
            console.error('Erreur objets trouvés:', error);
        }
    }, []);

    const confirmerMatch = async () => {
        if (!selectedMatch) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/matching', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id,
                },
                body: JSON.stringify({
                    objet_perdu_id: selectedMatch.objet_perdu_id,
                    objet_trouve_id: selectedMatch.objet_trouve_id,
                }),
            });

            if (response.ok) {
                setIsMatchModalOpen(false);
                setSelectedMatch(null);
                fetchCorrespondances();
                fetchStats();
                fetchObjetsPerdus();
                fetchObjetsTrouves();
            }
        } catch (error) {
            console.error('Erreur confirmation match:', error);
        }
    };

    const marquerRendu = async () => {
        if (!selectedObjetPerdu) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/objets/matching', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id,
                },
                body: JSON.stringify({
                    objet_perdu_id: selectedObjetPerdu.id,
                    notes: renduNotes,
                }),
            });

            if (response.ok) {
                setIsRenduModalOpen(false);
                setSelectedObjetPerdu(null);
                setRenduNotes('');
                fetchStats();
                fetchObjetsPerdus();
            }
        } catch (error) {
            console.error('Erreur marquage rendu:', error);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchCorrespondances();
        fetchObjetsPerdus();
        fetchObjetsTrouves();
        setLoading(false);
    }, [fetchStats, fetchCorrespondances, fetchObjetsPerdus, fetchObjetsTrouves]);

    // Helpers
    const getCategorieIcon = (categorie: string): string => {
        const icons: Record<string, string> = {
            telephone: '📱',
            portefeuille: '👛',
            sac: '🎒',
            bijou: '💍',
            cle: '🔑',
            vetement: '👕',
            lunettes: '👓',
            autre: '📦',
        };
        return icons[categorie] || '📦';
    };

    const getStatutBadge = (statut: string): string => {
        const badges: Record<string, string> = {
            en_attente: '⏳ En attente',
            matched: '🔗 Matché',
            rendu: '✅ Rendu',
            abandonne: '🗑️ Abandonné',
        };
        return badges[statut] || statut;
    };

    if (!isAuthorized) {
        return (
            <div className={styles.container}>
                <div className={styles.unauthorized}>
                    <h2>⛔ Accès refusé</h2>
                    <p>Vous n&apos;avez pas les permissions pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔍 Gestion des Objets Perdus/Trouvés</h1>
                <p className={styles.subtitle}>Matching et suivi des objets</p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🔍</span>
                    <div>
                        <span className={styles.statValue}>{stats.perdus_en_attente}</span>
                        <span className={styles.statLabel}>Perdus en attente</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📦</span>
                    <div>
                        <span className={styles.statValue}>{stats.trouves_en_attente}</span>
                        <span className={styles.statLabel}>Trouvés en attente</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🔗</span>
                    <div>
                        <span className={styles.statValue}>{stats.perdus_matched}</span>
                        <span className={styles.statLabel}>Matchés</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>✅</span>
                    <div>
                        <span className={styles.statValue}>{stats.perdus_rendus}</span>
                        <span className={styles.statLabel}>Rendus</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'correspondances' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('correspondances')}
                >
                    🔗 Correspondances ({correspondances.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'perdus' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('perdus')}
                >
                    🔍 Objets perdus ({objetsPerdus.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'trouves' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('trouves')}
                >
                    📦 Objets trouvés ({objetsTrouves.length})
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Chargement...</div>
                ) : activeTab === 'correspondances' ? (
                    correspondances.length === 0 ? (
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>🔍</span>
                            <h3>Aucune correspondance potentielle</h3>
                            <p>Le système n&apos;a pas trouvé de correspondances suffisantes.</p>
                        </div>
                    ) : (
                        <div className={styles.correspondancesList}>
                            {correspondances.map((corr) => (
                                <div key={`${corr.objet_perdu_id}-${corr.objet_trouve_id}`} className={styles.correspondanceCard}>
                                    <div className={styles.scoreBadge}>
                                        {corr.score_correspondance}% match
                                    </div>
                                    
                                    <div className={styles.comparison}>
                                        <div className={styles.side}>
                                            <h4>🔍 PERDU</h4>
                                            <div className={styles.itemInfo}>
                                                <span className={styles.icon}>{getCategorieIcon(corr.objet_perdu_categorie)}</span>
                                                <div>
                                                    <p className={styles.categorie}>{corr.objet_perdu_categorie}</p>
                                                    <p className={styles.description}>{corr.objet_perdu_description}</p>
                                                    {corr.objet_perdu_couleur && (
                                                        <p className={styles.detail}>Couleur: {corr.objet_perdu_couleur}</p>
                                                    )}
                                                    <p className={styles.detail}>📍 {corr.lieu_perte}</p>
                                                    <p className={styles.detail}>📅 {new Date(corr.date_perte).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                            <div className={styles.contactInfo}>
                                                <p><strong>{corr.passager_prenom} {corr.passager_nom}</strong></p>
                                                <p>📞 {corr.passager_telephone}</p>
                                            </div>
                                        </div>

                                        <div className={styles.vs}>→</div>

                                        <div className={styles.side}>
                                            <h4>📦 TROUVÉ</h4>
                                            <div className={styles.itemInfo}>
                                                <span className={styles.icon}>{getCategorieIcon(corr.objet_trouve_categorie)}</span>
                                                <div>
                                                    <p className={styles.categorie}>{corr.objet_trouve_categorie}</p>
                                                    <p className={styles.description}>{corr.objet_trouve_description}</p>
                                                    {corr.objet_trouve_couleur && (
                                                        <p className={styles.detail}>Couleur: {corr.objet_trouve_couleur}</p>
                                                    )}
                                                    <p className={styles.detail}>📍 {corr.lieu_trouve}</p>
                                                    <p className={styles.detail}>📅 {new Date(corr.date_trouve).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <Button
                                            onClick={() => {
                                                setSelectedMatch(corr);
                                                setIsMatchModalOpen(true);
                                            }}
                                            variant="primary"
                                        >
                                            ✅ Confirmer le match
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'perdus' ? (
                    objetsPerdus.length === 0 ? (
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>🔍</span>
                            <h3>Aucun objet perdu</h3>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Catégorie</th>
                                    <th>Description</th>
                                    <th>Passager</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objetsPerdus.map((objet) => (
                                    <tr key={objet.id}>
                                        <td>{getCategorieIcon(objet.categorie)} {objet.categorie}</td>
                                        <td>{objet.description}</td>
                                        <td>{objet.passager_prenom} {objet.passager_nom}</td>
                                        <td>{new Date(objet.date_perte).toLocaleDateString('fr-FR')}</td>
                                        <td>{getStatutBadge(objet.statut)}</td>
                                        <td>
                                            {objet.statut === 'matched' && (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedObjetPerdu(objet);
                                                        setIsRenduModalOpen(true);
                                                    }}
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    ✅ Rendu
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    objetsTrouves.length === 0 ? (
                        <div className={styles.empty}>
                            <span className={styles.emptyIcon}>📦</span>
                            <h3>Aucun objet trouvé</h3>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Catégorie</th>
                                    <th>Description</th>
                                    <th>Trouvé par</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objetsTrouves.map((objet) => (
                                    <tr key={objet.id}>
                                        <td>{getCategorieIcon(objet.categorie)} {objet.categorie}</td>
                                        <td>{objet.description}</td>
                                        <td>{objet.trouve_par_nom || 'Anonyme'}</td>
                                        <td>{new Date(objet.date_trouve).toLocaleDateString('fr-FR')}</td>
                                        <td>{getStatutBadge(objet.statut)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Modal Confirmation Match */}
            <Modal
                isOpen={isMatchModalOpen}
                onClose={() => setIsMatchModalOpen(false)}
                title="Confirmer le matching"
                size="medium"
            >
                <div className={styles.modalContent}>
                    <p>Êtes-vous sûr de vouloir matcher ces deux objets ?</p>
                    <div className={styles.modalActions}>
                        <Button onClick={() => setIsMatchModalOpen(false)} variant="secondary">
                            Annuler
                        </Button>
                        <Button onClick={confirmerMatch} variant="primary">
                            ✅ Confirmer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Marquer Rendu */}
            <Modal
                isOpen={isRenduModalOpen}
                onClose={() => setIsRenduModalOpen(false)}
                title="Marquer comme rendu"
                size="medium"
            >
                <div className={styles.modalContent}>
                    <label>Notes (optionnel)</label>
                    <textarea
                        value={renduNotes}
                        onChange={(e) => setRenduNotes(e.target.value)}
                        placeholder="Détails sur le rendu..."
                        rows={3}
                    />
                    <div className={styles.modalActions}>
                        <Button onClick={() => setIsRenduModalOpen(false)} variant="secondary">
                            Annuler
                        </Button>
                        <Button onClick={marquerRendu} variant="success">
                            ✅ Confirmer le rendu
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
