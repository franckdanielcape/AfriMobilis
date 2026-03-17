'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from '../versements/versements.module.css'; // reuse styles

interface Vehicule {
    id: string;
    immatriculation: string;
}

interface Panne {
    id: string;
    vehicule_id: string;
    type_panne: string;
    description: string;
    date_panne: string;
    cout: number | null;
    statut: string;
    declare_par: string;
    immatriculation?: string;
}

interface UserProfile {
    id: string;
    role: 'chauffeur' | 'proprietaire' | 'admin' | string;
    nom?: string;
    prenom?: string;
}

interface FormData {
    vehicule_id: string;
    type_panne: string;
    description: string;
    date_panne: string;
    cout: string;
    statut: string;
}

export default function PannesPage() {
    const [pannes, setPannes] = useState<Panne[]>([]);
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<FormData>({ vehicule_id: '', type_panne: '', description: '', date_panne: '', cout: '', statut: 'en_cours' });
    const [error, setError] = useState('');

    const fetchData = async (profile: UserProfile) => {
        if (!profile) {
            setError('Profil utilisateur non trouvé.');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            let vehQ = supabase.from('vehicules').select('id, immatriculation');
            if (profile.role === 'proprietaire') vehQ = vehQ.eq('proprietaire_id', profile.id);
            const { data: veh, error: vehError } = await vehQ;
            
            if (vehError) throw vehError;
            
            setVehicules(veh || []);
            const ids = (veh || []).map(v => v.id);

            let pannQ = supabase.from('pannes').select('*').order('date_panne', { ascending: false });
            if (profile.role === 'chauffeur') pannQ = pannQ.eq('declare_par', profile.id);
            else if (profile.role === 'proprietaire' && ids.length) pannQ = pannQ.in('vehicule_id', ids);

            const { data: pData, error: pannError } = await pannQ;
            
            if (pannError) throw pannError;
            
            setPannes((pData || []).map(p => ({ ...p, immatriculation: (veh || []).find(v => v.id === p.vehicule_id)?.immatriculation || '—' })));
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError('Erreur lors du chargement: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError('Session non trouvée. Veuillez vous reconnecter.');
                    setLoading(false);
                    return;
                }
                
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                    
                if (profileError || !profile) {
                    setError('Profil utilisateur non trouvé.');
                    setLoading(false);
                    return;
                }
                
                setUser(profile as UserProfile);
                await fetchData(profile as UserProfile);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
                setError('Erreur d\'initialisation: ' + errorMessage);
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const payload: Record<string, unknown> = { 
            ...form, 
            cout: form.cout ? parseFloat(form.cout) : null, 
            declare_par: user?.id 
        };
        const { error: err } = await supabase.from('pannes').insert([payload]);
        if (err) { setError(err.message); return; }
        setIsAdding(false);
        setForm({ vehicule_id: '', type_panne: '', description: '', date_panne: '', cout: '', statut: 'en_cours' });
        if (user) fetchData(user);
    };

    const statutBadge: Record<string, string> = { 'en_cours': 'retard', 'resolu': 'recu' };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>Pannes & Maintenance</h2>
                {(user?.role === 'chauffeur' || user?.role === 'proprietaire') && (
                    <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Annuler' : '🚨 Signaler Panne'}</Button>
                )}
            </div>

            {isAdding && (
                <div className={`${styles.addForm} glass-panel`}>
                    <h3>Déclarer une panne / incident</h3>
                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                    <form onSubmit={handleAdd} className={styles.formGrid}>
                        <div>
                            <label className={styles.label}>Véhicule</label>
                            <select className={styles.select} value={form.vehicule_id} onChange={e => setForm({ ...form, vehicule_id: e.target.value })} required>
                                <option value="">-- Sélectionner --</option>
                                {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
                            </select>
                        </div>
                        <Input label="Type de panne" placeholder="ex: Crevaison, moteur…" value={form.type_panne} onChange={e => setForm({ ...form, type_panne: e.target.value })} required fullWidth />
                        <Input label="Date" type="date" value={form.date_panne} onChange={e => setForm({ ...form, date_panne: e.target.value })} required fullWidth />
                        <Input label="Coût estimé (F CFA)" type="number" placeholder="0" value={form.cout} onChange={e => setForm({ ...form, cout: e.target.value })} fullWidth />
                        <Input label="Description" placeholder="Détails de la panne…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} fullWidth />
                        <div className={styles.formActions}><Button type="submit">Enregistrer</Button></div>
                    </form>
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? <div className={styles.empty}>Chargement…</div> :
                    pannes.length === 0 ? <div className={styles.empty}>Aucune panne signalée.</div> : (
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Véhicule</th><th>Type</th><th>Date</th><th>Coût</th><th>Statut</th></tr>
                            </thead>
                            <tbody>
                                {pannes.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.immatriculation}</td>
                                        <td>{p.type_panne}</td>
                                        <td>{new Date(p.date_panne).toLocaleDateString('fr-FR')}</td>
                                        <td>{p.cout ? `${p.cout.toLocaleString('fr-FR')} F` : '—'}</td>
                                        <td><span className={`${styles.badge} ${styles[statutBadge[p.statut] || 'attendu']}`}>{p.statut.replace('_', ' ')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
