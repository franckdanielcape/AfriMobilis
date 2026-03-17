'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

function ChauffeursGlobauxContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    interface User {
        id: string;
        nom?: string;
        prenom?: string;
        email?: string;
        telephone?: string;
        role?: string;
        created_at?: string;
    }
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const _ville = searchParams.get('ville');
    const _pays = searchParams.get('pays');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users?role=chauffeur');
                const result = await response.json();
                
                if (result.success) {
                    setUsers(result.data);
                } else {
                    console.error('Erreur:', result.error);
                    setUsers([]);
                }
            } catch (error) {
                console.error('Erreur fetch chauffeurs:', error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        (user.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.prenom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem', fontSize: '1.2rem' }}>
                    ←
                </Button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '24px' }}>🚘</span>
                        Chauffeurs
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Gestion et vue d&apos;ensemble des chauffeurs de la plateforme</p>
                </div>
            </div>

            <div style={{ background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }} className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un chauffeur..."
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
                        <strong>{filteredUsers.length}</strong> chauffeur(s) trouvé(s)
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chargement des chauffeurs...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '1rem' }}>Nom & Prénom</th>
                                    <th style={{ padding: '1rem' }}>Email / Téléphone</th>
                                    <th style={{ padding: '1rem' }}>Rôle</th>
                                    <th style={{ padding: '1rem' }}>Date d&apos;inscription</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            {user.nom} {user.prenom}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            <div>{user.email || '—'}</div>
                                            <div style={{ fontSize: '0.85rem' }}>{user.telephone || '—'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                background: 'rgba(var(--primary-rgb), 0.1)',
                                                color: 'var(--primary)',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Aucun chauffeur trouvé.
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

export default function ChauffeursGlobauxPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>}>
            <ChauffeursGlobauxContent />
        </Suspense>
    );
}
