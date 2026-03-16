'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface Ville {
    id: string;
    nom: string;
    pays_nom: string;
    super_chef_nom?: string | null;
}

interface VilleDataFromSupabase {
    id: string;
    nom: string;
    pays?: { nom: string }[] | null;
    super_chef?: { prenom: string; nom: string }[] | null;
}

interface ErrorWithMessage {
    message: string;
}

export default function SuperChefsPage() {
    const router = useRouter();
    const [villes, setVilles] = useState<Ville[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedVille, setSelectedVille] = useState<Ville | null>(null);
    
    // Formulaire
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
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

            fetchVilles();
        };

        checkAdmin();
    }, []);

    const fetchVilles = async () => {
        const { data, error } = await supabase
            .from('villes')
            .select(`
                id,
                nom,
                pays: pays_id(nom),
                super_chef_ligne_id,
                super_chef: super_chef_ligne_id(nom, prenom)
            `)
            .order('nom');

        if (data) {
            const villesFormatted = data.map((v: VilleDataFromSupabase) => ({
                id: v.id,
                nom: v.nom,
                pays_nom: v.pays?.[0]?.nom || 'Inconnu',
                super_chef_nom: v.super_chef ? `${v.super_chef[0]?.prenom} ${v.super_chef[0]?.nom}` : null
            }));
            setVilles(villesFormatted);
        }
        setLoading(false);
    };

    const handleNommer = (ville: Ville) => {
        setSelectedVille(ville);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVille) return;

        setLoading(true);
        setMessage('');

        try {
            // Créer l'utilisateur
            const email = form.email || `${form.telephone}@afrimobilis.local`;
            const password = Math.random().toString(36).slice(-8);

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nom: form.nom,
                        prenom: form.prenom,
                        role: 'super_chef_de_ligne'
                    }
                }
            });

            if (authError) throw new Error(authError.message);

            if (authData.user) {
                // Créer le profil
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        nom: form.nom,
                        prenom: form.prenom,
                        email: form.email,
                        telephone: form.telephone,
                        role: 'super_chef_de_ligne',
                        ville_id: selectedVille.id
                    });

                if (profileError) throw new Error(profileError.message);

                // Mettre à jour la ville avec le super_chef_ligne_id
                const { error: villeError } = await supabase
                    .from('villes')
                    .update({ super_chef_ligne_id: authData.user.id })
                    .eq('id', selectedVille.id);

                if (villeError) throw new Error(villeError.message);

                setMessage('✅ Super Chef de Ligne nommé avec succès !');
                setShowModal(false);
                setForm({ nom: '', prenom: '', email: '', telephone: '' });
                fetchVilles();
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Impossible de nommer le Super Chef';
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
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>👑 Super Chefs de Ligne</h1>
            <p style={{ color: '#64748b', marginBottom: 32 }}>
                Nommer les Super Chefs de Ligne pour chaque ville
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
                            <th style={{ textAlign: 'left', padding: '12px' }}>Super Chef de Ligne</th>
                            <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
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
                                    <button
                                        onClick={() => handleNommer(ville)}
                                        style={{
                                            padding: '8px 16px',
                                            background: ville.super_chef_nom ? '#f59e0b' : '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {ville.super_chef_nom ? 'Remplacer' : 'Nommer'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && selectedVille && (
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
                        <h2 style={{ marginBottom: 16 }}>
                            Nommer un Super Chef de Ligne
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: 24 }}>
                            Ville : <strong>{selectedVille.nom}</strong>
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Nom *</label>
                                <input
                                    type="text"
                                    value={form.nom}
                                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Prénom *</label>
                                <input
                                    type="text"
                                    value={form.prenom}
                                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db' }}
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', marginBottom: 8 }}>Téléphone *</label>
                                <input
                                    type="tel"
                                    value={form.telephone}
                                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
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
                                    {loading ? 'Création...' : 'Nommer'}
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
