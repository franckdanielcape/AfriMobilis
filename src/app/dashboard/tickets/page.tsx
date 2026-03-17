'use client';

import { useState, useLayoutEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from '../conformite/conformite.module.css';

interface Ticket {
    id: string;
    type: string;
    description: string;
    lieu?: string;
    locus?: string;
    date_incident?: string;
    created_at: string;
    statut: string;
    ui_type: string;
}

interface UserProfile {
    id: string;
    role: string;
}

interface TicketsResponse {
    data: Ticket[] | null;
    error: Error | null;
}

interface ObjetsResponse {
    data: Array<{
        id: string;
        type: string;
        description: string;
        locus?: string;
        date_evenement?: string;
        created_at: string;
        statut: string;
    }> | null;
    error: Error | null;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ type_ticket: 'reclamation', description: '', lieu: '', date_incident: '' });
    const [error, setError] = useState('');

    const fetchTickets = async (profile: UserProfile | null) => {
        if (!profile) {
            setError('Profil utilisateur non trouvé.');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            let t_q = supabase.from('tickets').select('*').order('created_at', { ascending: false });
            const o_q = supabase.from('objets').select('*').order('created_at', { ascending: false });

            if (profile.role === 'passager') {
                t_q = t_q.eq('passager_id', profile.id);
            }

            const [{ data: tData, error: tError }, { data: oData, error: oError }]: [TicketsResponse, ObjetsResponse] = await Promise.all([t_q, o_q]);
            
            if (tError) throw tError;
            if (oError) throw oError;

            // Merge tickets and objects for display
            const mergedList = [
                ...(tData || []).map(t => ({ ...t, ui_type: t.type })),
                ...(oData || []).map(o => ({ ...o, ui_type: `objet_${o.type}`, date_incident: o.date_evenement }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setTickets(mergedList);
        } catch (err: unknown) {
            setError('Erreur lors du chargement: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
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
                await fetchTickets(profile);
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

        if (form.type_ticket === 'reclamation') {
            const { error: err } = await supabase.from('tickets').insert([{
                type: 'reclamation', description: form.description, lieu: form.lieu, date_incident: form.date_incident || null, passager_id: user?.id
            }]);
            if (err) { setError(err.message); return; }
        } else {
            // It&apos;s an object (perdu / retrouve) - Needs a ticket of type assistance first
            const typeObjet = form.type_ticket.replace('objet_', '');
            const { data: ticket, error: tErr } = await supabase.from('tickets').insert([{
                type: 'assistance', description: `Signalement objet ${typeObjet}`, passager_id: user?.id
            }]).select().single();

            if (tErr || !ticket) { setError(tErr?.message || 'Error creating linked ticket'); return; }

            const { error: oErr } = await supabase.from('objets').insert([{
                ticket_id: ticket.id, type: typeObjet, description: form.description, locus: form.lieu, date_evenement: form.date_incident || null
            }]);

            if (oErr) { setError(oErr.message); return; }
        }

        setIsAdding(false);
        setForm({ type_ticket: 'reclamation', description: '', lieu: '', date_incident: '' });
        fetchTickets(user);
    };

    const statutColors: Record<string, string> = {
        'soumis': 'attendu', 'en_cours': 'bientot', 'resolu': 'valide', 'rejete': 'expire'
    };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>{user?.role === 'passager' ? 'Mes Réclamations & Objets' : 'Gestion des Tickets'}</h2>
                {(user?.role === 'passager') && (
                    <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Annuler' : '+ Nouveau Ticket'}</Button>
                )}
            </div>

            {isAdding && (
                <div className={`${styles.addForm} glass-panel`}>
                    <h3>Créer un ticket</h3>
                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                    <form onSubmit={handleAdd} className={styles.formGrid}>
                        <div>
                            <label className={styles.label}>Type de ticket</label>
                            <select className={styles.select} value={form.type_ticket} onChange={e => setForm({ ...form, type_ticket: e.target.value })}>
                                <option value="reclamation">Réclamation</option>
                                <option value="objet_perdu">Objet perdu</option>
                                <option value="objet_retrouve">Objet retrouvé</option>
                            </select>
                        </div>
                        <Input label="Lieu" placeholder="ex: Carrefour Phare" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} fullWidth />
                        <Input label="Date de l&apos;incident" type="date" value={form.date_incident} onChange={e => setForm({ ...form, date_incident: e.target.value })} fullWidth />
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Input label="Description" placeholder="Décrivez votre réclamation en détail…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required fullWidth />
                        </div>
                        <div className={styles.formActions}><Button type="submit">Soumettre</Button></div>
                    </form>
                </div>
            )}

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? <div className={styles.empty}>Chargement…</div> :
                    tickets.length === 0 ? <div className={styles.empty}>Aucun ticket pour le moment.</div> : (
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Type</th><th>Description</th><th>Lieu</th><th>Date</th><th>Statut</th></tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{t.ui_type.replace('_', ' ')}</td>
                                        <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                                        <td>{t.lieu || t.locus || '—'}</td>
                                        <td>{t.date_incident ? new Date(t.date_incident).toLocaleDateString('fr-FR') : '—'}</td>
                                        <td><span className={`${styles.badge} ${styles[statutColors[t.statut] || 'attendu']}`}>{t.statut}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}
