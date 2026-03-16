'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';

export default function DashboardOverviewPage() {
    const router = useRouter();
    interface UserData {
        id: string;
        email?: string;
        role: string;
        prenom: string;
        nom: string;
    }
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalVehicules: 0,
        totalChauffeurs: 0,
        totalProprietaires: 0,
        totalVersements: 0
    });

    const fetchStats = async () => {
        try {
            const [
                { count: vehiculesCount },
                { count: chauffeursCount },
                { count: proprietairesCount }
            ] = await Promise.all([
                supabase.from('vehicules').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'chauffeur'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'proprietaire')
            ]);

            setStats({
                totalVehicules: vehiculesCount || 0,
                totalChauffeurs: chauffeursCount || 0,
                totalProprietaires: proprietairesCount || 0,
                totalVersements: 0
            });
        } catch {
            // Stats non chargées - les valeurs restent à 0
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            // Récupérer le profil complet depuis la base
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            let userData;
            if (profile) {
                userData = {
                    id: session.user.id,
                    email: session.user.email,
                    role: profile.role,
                    prenom: profile.prenom,
                    nom: profile.nom
                };
            } else {
                userData = {
                    id: session.user.id,
                    email: session.user.email,
                    role: session.user.user_metadata?.role || 'passager',
                    prenom: session.user.user_metadata?.prenom || 'Utilisateur',
                    nom: session.user.user_metadata?.nom || ''
                };
            }
            
            setUser(userData);
            
            // Récupérer les stats globales
            await fetchStats();
            
            setLoading(false);
            
            // Redirection selon le rôle pour les non-super-admin
            if (userData.role === 'chef_ligne' || userData.role === 'admin_syndicat') {
                router.push('/dashboard/chef-ligne');
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: 18
            }}>
                Chargement du tableau de bord...
            </div>
        );
    }

    const isSuperAdmin = user?.role === 'super_admin';
    const isAdminSyndicat = user?.role === 'admin_syndicat' || user?.role === 'chef_ligne';

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, marginBottom: 8 }}>
                    👋 Bonjour, {user?.prenom} {user?.nom} !
                </h1>
                <p style={{ color: '#64748b', fontSize: 16 }}>
                    Rôle: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {user?.role?.replace('_', ' ')}
                    </span>
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: 20,
                marginBottom: 32
            }}>
                <StatCard 
                    icon="🚗" 
                    label="Véhicules enregistrés" 
                    value={stats.totalVehicules}
                    href="/dashboard/vehicules"
                />
                <StatCard 
                    icon="👨‍✈️" 
                    label="Chauffeurs" 
                    value={stats.totalChauffeurs}
                    href="/dashboard/chauffeurs"
                />
                <StatCard 
                    icon="👤" 
                    label="Propriétaires" 
                    value={stats.totalProprietaires}
                    href="/dashboard/admin/utilisateurs"
                />
                <StatCard 
                    icon="💰" 
                    label="Versements ce mois" 
                    value={stats.totalVersements}
                    suffix=" FCFA"
                    href="/dashboard/versements"
                />
            </div>

            {/* Actions Rapides */}
            <div style={{ 
                background: 'white', 
                padding: 24, 
                borderRadius: 12, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: 24
            }}>
                <h2 style={{ marginBottom: 20, fontSize: 20 }}>⚡ Actions rapides</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {isSuperAdmin && (
                        <>
                            <ActionButton href="/dashboard/admin/syndicats" icon="🏛️">
                                Gérer les syndicats
                            </ActionButton>
                            <ActionButton href="/dashboard/admin/utilisateurs" icon="👥">
                                Gérer les utilisateurs
                            </ActionButton>
                            <ActionButton href="/dashboard/admin/recensement" icon="📝">
                                Recenser un véhicule
                            </ActionButton>
                        </>
                    )}
                    {isAdminSyndicat && (
                        <>
                            <ActionButton href="/dashboard/chef-ligne" icon="📊">
                                Tableau de bord syndicat
                            </ActionButton>
                            <ActionButton href="/dashboard/vehicules" icon="🚗">
                                Voir les véhicules
                            </ActionButton>
                        </>
                    )}
                    <ActionButton href="/dashboard/profil" icon="👤">
                        Mon profil
                    </ActionButton>
                </div>
            </div>

            {/* Info Section */}
            <div style={{ 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                padding: 24, 
                borderRadius: 12,
                border: '1px solid #93c5fd'
            }}>
                <h3 style={{ marginBottom: 12, color: '#1e40af' }}>📢 Information</h3>
                <p style={{ color: '#1e40af', lineHeight: 1.6 }}>
                    Bienvenue sur <strong>AfriMobilis</strong>, la plateforme de gestion centralisée 
                    pour les taxis de Grand-Bassam. Utilisez le menu latéral pour accéder à toutes 
                    les fonctionnalités selon votre rôle.
                </p>
            </div>
        </div>
    );
}

// Composant StatCard
function StatCard({ 
    icon, 
    label, 
    value, 
    suffix = '',
    href 
}: { 
    icon: string; 
    label: string; 
    value: number; 
    suffix?: string;
    href: string;
}) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
            >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>
                    {value.toLocaleString('fr-FR')}{suffix}
                </div>
                <div style={{ color: '#64748b', fontSize: 14 }}>{label}</div>
            </div>
        </Link>
    );
}

// Composant ActionButton
function ActionButton({ 
    href, 
    icon, 
    children 
}: { 
    href: string; 
    icon: string; 
    children: React.ReactNode;
}) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <button style={{
                padding: '12px 20px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
            }}
            >
                <span>{icon}</span>
                {children}
            </button>
        </Link>
    );
}
