'use client';

import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from '../admin.module.css';

interface TypeDocument {
    id: string;
    nom: string;
    description: string;
    duree_validite_mois: number;
    obligatoire: boolean;
}

export default function ParametrageConformitePage() {
    const [typesDocuments, setTypesDocuments] = useState<TypeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({
        nom: '',
        description: '',
        duree_validite_mois: 12,
        obligatoire: true
    });

    const fetchTypesDocuments = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('types_documents')
            .select('*')
            .order('nom');
        setTypesDocuments(data || []);
        setLoading(false);
    };

    useLayoutEffect(() => {
        const frameId = requestAnimationFrame(() => {
            fetchTypesDocuments();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        await supabase.from('types_documents').insert([form]);
        setIsAdding(false);
        setForm({ nom: '', description: '', duree_validite_mois: 12, obligatoire: true });
        fetchTypesDocuments();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer ce type de document ?')) {
            await supabase.from('types_documents').delete().eq('id', id);
            fetchTypesDocuments();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📋 Paramétrage Conformité</h1>
                <p className={styles.subtitle}>
                    Gestion des types de documents et durées de validité
                </p>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Types de Documents</h2>
                    <Button onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Annuler' : '➕ Ajouter un type'}
                    </Button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAdd} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Nom du document</label>
                            <input
                                type="text"
                                value={form.nom}
                                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Durée de validité (mois)</label>
                                <input
                                    type="number"
                                    value={form.duree_validite_mois}
                                    onChange={(e) => setForm({ ...form, duree_validite_mois: parseInt(e.target.value) })}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Obligatoire</label>
                                <input
                                    type="checkbox"
                                    checked={form.obligatoire}
                                    onChange={(e) => setForm({ ...form, obligatoire: e.target.checked })}
                                />
                            </div>
                        </div>
                        <Button type="submit">Enregistrer</Button>
                    </form>
                )}

                {loading ? (
                    <p>Chargement...</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Description</th>
                                <th>Validité</th>
                                <th>Obligatoire</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {typesDocuments.map((doc) => (
                                <tr key={doc.id}>
                                    <td><strong>{doc.nom}</strong></td>
                                    <td>{doc.description}</td>
                                    <td>{doc.duree_validite_mois} mois</td>
                                    <td>{doc.obligatoire ? '✅ Oui' : '❌ Non'}</td>
                                    <td>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                                            🗑️ Supprimer
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {typesDocuments.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Aucun type de document configuré
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
