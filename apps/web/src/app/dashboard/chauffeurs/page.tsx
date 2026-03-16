'use client';

import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from '../vehicules/vehicules.module.css';

interface Chauffeur {
    id: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    created_at: string;
}

export default function ChauffeursPage() {
    const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', email: '' });
    const [error, setError] = useState('');

    const fetchChauffeurs = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, nom, prenom, telephone, email, created_at')
            .eq('role', 'chauffeur')
            .order('created_at', { ascending: false });
        setChauffeurs(data || []);
        setLoading(false);
    };

    useLayoutEffect(() => {
        const frameId = requestAnimationFrame(() => {
            fetchChauffeurs();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // For MVP: create the user via Supabase auth invite or direct insert
        // Here we do a simplified insert into users with role=chauffeur (auth will be linked later)
        const { error: err } = await supabase.from('profiles').insert([{
            id: crypto.randomUUID(),
            ...form,
            role: 'chauffeur'
        }]);
        if (err) { setError(err.message); return; }
        setIsAdding(false);
        setForm({ nom: '', prenom: '', telephone: '', email: '' });
        fetchChauffeurs();
    };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>Gestion des Chauffeurs</h2>
                <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Annuler' : '+ Enregistrer Chauffeur'}</Button>
            </div>

            {isAdding && (
                <div className={`${styles.createForm} glass-panel`}>
                    <h3>Ajouter un chauffeur</h3>
                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                    <form onSubmit={handleAdd}>
                        <div className={styles.formGrid}>
                            <Input label="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required fullWidth />
                            <Input label="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required fullWidth />
                            <Input label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} fullWidth />
                            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} fullWidth />
                        </div>
                        <div className={styles.formActions}><Button type="submit">Enregistrer</Button></div>
                    </form>
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? <div className={styles.emptyState}>Chargement…</div> :
                    chauffeurs.length === 0 ? <div className={styles.emptyState}>Aucun chauffeur enregistré.</div> : (
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Nom & Prénom</th><th>Téléphone</th><th>Email</th><th>Enregistré le</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {chauffeurs.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.prenom} {c.nom}</td>
                                        <td>{c.telephone || '—'}</td>
                                        <td>{c.email || '—'}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td><Button variant="ghost" size="sm">Fiche</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
