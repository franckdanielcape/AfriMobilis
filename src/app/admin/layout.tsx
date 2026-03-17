'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    interface UserProfile {
        id: string;
        nom?: string;
        prenom?: string;
        email?: string;
        role?: string;
    }
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile?.role !== 'super_admin') {
                // Pour l'instant, si c'est pas admin on le renvoie, bien que l'admin syndicat puisse avoir son dashboard. 
                // L'idéal est de rediriger au bon endroit plus tard
                setLoading(false);
                router.push('/dashboard');
                return;
            }

            setUser(profile);
            setLoading(false);
        };

        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>;
    }

    const navItems = [
        { label: 'Tableau de bord', href: '/admin', icon: '📊' },
        { label: 'Syndicats', href: '/admin/syndicats', icon: '🏢' },
        { label: 'Utilisateurs', href: '/admin/users', icon: '👥' },
        { label: 'Conformité & Règles', href: '/admin/settings', icon: '⚙️' },
    ];

    return (
        <div className={styles.adminLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoHighlight}>Afri</span>Mobilis
                    </Link>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Super Administration</div>
                </div>

                <nav className={styles.navMenu}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.activeNavItem : ''}`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.userInfo}>
                    <Link href="/" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 'var(--space-3)' }}>← Accueil</Link>
                    <div className={styles.userName}>{user?.prenom} {user?.nom}</div>
                    <div className={styles.userRole}>Super Administrateur</div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} style={{ marginTop: '0.5rem', padding: 0, color: 'var(--error)' }}>
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.topbar}>
                    <div className={styles.topbarTitle}>
                        {navItems.find(i => i.href === pathname)?.label || 'Administration'}
                    </div>
                    <div className={styles.topbarActions}>
                        <Button variant="secondary" size="sm">🔔 Alertes</Button>
                    </div>
                </header>

                <div className={styles.pageContainer}>
                    {children}
                </div>
            </main>
        </div>
    );
}
