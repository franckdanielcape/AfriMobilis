'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface UserAuth {
    id: string;
    email?: string;
}

interface UserProfile {
    id: string;
    role: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
}

export default function ProfilPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserAuth | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // Champs du profil
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');
    
    // Champs mot de passe
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            // Récupérer les infos auth
            setUser({ id: session.user.id, email: session.user.email });
            
            // Récupérer le profil
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profileData) {
                setProfile(profileData as UserProfile);
                setNom(profileData.nom || '');
                setPrenom(profileData.prenom || '');
                setTelephone(profileData.telephone || '');
            }
            
            setLoading(false);
        };
        
        loadUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    nom,
                    prenom,
                    telephone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);
            
            if (error) throw error;
            
            setMessage('✅ Profil mis à jour avec succès');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Impossible de mettre à jour le profil';
            setMessage('❌ Erreur: ' + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        
        // Validation
        if (newPassword !== confirmPassword) {
            setMessage('❌ Les mots de passe ne correspondent pas');
            return;
        }
        
        if (newPassword.length < 6) {
            setMessage('❌ Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        setSaving(true);
        
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            // Réinitialiser les champs
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
            
            setMessage('✅ Mot de passe modifié avec succès');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Impossible de modifier le mot de passe';
            setMessage('❌ Erreur: ' + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <p>Chargement du profil...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ marginBottom: 30 }}>👤 Mon Profil</h1>
            
            {message && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: 20,
                    background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                    color: message.startsWith('✅') ? '#166534' : '#dc2626',
                    borderRadius: 8,
                    border: `1px solid ${message.startsWith('✅') ? '#86efac' : '#fca5a5'}`
                }}>
                    {message}
                </div>
            )}
            
            {/* Informations du compte */}
            <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: 24
            }}>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>📧 Informations du compte</h2>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#64748b' }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#64748b'
                        }}
                    />
                    <small style={{ color: '#94a3b8' }}>L&apos;email ne peut pas être modifié</small>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#64748b' }}>
                        Rôle
                    </label>
                    <input
                        type="text"
                        value={profile?.role || 'Utilisateur'}
                        disabled
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#64748b',
                            textTransform: 'capitalize'
                        }}
                    />
                </div>
            </div>
            
            {/* Formulaire de profil */}
            <form onSubmit={handleUpdateProfile} style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: 24
            }}>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>📝 Informations personnelles</h2>
                
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#374151' }}>
                        Prénom
                    </label>
                    <input
                        type="text"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 16
                        }}
                    />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#374151' }}>
                        Nom
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 16
                        }}
                    />
                </div>
                
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#374151' }}>
                        Téléphone
                    </label>
                    <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="225XXXXXXXXXX"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            fontSize: 16
                        }}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        fontSize: 16
                    }}
                >
                    {saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
                </button>
            </form>
            
            {/* Section Mot de passe */}
            <div style={{
                background: 'white',
                padding: 24,
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>🔒 Sécurité</h2>
                
                {!showPasswordForm ? (
                    <button
                        onClick={() => setShowPasswordForm(true)}
                        style={{
                            padding: '10px 20px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 16
                        }}
                    >
                        🔑 Modifier mon mot de passe
                    </button>
                ) : (
                    <form onSubmit={handleUpdatePassword}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#374151' }}>
                                Nouveau mot de passe *
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 caractères"
                                required
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    fontSize: 16
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#374151' }}>
                                Confirmer le nouveau mot de passe *
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Répétez le mot de passe"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    fontSize: 16
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '10px 20px',
                                    background: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1,
                                    fontSize: 16
                                }}
                            >
                                {saving ? 'Modification...' : '✅ Confirmer'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setMessage('');
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 16
                                }}
                            >
                                ❌ Annuler
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
