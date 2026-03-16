'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';

interface Annonce {
    id: string;
    type_annonce: string;
    prix: number;
    description: string;
    statut: string;
    created_at: string;
    updated_at?: string;
    vehicules?: {
        marque?: string;
        modele?: string;
        annee?: number;
        immatriculation?: string;
    };
    profiles?: {
        prenom?: string;
        nom?: string;
    };
}

export default function PublicMarketplacePage() {
    const [annonces, setAnnonces] = useState<Annonce[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('tous'); // tous, vente, recherche
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAnnonces = async () => {
            // Attempt to fetch with relation first (might fail if RLS blocks public access to vehicules)
            const { data, error } = await supabase
                .from('vehicules_annonces')
                .select(`
                    id, type_annonce, prix, description, statut, created_at, updated_at
                `)
                .neq('statut', 'annulee')
                .order('created_at', { ascending: false });

            if (data && !error) {
                setAnnonces(data);
            } else {
                console.error("Error fetching annonces (Table might not exist yet):", error);
                // UI Fallback so the user can see the layout even if DB is not ready
                setAnnonces([
                    {
                        id: 'dummy-1', type_annonce: 'vente', prix: 2500000, description: 'Taxi propre, moteur impeccable, prêt pour la ligne Bassam-Abidjan', statut: 'ouverte', created_at: new Date().toISOString(),
                        vehicules: { marque: 'Toyota', modele: 'Corolla', annee: 2015, immatriculation: '1234 AB 01' }
                    },
                    {
                        id: 'dummy-2', type_annonce: 'recherche', prix: 3000000, description: 'Je cherche un taxi communale en bon état.', statut: 'ouverte', created_at: new Date(Date.now() - 86400000).toISOString()
                    }
                ]);
            }
            setLoading(false);
        };

        fetchAnnonces();
    }, []);

    const filteredAnnonces = annonces.filter(a => {
        const matchesType = filterType === 'tous' ? true : a.type_annonce === filterType;

        const searchRegex = new RegExp(searchTerm, 'i');
        const searchStr = `${a.description} ${a.vehicules?.marque} ${a.vehicules?.modele} ${a.vehicules?.immatriculation}`;
        const matchesSearch = searchRegex.test(searchStr);

        return matchesType && matchesSearch;
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(price);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '1rem 2rem', background: 'var(--surface-main)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', textDecoration: 'none' }}>
                    <span style={{ color: 'var(--primary-color)' }}>Afri</span>Mobilis
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/dashboard/marketplace" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Déposer une annonce
                    </Link>
                    <Link href="/dashboard" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 600 }}>
                        Mon Espace
                    </Link>
                </div>
            </header>

            <main className="container fade-in" style={{ padding: '3rem 1rem', flex: 1, maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Marketplace Véhicules</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
                        Achetez ou vendez des véhicules de transport en toute sécurité.
                        Nos transactions sont certifiées par des témoins et mises à jour instantanément dans le registre AfriMobilis.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher une marque, un modèle, un mot-clé..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'var(--surface-light)', borderRadius: '8px', padding: '0.25rem' }}>
                        {[
                            { id: 'tous', label: 'Toutes les annonces' },
                            { id: 'vente', label: 'Véhicules à Vendre' },
                            { id: 'recherche', label: 'Recherches d\'Achat' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilterType(f.id)}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontWeight: 600, transition: 'all 0.2s',
                                    background: filterType === f.id ? 'var(--surface-main)' : 'transparent',
                                    color: filterType === f.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                    boxShadow: filterType === f.id ? 'var(--shadow-sm)' : 'none'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>🔄</div>
                        Chargement des annonces...
                    </div>
                ) : filteredAnnonces.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface-light)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚘</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Aucun véhicule trouvé</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Soyez le premier à publier une annonce dans cette catégorie !</p>
                        <Link href="/dashboard/marketplace" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 2rem' }}>
                            Déposer une annonce
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                        {filteredAnnonces.map(annonce => (
                            <div key={annonce.id} className="glass-panel" style={{
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}>
                                <div style={{
                                    height: '180px',
                                    background: annonce.type_annonce === 'vente'
                                        ? 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.05) 100%)'
                                        : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{ fontSize: '5rem', opacity: 0.5 }}>
                                        {annonce.type_annonce === 'vente' ? '🚙' : '🕵️‍♂️'}
                                    </div>
                                    <div style={{
                                        position: 'absolute', top: '1rem', left: '1rem',
                                        background: 'var(--surface-main)', padding: '0.25rem 0.75rem',
                                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
                                        color: annonce.type_annonce === 'vente' ? 'var(--primary-color)' : '#f59e0b',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {annonce.type_annonce === 'vente' ? 'À VENDRE' : 'RECHERCHE'}
                                    </div>
                                    <div style={{
                                        position: 'absolute', top: '1rem', right: '1rem',
                                        background: annonce.statut === 'ouverte' ? 'rgba(16, 185, 129, 0.9)' :
                                            annonce.statut === 'en_cours' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(107, 114, 128, 0.9)',
                                        color: 'white', padding: '0.25rem 0.75rem',
                                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {annonce.statut === 'ouverte' ? 'Disponible' :
                                            annonce.statut === 'en_cours' ? 'Transaction en cours' :
                                                'Vendu'}
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>

                                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                                        {formatPrice(annonce.prix)}
                                    </div>

                                    {annonce.vehicules && (
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                                            {annonce.vehicules.marque} {annonce.vehicules.modele} ({annonce.vehicules.annee || 'N/A'})
                                        </h3>
                                    )}
                                    {!annonce.vehicules && (
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                            Recherche Véhicule
                                        </h3>
                                    )}

                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                                        {annonce.description || 'Aucune description fournie.'}
                                    </p>

                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <div>Posté le {new Date(annonce.created_at).toLocaleDateString()}</div>
                                            {annonce.profiles && (
                                                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>
                                                    Par {annonce.profiles.prenom} {annonce.profiles.nom}
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/dashboard/marketplace?contact=${annonce.id}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '8px' }}>
                                            {annonce.type_annonce === 'vente' ? 'Acheter' : 'Proposer'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
