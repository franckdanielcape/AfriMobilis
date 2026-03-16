'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

interface Vehicule {
    id: string;
    immatriculation: string;
    marque?: string;
    modele?: string;
    conformite_status?: 'conforme' | 'non_conforme' | 'bientot_expire';
    proprietaire_id?: string;
    created_at?: string;
}

function VehiculesGlobauxContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const ville = searchParams.get('ville');
    const pays = searchParams.get('pays');

    useEffect(() => {
        const fetchVehicules = async () => {
            let syndicatFilters: string[] | null = null;
            if (ville || pays) {
                let sQuery = supabase.from('syndicats').select('id');
                if (ville) sQuery = sQuery.eq('nom', ville);
                const { data: matchedSyndicats } = await sQuery;
                if (matchedSyndicats) {
                    syndicatFilters = matchedSyndicats.map(s => s.id);
                }
            }

            let query = supabase.from('vehicules').select('*').order('created_at', { ascending: false });

            if (syndicatFilters) {
                if (syndicatFilters.length === 0) {
                    setVehicules([]);
                    setLoading(false);
                    return;
                }
                query = query.in('syndicat_id', syndicatFilters);
            }

            const { data, error: _error } = await query;
            if (data) setVehicules(data);
            setLoading(false);
        };
        fetchVehicules();
    }, [ville, pays]);

    const filteredVehicules = vehicules.filter(v =>
        (v.immatriculation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (v.modele?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem', fontSize: '1.2rem' }}>
                    ←
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '24px' }}>🚕</span>
                        Véhicules Enregistrés
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Parc automobile global de toutes les zones syndicales</p>
                </div>
            </div>

            <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Immatriculation, Modèle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <strong>{filteredVehicules.length}</strong> véhicule(s)
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des véhicules...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem' }}>Immatriculation</th>
                                    <th style={{ padding: '1rem' }}>Modèle & Marque</th>
                                    <th style={{ padding: '1rem' }}>Statut Conformité</th>
                                    <th style={{ padding: '1rem' }}>Propriétaire ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicules.map(v => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, letterSpacing: '1px' }}>
                                            {v.immatriculation}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {v.marque || '—'} {v.modele || ''}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                background: v.conformite_status === 'conforme' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: v.conformite_status === 'conforme' ? '#10b981' : '#ef4444',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                {v.conformite_status === 'conforme' ? 'Conforme' : 'Non Conforme'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {v.proprietaire_id ? v.proprietaire_id.substring(0, 10) + '...' : 'Non assigné'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredVehicules.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Aucun véhicule trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VehiculesGlobauxPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
            <VehiculesGlobauxContent />
        </Suspense>
    );
}
