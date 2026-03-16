'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';

export default function RegistreRecensementPage() {
    const router = useRouter();
    interface Profile {
        nom?: string;
        prenom?: string;
        phone?: string;
    }

    interface Syndicat {
        nom?: string;
    }

    interface Affectation {
        id?: string;
        profiles?: Profile;
    }

    interface Recensement {
        id: string;
        immatriculation?: string;
        marque?: string;
        modele?: string;
        annee?: number;
        couleur?: string;
        statut?: string;
        created_at?: string;
        profiles?: Profile;
        syndicats?: Syndicat;
        affectations?: Affectation[];
    }
    const [recensements, setRecensements] = useState<Recensement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchRecensements = async () => {
            // Un recensement complet relie: Véhicule -> Propriétaire & Affectation(Chauffeur)
            const { data, error } = await supabase
                .from('vehicules')
                .select(`
                    id, immatriculation, marque, modele, annee, couleur, statut, created_at,
                    profiles!vehicules_proprietaire_id_fkey (nom, prenom, phone),
                    syndicats (nom),
                    affectations (
                        id,
                        profiles!affectations_chauffeur_id_fkey (nom, prenom, phone)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erreur de récupération des recensements:", error);
            }
            if (data) {
                setRecensements(data);
            }
            setLoading(false);
        };
        fetchRecensements();
    }, []);

    const filteredRecensements = recensements.filter(r => {
        const searchStr = `${r.immatriculation} ${r.marque} ${r.profiles?.nom} ${r.profiles?.prenom} ${r.profiles?.phone} ${r.syndicats?.nom}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => router.push('/dashboard')} style={{ padding: '0.5rem', fontSize: '1.2rem' }}>
                        ←
                    </Button>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📋</span> Registre Global des Recensements
                        </h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                            Historique complet des taxis, propriétaires et chauffeurs rattachés.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/admin/recensement')}
                    style={{ background: '#10b981', color: 'white', borderColor: '#10b981', fontWeight: 600 }}
                >
                    + Nouveau Recensement Mobile
                </Button>
            </div>

            <div className="glass-panel" style={{ background: 'var(--surface-main)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher par Plaque, Nom, Téléphone, Syndicat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: '8px', border: '1px solid var(--border)',
                                background: 'var(--surface-light)', color: 'var(--text-main)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{filteredRecensements.length}</span> Taxis recensés
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>🔄</div>
                        Chargement du registre...
                    </div>
                ) : filteredRecensements.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--surface-light)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Aucun enregistrement trouvé</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Commencez par recenser les taxis sur le terrain.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--bg-main)' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-light)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem' }}>Taxi (Immat. & Modèle)</th>
                                    <th style={{ padding: '1rem' }}>Propriétaire</th>
                                    <th style={{ padding: '1rem' }}>Chauffeur(s) Actif(s)</th>
                                    <th style={{ padding: '1rem' }}>Syndicat</th>
                                    <th style={{ padding: '1rem' }}>Date d&apos;enregistrement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecensements.map((r, index) => {
                                    // Extracting chauffeurs from affectations
                                    const activeAffectations = r.affectations || [];
                                    const chauffeursTexts = activeAffectations.map((a: Affectation) =>
                                        a.profiles ? `${a.profiles.nom} ${a.profiles.prenom}` : 'Inconnu'
                                    );
                                    const chauffeursList = chauffeursTexts.length > 0 ? chauffeursTexts.join(', ') : <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Aucun chauffeur rattaché</span>;

                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: index % 2 === 0 ? 'var(--bg-main)' : 'var(--surface-light)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.1rem' }}>{r.immatriculation}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.marque} {r.modele} ({r.annee || 'N/A'})</div>
                                                <span style={{
                                                    display: 'inline-block', marginTop: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                                    background: r.statut === 'actif' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: r.statut === 'actif' ? '#10b981' : '#ef4444'
                                                }}>
                                                    {r.statut.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {r.profiles ? (
                                                    <>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.profiles.nom} {r.profiles.prenom}</div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {r.profiles.phone}</div>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Non défini</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                                    {chauffeursList}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {r.syndicats?.nom || <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Non affecté</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
