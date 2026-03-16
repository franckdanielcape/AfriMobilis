'use client';

import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from './versements.module.css';

interface Versement {
    id: string;
    vehicule_id: string;
    chauffeur_id: string;
    montant: number;
    date_versement: string;
    statut: string;
    commentaire?: string;
    immatriculation?: string;
}

interface VehiculeSimple {
    id: string;
    immatriculation: string;
}

interface UserProfile {
    id: string;
    role: string;
}

interface VersementPayload {
    vehicule_id: string;
    montant: number;
    date_versement: string;
    statut: string;
    commentaire: string;
    chauffeur_id?: string;
}

const statutColors: Record<string, string> = {
    'attendu': 'attendu',
    'reçu': 'recu',
    'en_retard': 'retard',
    'litige': 'litige',
};

export default function VersementsPage() {
    const [versements, setVersements] = useState<Versement[]>([]);
    const [vehicules, setVehicules] = useState<VehiculeSimple[]>([]);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ vehicule_id: '', montant: '', date_versement: '', statut: 'attendu', commentaire: '' });
    const [error, setError] = useState('');

    const fetchData = async (profile: UserProfile | null) => {
        if (!profile) {
            setError('Profil utilisateur non trouvé. Veuillez vous reconnecter.');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            let vehQuery = supabase.from('vehicules').select('id, immatriculation');
            if (profile.role === 'proprietaire') vehQuery = vehQuery.eq('proprietaire_id', profile.id);
            const { data: vehData, error: vehError } = await vehQuery;
            
            if (vehError) throw vehError;
            
            setVehicules(vehData || []);
            const vehiculeIds = (vehData || []).map((v: VehiculeSimple) => v.id);

            let vQuery = supabase.from('versements').select('*').order('date_versement', { ascending: false });
            if (profile.role === 'chauffeur') vQuery = vQuery.eq('chauffeur_id', profile.id);
            else if (profile.role === 'proprietaire' && vehiculeIds.length) vQuery = vQuery.in('vehicule_id', vehiculeIds);

            const { data: vData, error: vError } = await vQuery;
            
            if (vError) throw vError;
            
            if (vData && vehData) {
                setVersements(vData.map((v: Versement) => ({ 
                    ...v, 
                    immatriculation: vehData.find((vh: VehiculeSimple) => vh.id === v.vehicule_id)?.immatriculation || '—' 
                })));
            }
        } catch (err: unknown) {
            setError('Erreur lors du chargement des données: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
            console.error('Erreur fetchData:', err);
        } finally {
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
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
                
                setUser(profile);
                await fetchData(profile);
            } catch (err: unknown) {
                setError('Erreur d&apos;initialisation: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const payload: VersementPayload = { 
            ...form, 
            montant: parseFloat(form.montant) 
        };
        if (user?.role === 'chauffeur') payload.chauffeur_id = user.id;
        const { error: err } = await supabase.from('versements').insert([payload]);
        if (err) { setError(err.message); return; }
        setIsAdding(false);
        setForm({ vehicule_id: '', montant: '', date_versement: '', statut: 'attendu', commentaire: '' });
        fetchData(user);
    };

    const totalRecu = versements.filter(v => v.statut === 'reçu').reduce((sum, v) => sum + v.montant, 0);
    const totalRetard = versements.filter(v => v.statut === 'en_retard').length;

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>{user?.role === 'chauffeur' ? 'Mes Versements' : 'Suivi des Versements'}</h2>
                {(user?.role === 'proprietaire' || user?.role === 'chauffeur') && (
                    <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Annuler' : '+ Enregistrer versement'}</Button>
                )}
            </div>

            {/* Summary pills */}
            <div className={styles.summaryPills}>
                <div className={`${styles.pill} ${styles.pillGreen}`}>✅ Perçu : <strong>{totalRecu.toLocaleString('fr-FR')} F CFA</strong></div>
                {totalRetard > 0 && <div className={`${styles.pill} ${styles.pillRed}`}>🚨 {totalRetard} versement(s) en retard</div>}
            </div>

            {isAdding && (
                <div className={`${styles.addForm} glass-panel`}>
                    <h3>Enregistrer un versement</h3>
                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                    <form onSubmit={handleAdd} className={styles.formGrid}>
                        <div>
                            <label className={styles.label}>Véhicule</label>
                            <select className={styles.select} value={form.vehicule_id} onChange={e => setForm({ ...form, vehicule_id: e.target.value })} required>
                                <option value="">-- Sélectionner --</option>
                                {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
                            </select>
                        </div>
                        <Input label="Montant (F CFA)" type="number" placeholder="0" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required fullWidth />
                        <Input label="Date" type="date" value={form.date_versement} onChange={e => setForm({ ...form, date_versement: e.target.value })} required fullWidth />
                        <div>
                            <label className={styles.label}>Statut</label>
                            <select className={styles.select} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                                <option value="attendu">Attendu</option>
                                <option value="reçu">Reçu</option>
                                <option value="en_retard">En retard</option>
                                <option value="litige">Litige</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Input label="Commentaire (optionnel)" placeholder="Notes..." value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} fullWidth />
                        </div>
                        <div className={styles.formActions}>
                            <Button type="submit">Enregistrer</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? <div className={styles.empty}>Chargement…</div> :
                    versements.length === 0 ? <div className={styles.empty}>Aucun versement enregistré.</div> : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Véhicule</th>
                                    <th>Montant</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                    <th>Commentaire</th>
                                </tr>
                            </thead>
                            <tbody>
                                {versements.map(v => (
                                    <tr key={v.id}>
                                        <td style={{ fontWeight: 600 }}>{v.immatriculation}</td>
                                        <td>{v.montant?.toLocaleString('fr-FR')} F</td>
                                        <td>{new Date(v.date_versement).toLocaleDateString('fr-FR')}</td>
                                        <td><span className={`${styles.badge} ${styles[statutColors[v.statut] || '']}`}>{v.statut.replace('_', ' ')}</span></td>
                                        <td style={{ color: 'var(--text-muted)' }}>{v.commentaire || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
