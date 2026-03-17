'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';

interface UserProfile {
    id: string;
    role: string;
    nom?: string;
    prenom?: string;
}

interface ObjetPerdu {
    id: string;
    declarant_id: string;
    description: string;
    statut: 'perdu' | 'trouve';
    lieu: string;
    vehicule_immatriculation: string;
    etat: 'ouvert' | 'resolu' | 'ferme';
    created_at: string;
}

export default function ObjetsPerdusPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [objets, setObjets] = useState<ObjetPerdu[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', statut: 'perdu', lieu: '', vehicule_immatriculation: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchUserAndObjets = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setUser(profile || { id: session.user.id, role: 'passager' });
            }

            const { data: objectsData } = await supabase
                .from('objets')
                .select('*')
                .order('created_at', { ascending: false });

            if (objectsData) {
                setObjets(objectsData as ObjetPerdu[]);
            }
            setLoading(false);
        };

        fetchUserAndObjets();
    }, []);

    const handleDeclarationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        const newObjet = {
            declarant_id: user.id,
            description: formData.description,
            statut: formData.statut,
            lieu: formData.lieu,
            vehicule_immatriculation: formData.vehicule_immatriculation,
            etat: 'ouvert'
        };

        const { data, error } = await supabase.from('objets').insert([newObjet]).select().single();

        if (!error && data) {
            setObjets([data as ObjetPerdu, ...objets]);
            setIsModalOpen(false);
            setFormData({ description: '', statut: 'perdu', lieu: '', vehicule_immatriculation: '' });
        } else {
            alert('Erreur: ' + (error?.message || 'Une erreur est survenue.'));
        }
        setSubmitting(false);
    };

    const getStatusStyle = (etat: string) => {
        switch (etat) {
            case 'ouvert': return { bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308' }; // Yellow
            case 'resolu': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' }; // Green
            case 'ferme': return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' }; // Gray
            default: return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement des objets...</div>;

    return (
        <div className="fade-in" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🔍</span> Objets Perdus & Trouvés
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        Déclarez un objet oublié dans un taxi, ou signalez un objet que vous avez retrouvé.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                    + Nouvelle Déclaration
                </Button>
            </div>

            {/* Statistiques rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{objets.length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Total Déclarations</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{objets.filter(o => o.statut === 'perdu').length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Objets Perdus</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{objets.filter(o => o.statut === 'trouve').length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Objets Trouvés</div>
                </div>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#eab308' }}>{objets.filter(o => o.etat === 'ouvert').length}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>En Attente (Ouverts)</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {objets.map(objet => (
                    <div key={objet.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                background: objet.statut === 'perdu' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: objet.statut === 'perdu' ? '#ef4444' : '#10b981',
                                textTransform: 'uppercase'
                            }}>
                                Objet {objet.statut}
                            </span>
                            <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: getStatusStyle(objet.etat).bg,
                                color: getStatusStyle(objet.etat).text
                            }}>
                                {objet.etat.toUpperCase()}
                            </span>
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.1rem' }}>{objet.description}</h3>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span>📍</span> <strong>Lieu:</strong> {objet.lieu || 'Non précisé'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span>🚕</span> <strong>Véhicule:</strong> {objet.vehicule_immatriculation || 'Inconnu'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>📅</span> <strong>Date:</strong> {new Date(objet.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {objet.declarant_id === user?.id && (
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Votre déclaration</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {objets.length === 0 && (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>
                    Aucun objet n&apos;a été déclaré pour le moment.
                </div>
            )}

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', padding: '2rem',
                        borderRadius: '16px', border: '1px solid var(--border)'
                    }}>
                        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 600 }}>Nouvelle Déclaration</h2>
                        <form onSubmit={handleDeclarationSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Type de déclaration</label>
                                <select
                                    value={formData.statut}
                                    onChange={e => setFormData({ ...formData, statut: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                >
                                    <option value="perdu">J&apos;ai perdu un objet</option>
                                    <option value="trouve">J&apos;ai trouvé un objet</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description de l&apos;objet (obligatoire)</label>
                                <textarea
                                    required
                                    placeholder="Ex: Sac à main noir de marque X..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Lieu ou trajet précis (obligatoire)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Trajet Koumassi - Plateau"
                                    value={formData.lieu}
                                    onChange={e => setFormData({ ...formData, lieu: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Immatriculation du véhicule (si connue)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 1234 XY 01"
                                    value={formData.vehicule_immatriculation}
                                    onChange={e => setFormData({ ...formData, vehicule_immatriculation: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Validation...' : 'Valider'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
