'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface Pays {
    id: string;
    code: string;
    nom: string;
}

interface Ville {
    id: string;
    nom: string;
    pays_nom: string;
    super_chef_nom?: string | null;
    statut: string;
}

interface VilleDataFromSupabase {
    id: string;
    nom: string;
    statut: string;
    pays?: { nom: string }[] | null;
    super_chef?: { prenom: string; nom: string }[] | null;
}

export default function VillesPage() {
    const router = useRouter();
    const [pays, setPays] = useState<Pays[]>([]);
    const [villes, setVilles] = useState<Ville[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    const [form, setForm] = useState({
        nom: '',
        pays_id: ''
    });

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'super_admin') {
                router.push('/dashboard');
                return;
            }

            fetchPays();
            fetchVilles();
        };

        checkAdmin();
    }, []);

    const fetchPays = async () => {
        const { data } = await supabase
            .from('pays')
            .select('*')
            .eq('actif', true)
            .order('nom');
        
        if (data) setPays(data);
    };

    const fetchVilles = async () => {
        const { data } = await supabase
            .from('villes')
            .select(`
                id,
                nom,
                statut,
                pays: pays_id(nom),
                super_chef: super_chef_ligne_id(nom, prenom)
            `)
            .order('nom');

        if (data) {
            const villesFormatted = data.map((v: VilleDataFromSupabase) => ({
                id: v.id,
                nom: v.nom,
                pays_nom: v.pays?.[0]?.nom || 'Inconnu',
                super_chef_nom: v.super_chef ? `${v.super_chef[0]?.prenom} ${v.super_chef[0]?.nom}` : null,
                statut: v.statut
            }));
            setVilles(villesFormatted);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('villes')
                .insert({
                    nom: form.nom,
                    pays_id: form.pays_id,
                    statut: 'actif'
                });

            if (error) throw new Error(error.message);

            setMessage('✅ Ville créée avec succès !');
            setShowModal(false);
            setForm({ nom: '', pays_id: '' });
            fetchVilles();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Impossible de créer la ville';
            setMessage('❌ Erreur: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading && villes.length === 0) {
        return <div style={{ padding: 40 }}>Chargement...</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>🏛️ Gestion des Villes (Lignes)</h1>
            <p style={{ color: '#64748b', marginBottom: 32 }}>
                Créer et gérer les villes où AfriMobilis opère
            </p>

            {message && (
                <div style={{
                    padding: 16,
                    marginBottom: 20,
                    background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                    color: message.startsWith('✅') ? '#166534' : '#dc2626',
                    borderRadius: 8
                }}>
                    {message}
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                    }}
                >
                    + Ajouter une ville
                </button>
            </div>

            <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Ville</th>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Pays</th>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Super Chef</th>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {villes.map((ville) => (
                            <tr key={ville.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{ville.nom}</td>
                                <td style={{ padding: '12px' }}>{ville.pays_nom}</td>
                                <td style={{ padding: '12px' }}>
                                    {ville.super_chef_nom ? (
                                        <span style={{ color: '#059669' }}>✅ {ville.super_chef_nom}</span>
                                    ) : (
                                        <span style={{ color: '#dc2626' }}>❌ Non assigné</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: 12,
                                        background: ville.statut === 'actif' ? '#dcfce7' : '#fee2e2',
                                        color: ville.statut === 'actif' ? '#166534' : '#dc2626',
                                        fontSize: 12
                                    }}>
                                        {ville.statut}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: 32,
                        borderRadius: 12,
                        width: '100%',
                        maxWidth: 500
                    }}>
                        <h2 style={{ marginBottom: 24 }}>Ajouter une ville</h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Pays *</label>
                                <select
                                    value={form.pays_id}
                                    onChange={(e) => setForm({ ...form, pays_id: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db' }}
                                >
                                    <option value="">-- Sélectionner un pays --</option>
                                    {pays.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nom}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Nom de la ville *</label>
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        background: loading ? '#ccc' : '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Création...' : 'Créer'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: 12,
                                        background: '#f3f4f6',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 6,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
