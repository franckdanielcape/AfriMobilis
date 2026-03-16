'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function RecensementPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    interface CurrentUser {
        id: string;
        email?: string;
        nom?: string;
        prenom?: string;
        phone?: string;
    }
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [immat, setImmat] = useState('');

    // Récupérer l'utilisateur connecté
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email,
                    nom: profile.nom || '',
                    prenom: profile.prenom || '',
                    phone: profile.telephone || ''
                });
            }
        };

        fetchUser();
    }, []);

    const useMe = () => {
        if (currentUser) {
            setNom(currentUser.nom || '');
            setPrenom(currentUser.prenom || '');
            setPhone(currentUser.phone || '');
            setMsg('✅ Propriétaire sélectionné (vous)');
        } else {
            setMsg('❌ Impossible de récupérer vos informations');
        }
    };

    const save = async () => {
        if (!immat || !phone) {
            setMsg('❌ Champs obligatoires manquants');
            return;
        }
        setLoading(true);
        setMsg('');

        try {
            // 1. Chercher proprio existant
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', phone)
                .single();

            let proprioId = existing?.id;

            // 2. Créer nouveau proprio
            if (!proprioId) {
                const email = `${phone}@afrimobilis.local`;
                const password = Math.random().toString(36).slice(-8);
                
                const { data: authData, error: authErr } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nom: nom || 'Nom',
                            prenom: prenom || 'Prénom',
                            phone: phone,
                            role: 'proprietaire'
                        }
                    }
                });
                
                if (authErr && !authErr.message.includes('already registered')) {
                    throw new Error(authErr.message);
                }
                
                proprioId = authData?.user?.id;
                
                if (!proprioId && authErr?.message.includes('already registered')) {
                    const { data: found } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('phone', phone)
                        .single();
                    proprioId = found?.id;
                }
            }

            if (!proprioId) throw new Error('ID propriétaire manquant');

            // 3. Créer véhicule
            const { error: vehErr } = await supabase
                .from('vehicules')
                .insert({
                    proprietaire_id: proprioId,
                    immatriculation: immat.toUpperCase(),
                    statut: 'actif'
                });

            if (vehErr) throw vehErr;

            setMsg('✅ Véhicule recensé avec succès !');
            setNom(''); setPrenom(''); setPhone(''); setImmat('');
            setStep(1);

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Erreur';
            setMsg('❌ ' + (e.message || 'Erreur'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>
            <h1>Recensement</h1>
            
            {msg && (
                <div style={{ 
                    padding: 15, 
                    marginBottom: 15, 
                    background: msg.includes('✅') ? '#10b981' : '#ef4444',
                    color: 'white',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    {msg}
                </div>
            )}

            {step === 1 && (
                <div>
                    <button onClick={useMe} style={{
                        width: '100%', padding: 15, marginBottom: 20,
                        background: '#10b981', color: 'white',
                        border: 'none', borderRadius: 8, cursor: 'pointer'
                    }}>
                        👤 C&apos;est mon véhicule
                    </button>

                    <input placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)}
                        style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                    <input placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)}
                        style={{ width: '100%', padding: 10, marginBottom: 10 }} />
                    <input placeholder="Téléphone *" value={phone} onChange={e => setPhone(e.target.value)}
                        style={{ width: '100%', padding: 10, marginBottom: 20 }} />

                    <button onClick={() => phone && setStep(2)}
                        style={{
                            width: '100%', padding: 15,
                            background: phone ? '#0ea5e9' : '#ccc',
                            color: 'white', border: 'none', borderRadius: 8
                        }}>
                        Suivant →
                    </button>
                </div>
            )}

            {step === 2 && (
                <div>
                    <input placeholder="Immatriculation *" value={immat} 
                        onChange={e => setImmat(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: 10, marginBottom: 20 }} />

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setStep(1)}
                            style={{ flex: 1, padding: 15, background: '#ccc', border: 'none', borderRadius: 8 }}>
                            ← Retour
                        </button>
                        <button onClick={save} disabled={loading || !immat}
                            style={{ 
                                flex: 2, padding: 15, 
                                background: loading ? '#ccc' : '#10b981',
                                color: 'white', border: 'none', borderRadius: 8
                            }}>
                            {loading ? '...' : '✅ Valider'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
