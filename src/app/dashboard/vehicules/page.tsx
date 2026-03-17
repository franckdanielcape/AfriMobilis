'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from './vehicules.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
    statut: string;
    created_at: string;
    ligne_id?: string;
    proprietaire_id?: string;
}

interface UserProfile {
    id: string;
    email?: string;
    role: string;
    prenom?: string;
    nom?: string;
}

export default function VehiculesPage() {
    const router = useRouter();
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [immatriculation, setImmatriculation] = useState('');
    const [error, setError] = useState('');

    // Récupérer l&apos;utilisateur connecté
    const fetchUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // Récupérer le profil complet depuis Supabase
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: profile.role,
                prenom: profile.prenom,
                nom: profile.nom
            });
        } else {
            // Fallback sur les métadonnées auth
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'passager',
                prenom: session.user.user_metadata?.prenom || 'Utilisateur',
                nom: session.user.user_metadata?.nom || ''
            });
        }
    };

    const fetchVehicules = async (profile: UserProfile | null) => {
        setLoading(true);
        try {
            let query = supabase.from('vehicules').select('*').order('created_at', { ascending: false });

            if (profile?.role === 'proprietaire') {
                query = query.eq('proprietaire_id', profile.id);
            }

            const { data, error } = await query;
            
            if (error) {
                console.warn('Erreur chargement véhicules:', error.message);
                setVehicules([]);
            } else {
                setVehicules(data || []);
            }
        } catch (err) {
            console.error('Erreur:', err);
            setVehicules([]);
        } finally {
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        fetchUser();
    }, []);

    // Charger les véhicules quand l&apos;utilisateur est connu
    useLayoutEffect(() => {
        if (user) {
            fetchVehicules(user);
        }
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const newVehicule: { immatriculation: string; proprietaire_id?: string } = { immatriculation };
        if (user?.role === 'proprietaire') {
            newVehicule.proprietaire_id = user.id;
        }

        const { error: insertError } = await supabase
            .from('vehicules')
            .insert([newVehicule]);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        setImmatriculation('');
        setIsCreating(false);
        fetchVehicules(user);
    };

    const statutColors: Record<string, string> = {
        'actif': 'valide',
        'en_attente': 'attendu',
        'inactif': 'expire',
        'maintenance': 'bientot'
    };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>{user?.role === 'proprietaire' ? 'Mes Véhicules' : 'Parc Véhicules'}</h2>
                {(user?.role === 'admin_syndicat' || user?.role === 'super_admin' || user?.role === 'proprietaire') && (
                    <Button onClick={() => setIsCreating(!isCreating)} variant="primary">
                        {isCreating ? 'Annuler' : '+ Nouveau Véhicule'}
                    </Button>
                )}
            </div>

            {isCreating && (
                <div className={`${styles.createForm} glass-panel`}>
                    <h3>Ajouter un véhicule</h3>
                    <form onSubmit={handleCreate}>
                        <div className={styles.formGrid}>
                            <Input
                                label="Immatriculation"
                                placeholder="AB-1234-CD"
                                value={immatriculation}
                                onChange={(e) => setImmatriculation(e.target.value.toUpperCase())}
                                required
                                fullWidth
                            />
                        </div>
                        {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
                        <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                            <Button type="submit">Enregistrer</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? (
                    <div className={styles.emptyState}>Chargement...</div>
                ) : vehicules.length === 0 ? (
                    <div className={styles.emptyState}>
                        Aucun véhicule enregistré.
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Immatriculation</th>
                                <th>Statut</th>
                                <th>Ajouté le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicules.map((v) => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 600 }}>{v.immatriculation}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[statutColors[v.statut] || 'attendu']}`}>
                                            {v.statut}
                                        </span>
                                    </td>
                                    <td>{new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <Button variant="ghost" size="sm">Détails</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
