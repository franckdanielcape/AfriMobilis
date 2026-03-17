'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

interface GeoFilterProps {
    onFilterChange: (pays: string, ville: string) => void;
    initialPays?: string;
    initialVille?: string;
}

const PAYS_AFRIQUE = [
    "Afrique du Sud", "Algérie", "Angola", "Bénin", "Botswana", "Burkina Faso", "Burundi",
    "Cameroun", "Cap-Vert", "Comores", "Congo Brazzaville", "Côte d'Ivoire", "Djibouti",
    "Egypte", "Erythrée", "Eswatini", "Ethiopie", "Gabon", "Gambie", "Ghana",
    "Guinée Conakry", "Guinée équatoriale", "Guinée-Bissau", "Kenya", "La Réunion",
    "Lesotho", "Liberia", "Libye", "Madagascar", "Malawi", "Mali", "Maroc", "Maurice",
    "Mauritanie", "Mozambique", "Namibie", "Niger", "Nigeria", "Ouganda",
    "République centrafricaine", "République démocratique du Congo", "Rwanda",
    "Sao Tomé-et-Principe", "Sénégal", "Seychelles", "Sierra Leone", "Somalie",
    "Somaliland", "Soudan", "Soudan du Sud", "Tanzanie", "Tchad", "Togo", "Tunisie",
    "Zambie", "Zimbabwe"
];
import { VILLES_CI } from '@/lib/geo';

export default function GeoFilter({ onFilterChange, initialPays = '', initialVille = '' }: GeoFilterProps) {
    const [selectedPays, setSelectedPays] = useState(initialPays);
    const [selectedVille, setSelectedVille] = useState(initialVille);

    // Compute cities list directly based on the selected country
    const villesList = (!selectedPays || selectedPays === "Côte d'Ivoire")
        ? Array.from(new Set(VILLES_CI.map(s => s.nom))).filter(Boolean).sort()
        : [];

    const handlePaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedPays(val);
        // If they change the country, we reset the city
        setSelectedVille('');
        onFilterChange(val, '');
    };

    const handleVilleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedVille(val);
        onFilterChange(selectedPays, val);
    };

    const isVilleDisabled = !selectedPays || selectedPays !== "Côte d'Ivoire";

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            background: 'var(--panel-bg)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap'
        }} className="glass-panel">
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌍</span> Filtrer par zone :
            </span>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', fontSize: '1.1rem' }}>🏳️</span>
                <select
                    value={selectedPays}
                    onChange={handlePaysChange}
                    style={{
                        padding: '0.5rem 2rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        appearance: 'none',
                        minWidth: '200px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">Tous les pays</option>
                    {PAYS_AFRIQUE.map(p => (
                        <option key={p} value={p} style={{ color: '#000' }}>{p}</option>
                    ))}
                </select>
                <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</span>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', fontSize: '1.1rem' }}>📍</span>
                <select
                    value={selectedVille}
                    onChange={handleVilleChange}
                    disabled={isVilleDisabled}
                    style={{
                        padding: '0.5rem 2rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: isVilleDisabled ? 'rgba(0,0,0,0.05)' : 'transparent',
                        color: 'var(--text-primary)',
                        appearance: 'none',
                        minWidth: '200px',
                        cursor: isVilleDisabled ? 'not-allowed' : 'pointer',
                        opacity: isVilleDisabled ? 0.6 : 1
                    }}
                >
                    <option value="">Toutes les villes</option>
                    {villesList.map(v => (
                        <option key={v} value={v} style={{ color: '#000' }}>{v}</option>
                    ))}
                </select>
                <span style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</span>
            </div>

            {selectedPays && selectedPays !== "Côte d'Ivoire" && (
                <div style={{ color: '#f59e0b', fontSize: '0.9rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠️</span> Patientez, nous travaillons à la réalisation de celle-ci pour ce pays.
                </div>
            )}
        </div>
    );
}
