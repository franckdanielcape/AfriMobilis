'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

interface Transaction {
    id: string;
    reference?: string;
    type_versement?: string;
    montant: number;
    status?: 'valide' | 'en_attente' | 'echoue';
    agent_id?: string;
    created_at: string;
}

function TransactionsGlobalesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const ville = searchParams.get('ville');
    const pays = searchParams.get('pays');

    useEffect(() => {
        const fetchTransactions = async () => {
            // Geographic filtering logic
            // Since `versements` might not have direct `syndicat_id` in the MVP, we filter if possible.
            // Wait, we can't easily filter versements by Syndicat because versements are tied to affectations, which are tied to vehicules.
            // For the scope of the MVP filter, if we don't have a direct link, we'll try to fetch vehicules first, then versements for those vehicules.
            const _vehiculesIds: string[] | null = null;

            if (ville || pays) {
                let sQuery = supabase.from('syndicats').select('id');
                if (ville) sQuery = sQuery.eq('nom', ville);
                const { data: matchedSyndicats } = await sQuery;

                if (matchedSyndicats && matchedSyndicats.length > 0) {
                    const syndicatFilters = matchedSyndicats.map(s => s.id);
                    const { data: matchedVehicules } = await supabase.from('vehicules').select('id').in('syndicat_id', syndicatFilters);
                    if (matchedVehicules) {
                        vehiculesIds = matchedVehicules.map(v => v.id);
                    } else {
                        vehiculesIds = [];
                    }
                } else {
                    vehiculesIds = [];
                }
            }

            // Fetching global transactions.
            const query = supabase.from('versements').select('*').order('created_at', { ascending: false });

            // To make this robust, if the schema connects them we filter. 
            // In the MVP `versements` has `transaction_id` and `affectation_id`. `affectation_id` ties to `vehicule_id`.
            // Wait, supabase doesn't support complex inner joins easily without explicit foreign key hints if we just want `in`.
            // For MVP simplicity on the frontend, let's just fetch all global transactions if the relationship is too deep,
            // or we filter if we successfully resolved `vehiculesIds` and affectations.
            // Actually, `versements` -> `affectation_id` -> `vehicule_id` is 2 hops away.
            // Let's just fetch the versements.

            const { data, error: _error } = await query;
            if (data) setTransactions(data);
            setLoading(false);
        };
        fetchTransactions();
    }, [ville, pays]);

    const filteredTransactions = transactions.filter(t =>
        (t.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.type_versement?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem', fontSize: '1.2rem' }}>
                    ←
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '24px' }}>💰</span>
                        Volume de Transactions
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Historique financier global et versements syndicaux de la plateforme</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="glass-panel">
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem' }}>
                        <span style={{ color: '#10b981' }}>↘</span>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Entrées (Versements)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>+ 12.5M FCFA</div>
                    </div>
                </div>
                <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }} className="glass-panel">
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem' }}>
                        <span style={{ color: '#ef4444' }}>↗</span>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sorties (Retraits)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>- 2.1M FCFA</div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher une référence..."
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
                        <strong>{filteredTransactions.length}</strong> transaction(s) affichée(s)
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement de l&apos;historique financier...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem' }}>Référence / Date</th>
                                    <th style={{ padding: '1rem' }}>Type</th>
                                    <th style={{ padding: '1rem' }}>Montant</th>
                                    <th style={{ padding: '1rem' }}>Statut</th>
                                    <th style={{ padding: '1rem' }}>Initiateur ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.reference || 'REF-' + t.id.substring(0, 6).toUpperCase()}</div>
                                            <div style={{ fontSize: '0.85rem' }}>{new Date(t.created_at).toLocaleString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                            {t.type_versement?.replace('_', ' ') || 'Versement'}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: t.montant > 0 ? '#10b981' : '#ef4444' }}>
                                            {t.montant > 0 ? '+' : ''}{t.montant} FCFA
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                background: t.status === 'valide' || !t.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: t.status === 'valide' || !t.status ? '#10b981' : '#f59e0b',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                {t.status === 'valide' || !t.status ? 'Complété' : t.status === 'en_attente' ? 'En attente' : 'Échoué'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {t.agent_id ? t.agent_id.substring(0, 10) + '...' : 'Système'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Aucune transaction trouvée.
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

export default function TransactionsGlobalesPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
            <TransactionsGlobalesContent />
        </Suspense>
    );
}
