'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function NouveauChefDeLignePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [villeId, setVilleId] = useState<string>('');
    const [villeNom, setVilleNom] = useState<string>('');
    
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Récupérer la ville du Super Chef
            const { data: profile } = await supabase
                .from('profiles')
                .select('ville_id, role, villes(nom)')
                .eq('id', session.user.id)
                .single();

            if (!profile || profile.role !== 'super_chef_de_ligne') {
                router.push('/dashboard');
                return;
            }

            setVilleId(profile.ville_id);
            setVilleNom((profile.villes as any)?.[0]?.nom || 'la ville');
        };

        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Créer l'utilisateur avec auth.signUp
            const email = form.email || `${form.telephone}@afrimobilis.local`;
            const password = Math.random().toString(36).slice(-8);

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nom: form.nom,
                        prenom: form.prenom,
                        role: 'chef_de_ligne'
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message);
            }

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
                        role: 'chef_de_ligne',
                        ville_id: villeId
                    });

                if (profileError) {
                    throw new Error(profileError.message);
                }

                setMessage('✅ Chef de Ligne créé avec succès !');
                
                // Rediriger après 2 secondes
                setTimeout(() => {
                    router.push('/dashboard/super-chef');
                }, 2000);
            }
        } catch (err: unknown) {
            setMessage('❌ Erreur: ' + (err instanceof Error ? err.message : 'Impossible de créer le Chef de Ligne'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ marginBottom: 8 }}>➕ Nouveau Chef de Ligne</h1>
            <p style={{ color: '#64748b', marginBottom: 24 }}>
                Ce Chef de Ligne gérera {villeNom} avec vous.
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

            <form onSubmit={handleSubmit} style={{
                background: 'white',
                padding: 32,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                        Nom *
                    </label>
                    <input
                        type="text"
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        required
                        style={{
                            width: '100%',
                            padding: 12,
                            border: '1px solid #d1d5db',
                            borderRadius: 6
                        }}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                        Prénom *
                    </label>
                    <input
                        type="text"
                        value={form.prenom}
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                        required
                        style={{
                            width: '100%',
                            padding: 12,
                            border: '1px solid #d1d5db',
                            borderRadius: 6
                        }}
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{
                            width: '100%',
                            padding: 12,
                            border: '1px solid #d1d5db',
                            borderRadius: 6
                        }}
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                        Téléphone *
                    </label>
                    <input
                        type="tel"
                        value={form.telephone}
                        onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                        required
                        placeholder="07XX XX XX XX"
                        style={{
                            width: '100%',
                            padding: 12,
                            border: '1px solid #d1d5db',
                            borderRadius: 6
                        }}
                    />
                </div>

                <div style={{ 
                    marginBottom: 24, 
                    padding: 16, 
                    background: '#dbeafe', 
                    borderRadius: 8,
                    border: '1px solid #93c5fd'
                }}>
                    <p style={{ color: '#1e40af', margin: 0 }}>
                        ℹ️ Ce Chef de Ligne aura les mêmes droits que vous sur {villeNom}. 
                        Il pourra gérer tous les véhicules, chauffeurs et agents de la ville.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: 14,
                            background: loading ? '#ccc' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: 16
                        }}
                    >
                        {loading ? 'Création...' : 'Créer le Chef de Ligne'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/dashboard/super-chef')}
                        style={{
                            padding: 14,
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 16
                        }}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
}
