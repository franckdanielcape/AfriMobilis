'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import NotificationBell from '@/components/NotificationBell';
import './dashboard-fixes.css';

const SUPER_ADMIN_NAV = [
    { label: '📊 Dashboard', href: '/dashboard' },
    { label: '🏛️ Villes & Syndicats', href: '/dashboard/admin/villes' },
    { label: '👥 Super Chefs de Ligne', href: '/dashboard/admin/super-chefs' },
    { label: '⚙️ Configuration', href: '/dashboard/admin/config' },
];

const SUPER_CHEF_NAV = [
    { label: '📊 Dashboard', href: '/dashboard/super-chef' },
    { label: '👥 Chefs de Ligne', href: '/dashboard/super-chef/chefs-ligne' },
    { label: '👮 Contrôles', href: '/dashboard/controles' },
    { label: '⚠️ Sanctions', href: '/dashboard/sanctions' },
    { label: '🎫 Tickets', href: '/dashboard/tickets/admin' },
    { label: '🔍 Objets Perdus', href: '/dashboard/objets/admin' },
    { label: '🚗 Véhicules', href: '/dashboard/vehicules' },
    { label: '👨‍✈️ Chauffeurs', href: '/dashboard/chauffeurs' },
    { label: '💰 Versements', href: '/dashboard/versements' },
    { label: '📋 Conformité', href: '/dashboard/conformite' },
];

const PROPRIETAIRE_NAV = [
    { label: '📊 Dashboard', href: '/dashboard/proprietaire' },
    { label: '💰 Rentabilité', href: '/dashboard/proprietaire/rentabilite' },
    { label: '🚗 Mes Véhicules', href: '/dashboard/proprietaire/vehicules' },
    { label: '👨‍✈️ Mes Chauffeurs', href: '/dashboard/proprietaire/chauffeurs' },
    { label: '💳 Versements', href: '/dashboard/proprietaire/versements' },
    { label: '🔧 Pannes', href: '/dashboard/proprietaire/pannes' },
];

const CHAUFFEUR_NAV = [
    { label: '📊 Accueil', href: '/dashboard/chauffeur' },
    { label: '💰 Mes Versements', href: '/dashboard/versements' },
    { label: '🔧 Déclarer Panne', href: '/dashboard/pannes' },
    { label: '⚠️ Mes Sanctions', href: '/dashboard/chauffeur/sanctions' },
];

const PASSAGER_NAV = [
    { label: '📊 Dashboard', href: '/dashboard' },
    { label: '🎫 Mes Tickets', href: '/dashboard/tickets' },
    { label: '🔍 Objets Perdus', href: '/objets' },
];

const CHEF_LIGNE_NAV = [
    { label: '📊 Tableau de Bord', href: '/dashboard/chef-ligne' },
    { label: '👮 Agents Terrain', href: '/dashboard/chef-ligne?tab=agents' },
    { label: '👮 Contrôles', href: '/dashboard/controles' },
    { label: '⚠️ Sanctions', href: '/dashboard/sanctions' },
    { label: '🎫 Tickets', href: '/dashboard/tickets/admin' },
    { label: '🔍 Objets Perdus', href: '/dashboard/objets/admin' },
    { label: '👨‍✈️ Chauffeurs', href: '/dashboard/chauffeurs' },
    { label: '🚗 Véhicules', href: '/dashboard/vehicules' },
    { label: '💰 Versements', href: '/dashboard/versements' },
    { label: '📋 Conformité', href: '/dashboard/conformite' },
];

interface User {
    id: string;
    email?: string;
    role: string;
    prenom: string;
    nom?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // Récupérer le profil complet
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role: profile?.role || session.user.user_metadata?.role || 'passager',
                    prenom: profile?.prenom || session.user.user_metadata?.prenom || 'Utilisateur',
                    nom: profile?.nom || session.user.user_metadata?.nom || ''
                });
            } else {
                // Pas de session active, rediriger vers login
                router.push('/login');
                return;
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    // Close sidebar when route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (sidebarOpen && !target.closest('aside') && !target.closest('.mobile-menu-btn')) {
                setSidebarOpen(false);
            }
        };

        if (sidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarOpen]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push('/login');
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Chargement...</div>;

    const getNavItems = () => {
        switch (user?.role) {
            case 'super_admin':
                return SUPER_ADMIN_NAV;
            case 'super_chef_de_ligne':
                return SUPER_CHEF_NAV;
            case 'proprietaire':
                return PROPRIETAIRE_NAV;
            case 'chauffeur':
                return CHAUFFEUR_NAV;
            case 'passager':
                return PASSAGER_NAV;
            case 'chef_ligne':
            case 'admin_syndicat':
                return CHEF_LIGNE_NAV;
            default:
                return CHEF_LIGNE_NAV;
        }
    };

    const navItems = getNavItems();

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={sidebarOpen}
                style={{
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 1001,
                    display: 'none',
                    background: '#1e293b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '44px',
                    height: '44px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                }}
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999,
                    display: 'none',
                }}
            />

            {/* Sidebar */}
            <aside
                className={sidebarOpen ? 'open' : ''}
                style={{
                    width: 250,
                    background: '#1e293b',
                    color: 'white',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    height: '100vh',
                    zIndex: 1000,
                    overflowY: 'auto',
                }}
            >
                <h2 style={{ marginBottom: 20, marginTop: 0 }}>AfriMobilis</h2>
                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'block',
                                padding: '10px',
                                color: pathname === item.href ? '#38bdf8' : 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                marginBottom: '4px',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                if (pathname !== item.href) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                
                {/* Section Utilisateur */}
                <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #334155' }}>
                    <Link 
                        href="/dashboard/profil"
                        style={{
                            display: 'block',
                            padding: '10px',
                            color: pathname === '/dashboard/profil' ? '#38bdf8' : 'white',
                            textDecoration: 'none',
                            marginBottom: 10,
                            borderRadius: '6px',
                        }}
                    >
                        👤 {user?.prenom} {user?.nom}
                    </Link>
                    <p style={{ fontSize: 12, color: '#94a3b8', padding: '0 10px', marginBottom: 10 }}>
                        {user?.email}
                    </p>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minHeight: '44px',
                        }}
                    >
                        🚪 Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content - wrappé avec dashboard-container pour scoper les styles */}
            <main
                className="dashboard-container"
                style={{
                    flex: 1,
                    padding: 20,
                    marginLeft: 250,
                    minHeight: '100vh',
                }}
            >
                {/* Header with notification bell */}
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginBottom: 24,
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <NotificationBell />
                </header>
                {children}
            </main>

            {/* Responsive styles */}
            <style jsx>{`
                @media (max-width: 767px) {
                    .mobile-menu-btn {
                        display: flex !important;
                    }
                    .sidebar-overlay {
                        display: block !important;
                    }
                    aside {
                        transform: translateX(-100%);
                        transition: transform 0.3s ease;
                    }
                    aside.open {
                        transform: translateX(0);
                    }
                    main {
                        margin-left: 0 !important;
                        padding-top: 80px !important;
                    }
                }
                @media (min-width: 768px) and (max-width: 1023px) {
                    aside {
                        width: 220px;
                    }
                    main {
                        margin-left: 220px !important;
                    }
                }
                @media (min-width: 1024px) {
                    aside {
                        position: fixed;
                    }
                    main {
                        margin-left: 250px !important;
                    }
                }
            `}</style>
        </div>
    );
}
