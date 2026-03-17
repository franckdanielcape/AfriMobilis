'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from '../admin.module.css';

export default function ExportDonneesPage() {
    const [exporting, setExporting] = useState(false);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    const tables = [
        { id: 'profiles', label: 'Utilisateurs', icon: '👥' },
        { id: 'vehicules', label: 'Véhicules', icon: '🚗' },
        { id: 'chauffeurs', label: 'Chauffeurs', icon: '👨‍✈️' },
        { id: 'proprietaires', label: 'Propriétaires', icon: '🔑' },
        { id: 'versements', label: 'Versements', icon: '💰' },
        { id: 'pannes', label: 'Pannes', icon: '🔧' },
        { id: 'sanctions', label: 'Sanctions', icon: '⚖️' },
        { id: 'controles', label: 'Contrôles', icon: '🔍' },
        { id: 'syndicats', label: 'Syndicats', icon: '🏛️' },
    ];

    const handleExportCSV = async () => {
        setExporting(true);
        
        for (const tableId of selectedTables) {
            const { data, error } = await supabase
                .from(tableId)
                .select('*')
                .limit(10000);
            
            if (error) {
                console.error(`Erreur export ${tableId}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                // Convertir en CSV
                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(';'),
                    ...data.map(row => headers.map(h => {
                        const val = row[h];
                        return typeof val === 'string' && val.includes(';') 
                            ? `"${val}"` 
                            : val;
                    }).join(';'))
                ].join('\n');

                // Télécharger
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${tableId}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
            }
        }
        
        setExporting(false);
    };

    const handleExportExcel = async () => {
        alert('Export Excel - Fonctionnalité à implémenter avec une librairie comme xlsx');
    };

    const toggleTable = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
    };

    const selectAll = () => {
        setSelectedTables(tables.map(t => t.id));
    };

    const selectNone = () => {
        setSelectedTables([]);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📤 Export des Données</h1>
                <p className={styles.subtitle}>
                    Exportez les données de la plateforme au format CSV ou Excel
                </p>
            </div>

            <div className={styles.section}>
                <h2>Sélectionner les tables à exporter</h2>
                
                <div className={styles.selectionActions}>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                        Tout sélectionner
                    </Button>
                    <Button variant="ghost" size="sm" onClick={selectNone}>
                        Tout désélectionner
                    </Button>
                </div>

                <div className={styles.tablesGrid}>
                    {tables.map((table) => (
                        <label
                            key={table.id}
                            className={`${styles.tableCard} ${selectedTables.includes(table.id) ? styles.selected : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedTables.includes(table.id)}
                                onChange={() => toggleTable(table.id)}
                            />
                            <span className={styles.tableIcon}>{table.icon}</span>
                            <span className={styles.tableLabel}>{table.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>Format d&apos;export</h2>
                <div className={styles.exportActions}>
                    <Button
                        onClick={handleExportCSV}
                        disabled={selectedTables.length === 0 || exporting}
                        variant="secondary"
                    >
                        📄 Export CSV
                    </Button>
                    <Button
                        onClick={handleExportExcel}
                        disabled={selectedTables.length === 0 || exporting}
                    >
                        📊 Export Excel
                    </Button>
                </div>
                
                {exporting && (
                    <p className={styles.exportingMessage}>
                        Export en cours... Veuillez patienter.
                    </p>
                )}
                
                {selectedTables.length > 0 && !exporting && (
                    <p className={styles.selectionInfo}>
                        {selectedTables.length} table(s) sélectionnée(s)
                    </p>
                )}
            </div>

            <div className={styles.infoSection}>
                <h3>ℹ️ Informations</h3>
                <ul>
                    <li>Les exports CSV utilisent le point-virgule (;) comme séparateur</li>
                    <li>Limite de 10 000 lignes par table</li>
                    <li>Les fichiers sont nommés automatiquement avec la date</li>
                </ul>
            </div>
        </div>
    );
}
