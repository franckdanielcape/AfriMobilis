'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import Link from 'next/link';

interface ObjetPerdu {
    id: string;
    description: string;
    lieu?: string;
    statut: string;
    etat: string;
    vehicule_immatriculation?: string;
    created_at: string;
}

export default function PublicObjetsPage() {
    const [objets, setObjets] = useState<ObjetPerdu[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('tous'); // tous, perdus, trouves, resolus
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchObjets = async () => {
            const { data, error } = await supabase
                .from('objets')
                .select('*')
                .order('created_at', { ascending: false });

            if (data && !error) {
                setObjets(data);
            }
            setLoading(false);
        };

        fetchObjets();
    }, []);

    const filteredObjets = objets.filter(o => {
        const matchesType =
            filter === 'tous' ? true :
                filter === 'perdus' ? o.statut === 'perdu' && o.etat !== 'resolu' :
                    filter === 'trouves' ? o.statut === 'trouve' && o.etat !== 'resolu' :
                        filter === 'resolus' ? o.etat === 'resolu' : true;

        const searchRegex = new RegExp(searchTerm, 'i');
        const matchesSearch = searchRegex.test(o.description || '') || searchRegex.test(o.lieu || '') || searchRegex.test(o.vehicule_immatriculation || '');

        return matchesType && matchesSearch;
    });

    const getStatusStyle = (statut: string, etat: string) => {
        if (etat === 'resolu' || etat === 'restitue') return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: 'Restitué ✅' };
        if (statut === 'perdu') return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: 'Perdu 🔍' };
        if (statut === 'trouve') return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', label: 'Trouvé 🎁' };
        return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280', label: 'À vérifier' };
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '1rem 2rem', background: 'var(--surface-main)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', textDecoration: 'none' }}>
                    <span style={{ color: 'var(--primary-color)' }}>Afri</span>Mobilis
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/dashboard/objets" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        Déclarer un objet
                    </Link>
                    <Link href="/dashboard" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 600 }}>
                        Mon Espace
                    </Link>
                </div>
            </header>

            <main className="container fade-in" style={{ padding: '3rem 1rem', flex: 1, maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Objets Perdus & Trouvés</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Consultez les objets déclarés sur le réseau AfriMobilis. Un taxi de confiance.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Rechercher par description, lieu, ou immatriculation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '250px', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['tous', 'perdus', 'trouves', 'resolus'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s',
                                    background: filter === f ? 'var(--primary-color)' : 'transparent',
                                    color: filter === f ? 'white' : 'var(--text-secondary)',
                                    borderColor: filter === f ? 'var(--primary-color)' : 'var(--border)'
                                }}
                            >
                                {f === 'resolus' ? 'Restitués' : f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Chargement en cours...</div>
                ) : filteredObjets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-light)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Aucun résultat</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Aucun objet ne correspond à votre recherche actuelle.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {filteredObjets.map(objet => {
                            const style = getStatusStyle(objet.statut, objet.etat);
                            return (
                                <div key={objet.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <span style={{
                                            background: style.bg, color: style.text,
                                            padding: '0.25rem 0.75rem', borderRadius: '20px',
                                            fontSize: '0.85rem', fontWeight: 700
                                        }}>
                                            {style.label}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(objet.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.4 }}>{objet.description}</h3>
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span>📍</span> {objet.lieu || 'Lieu non précisé'}
                                        </div>
                                        {objet.vehicule_immatriculation && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>🚕</span> {objet.vehicule_immatriculation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
