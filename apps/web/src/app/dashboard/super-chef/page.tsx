'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';

interface ChefDeLigne {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    is_super_chef: boolean;
    created_at: string;
}

interface Ville {
    id: string;
    nom: string;
    pays_nom: string;
}

export default function SuperChefDashboard() {
    const router = useRouter();
    interface UserProfile {
        id: string;
        role: string;
        ville_id: string;
        villes?: {
            id: string;
            nom: string;
            pays?: {
                nom: string;
            };
        };
    }
    const [user, setUser] = useState<UserProfile | null>(null);
    const [ville, setVille] = useState<Ville | null>(null);
    const [chefs, setChefs] = useState<ChefDeLigne[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalChefs: 0,
        totalVehicules: 0,
        totalChauffeurs: 0,
        totalProprietaires: 0
    });

    const fetchChefs = async (villeId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                nom,
                prenom,
                email,
                telephone,
                role,
                created_at
            `)
            .in('role', ['super_chef_de_ligne', 'chef_de_ligne'])
            .eq('ville_id', villeId);

        if (data) {
            interface ChefRow {
                id: string;
                nom: string;
                prenom: string;
                email: string;
                telephone: string;
                role: string;
                created_at: string;
            }
            const chefsFormatted = data.map((chef: ChefRow) => ({
                ...chef,
                is_super_chef: chef.role === 'super_chef_de_ligne'
            }));
            setChefs(chefsFormatted);
        }
    };

    const fetchStats = async (villeId: string) => {
        const [
            { count: chefsCount },
            { count: vehiculesCount },
            { count: chauffeursCount },
            { count: proprietairesCount }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .in('role', ['chef_de_ligne', 'super_chef_de_ligne']).eq('ville_id', villeId),
            supabase.from('vehicules').select('*', { count: 'exact', head: true })
                .eq('ville_id', villeId),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .eq('role', 'chauffeur').eq('ville_id', villeId),
            supabase.from('profiles').select('*', { count: 'exact', head: true })
                .eq('role', 'proprietaire').eq('ville_id', villeId)
        ]);

        setStats({
            totalChefs: chefsCount || 0,
            totalVehicules: vehiculesCount || 0,
            totalChauffeurs: chauffeursCount || 0,
            totalProprietaires: proprietairesCount || 0
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            // Récupérer le profil avec la ville
            const { data: profile } = await supabase
                .from('profiles')
                .select('*, villes(id, nom, pays: pays_id(nom))')
                .eq('id', session.user.id)
                .single();

            if (!profile || profile.role !== 'super_chef_de_ligne') {
                router.push('/dashboard');
                return;
            }

            setUser(profile);
            setVille({
                id: profile.ville_id,
                nom: profile.villes?.nom || 'Ville inconnue',
                pays_nom: profile.villes?.pays?.nom || 'Pays inconnu'
            });

            // Charger les chefs de ligne de sa ville
            await fetchChefs(profile.ville_id);
            await fetchStats(profile.ville_id);
            
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleDeleteChef = async (chefId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce Chef de Ligne ?')) {
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', chefId)
            .eq('role', 'chef_de_ligne'); // Sécurité : ne peut supprimer que des chefs_de_ligne

        if (!error && ville) {
            fetchChefs(ville.id);
        }
    };

    if (loading) {
        return <div style={{ padding: 40 }}>Chargement...</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, marginBottom: 8 }}>
                    👑 Super Chef de Ligne
                </h1>
                <p style={{ color: '#64748b', fontSize: 16 }}>
                    {ville?.nom}, {ville?.pays_nom}
                </p>
            </div>

            {/* Stats */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 20,
                marginBottom: 32
            }}>
                <StatCard icon="👥" label="Chefs de Ligne" value={stats.totalChefs} />
                <StatCard icon="🚗" label="Véhicules" value={stats.totalVehicules} />
                <StatCard icon="👨‍✈️" label="Chauffeurs" value={stats.totalChauffeurs} />
                <StatCard icon="👤" label="Propriétaires" value={stats.totalProprietaires} />
            </div>

            {/* Actions */}
            <div style={{ marginBottom: 24 }}>
                <Link href="/dashboard/super-chef/chefs-ligne/nouveau">
                    <button style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 16
                    }}>
                        + Ajouter un Chef de Ligne
                    </button>
                </Link>
            </div>

            {/* Liste des Chefs de Ligne */}
            <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginBottom: 20 }}>Équipe de gestion - {ville?.nom}</h2>
                
                {chefs.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Aucun Chef de Ligne.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Nom</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Rôle</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Contact</th>
                                <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chefs.map((chef) => (
                                <tr key={chef.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px' }}>
                                        {chef.prenom} {chef.nom}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {chef.is_super_chef ? (
                                            <span style={{ 
                                                background: '#dbeafe', 
                                                color: '#1e40af',
                                                padding: '4px 12px',
                                                borderRadius: 12,
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}>
                                                Super Chef
                                            </span>
                                        ) : (
                                            <span style={{ 
                                                background: '#dcfce7', 
                                                color: '#166534',
                                                padding: '4px 12px',
                                                borderRadius: 12,
                                                fontSize: 12
                                            }}>
                                                Chef de Ligne
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {chef.telephone || chef.email}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {!chef.is_super_chef && (
                                            <button
                                                onClick={() => handleDeleteChef(chef.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 4,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info */}
            <div style={{ 
                marginTop: 24,
                padding: 16,
                background: '#fef3c7',
                borderRadius: 8,
                border: '1px solid #fcd34d'
            }}>
                <p style={{ color: '#92400e', margin: 0 }}>
                    ℹ️ <strong>Information :</strong> Tous les Chefs de Ligne (y compris vous) 
                    gèrent la même ville. La seule différence : vous pouvez créer et supprimer 
                    des membres de l&apos;équipe.
                </p>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
    return (
        <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1e293b' }}>
                {value.toLocaleString('fr-FR')}
            </div>
            <div style={{ color: '#64748b' }}>{label}</div>
        </div>
    );
}
