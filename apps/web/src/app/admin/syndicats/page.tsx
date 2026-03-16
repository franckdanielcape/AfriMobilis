'use client';

import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from './syndicats.module.css';

interface Syndicat {
    id: string;
    nom: string;
    zone: string;
    created_at: string;
}

export default function SyndicatsPage() {
    const [syndicats, setSyndicats] = useState<Syndicat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [nom, setNom] = useState('');
    const [zone, setZone] = useState('');
    const [error, setError] = useState('');

    const fetchSyndicats = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('syndicats')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setSyndicats(data);
        }
        setLoading(false);
    };

    useLayoutEffect(() => {
        // Utiliser requestAnimationFrame pour éviter l'erreur setState dans useLayoutEffect
        const frameId = requestAnimationFrame(() => {
            fetchSyndicats();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const { error: insertError } = await supabase
            .from('syndicats')
            .insert([{ nom, zone }]);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        setNom('');
        setZone('');
        setIsCreating(false);
        fetchSyndicats();
    };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>Gestion des Syndicats</h2>
                <Button onClick={() => setIsCreating(!isCreating)} variant="primary">
                    {isCreating ? 'Annuler' : '+ Nouveau Syndicat'}
                </Button>
            </div>

            {isCreating && (
                <div className={`${styles.createForm} glass-panel`}>
                    <h3>Ajouter un syndicat</h3>
                    <form onSubmit={handleCreate} className={styles.formGrid}>
                        <Input
                            label="Nom du Syndicat"
                            placeholder="ex: Syndicat des Taxis de la Plage"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            required
                            fullWidth
                        />
                        <Input
                            label="Zone d&apos;opération"
                            placeholder="ex: Quartier France"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            required
                            fullWidth
                        />
                        <div className={styles.formActions}>
                            <Button type="submit">Enregistrer</Button>
                        </div>
                    </form>
                    {error && <div className={styles.errorText}>{error}</div>}
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? (
                    <div className={styles.emptyState}>Chargement des syndicats...</div>
                ) : syndicats.length === 0 ? (
                    <div className={styles.emptyState}>
                        Aucun syndicat enregistré pour le moment.
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nom du Syndicat</th>
                                <th>Zone</th>
                                <th>Date de création</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {syndicats.map((syndicat) => (
                                <tr key={syndicat.id}>
                                    <td style={{ fontWeight: 500 }}>{syndicat.nom}</td>
                                    <td>{syndicat.zone}</td>
                                    <td>{new Date(syndicat.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <Button variant="ghost" size="sm">Gérer</Button>
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
