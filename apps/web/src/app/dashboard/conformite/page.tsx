'use client';

import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import { VisiteTechniqueOCR, OCRResult } from '@/components/OCR';
import styles from './conformite.module.css';

interface Document {
    id: string;
    vehicule_id: string;
    type_document: string;
    numero_document?: string;
    date_expiration: string;
    statut: string;
    immatriculation?: string; // joined from vehicule
}

function getStatusStyle(expDate: string) {
    const today = new Date();
    const exp = new Date(expDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expiré', className: 'expire' };
    if (diffDays <= 7) return { label: 'Urgent (≤7j)', className: 'urgent' };
    if (diffDays <= 30) return { label: 'Bientôt expiré (≤30j)', className: 'bientot' };
    return { label: 'Valide', className: 'valide' };
}

interface VehiculeBasic {
    id: string;
    immatriculation: string;
}

export default function ConformitePage() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [vehicules, setVehicules] = useState<VehiculeBasic[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | expire | bientot | valide
    const [isAdding, setIsAdding] = useState(false);
    const [showOCR, setShowOCR] = useState(false);
    const [form, setForm] = useState({ vehicule_id: '', type_document: '', numero_document: '', date_expiration: '' });
    const [error, setError] = useState('');
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const { data: vehData } = await supabase.from('vehicules').select('id, immatriculation');
        setVehicules(vehData || []);

        const { data: docData } = await supabase
            .from('documents_conformite')
            .select('*')
            .order('date_expiration', { ascending: true });

        if (docData && vehData) {
            const enriched = docData.map(d => ({
                ...d,
                immatriculation: vehData.find(v => v.id === d.vehicule_id)?.immatriculation || '—'
            }));
            setDocs(enriched);
        }
        setLoading(false);
    };

    useLayoutEffect(() => {
        const frameId = requestAnimationFrame(() => {
            fetchData();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { error: err } = await supabase.from('documents_conformite').insert([form]);
        if (err) { setError(err.message); return; }
        setIsAdding(false);
        setForm({ vehicule_id: '', type_document: '', numero_document: '', date_expiration: '' });
        fetchData();
    };

    const filtered = docs.filter(d => {
        const status = getStatusStyle(d.date_expiration).className;
        if (filter === 'all') return true;
        return status === filter;
    });

    const counts = {
        expire: docs.filter(d => getStatusStyle(d.date_expiration).className === 'expire').length,
        urgent: docs.filter(d => getStatusStyle(d.date_expiration).className === 'urgent').length,
        bientot: docs.filter(d => getStatusStyle(d.date_expiration).className === 'bientot').length,
    };

    return (
        <div className="fade-in">
            <div className={styles.header}>
                <h2>Conformité Documentaire</h2>
                <Button onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Annuler' : '+ Ajouter Document'}</Button>
            </div>

            {/* Alert Summary */}
            <div className={styles.alertBanner}>
                {counts.expire > 0 && <div className={`${styles.alertPill} ${styles.expire}`}>🚨 {counts.expire} Expirés</div>}
                {counts.urgent > 0 && <div className={`${styles.alertPill} ${styles.urgent}`}>⚠️ {counts.urgent} Urgent (≤7j)</div>}
                {counts.bientot > 0 && <div className={`${styles.alertPill} ${styles.bientot}`}>🕒 {counts.bientot} Bientôt (≤30j)</div>}
            </div>

            {isAdding && (
                <div className={`${styles.addForm} glass-panel`}>
                    <h3>Nouveau document</h3>
                    
                    {/* Option OCR pour Visite Technique */}
                    <div className={styles.ocrSection}>
                        <div className={styles.ocrHeader}>
                            <span>📷</span>
                            <div>
                                <strong>Scan automatique (OCR)</strong>
                                <p>Pour les visites techniques, prenez une photo et nous extrairons automatiquement les informations</p>
                            </div>
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowOCR(!showOCR)}
                            >
                                {showOCR ? 'Masquer' : 'Utiliser OCR'}
                            </Button>
                        </div>
                        
                        {showOCR && (
                            <div className={styles.ocrContainer}>
                                <VisiteTechniqueOCR
                                    onResult={(result) => {
                                        setOcrResult(result);
                                        // Pré-remplir le formulaire
                                        if (result.dateExpiration) {
                                            setForm(prev => ({ 
                                                ...prev, 
                                                type_document: 'Visite Technique',
                                                numero_document: result.numeroCarte || prev.numero_document,
                                                date_expiration: result.dateExpiration
                                            }));
                                        }
                                    }}
                                    onError={(err) => setError(err)}
                                />
                                
                                {ocrResult && (
                                    <div className={styles.ocrResult}>
                                        <h4>Résultat de l&apos;analyse</h4>
                                        <div className={styles.resultField}>
                                            <label>Date d&apos;expiration détectée:</label>
                                            <strong>{ocrResult.dateExpiration ? new Date(ocrResult.dateExpiration).toLocaleDateString('fr-FR') : 'Non détectée'}</strong>
                                        </div>
                                        {ocrResult.numeroCarte && (
                                            <div className={styles.resultField}>
                                                <label>Numéro de carte:</label>
                                                <strong>{ocrResult.numeroCarte}</strong>
                                            </div>
                                        )}
                                        <div className={styles.confiance}>
                                            Confiance: {ocrResult.confiance.toFixed(1)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleAdd} className={styles.formGrid}>
                        <div>
                            <label className={styles.label}>Véhicule</label>
                            <select className={styles.select} value={form.vehicule_id} onChange={e => setForm({ ...form, vehicule_id: e.target.value })} required>
                                <option value="">-- Sélectionner --</option>
                                {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
                            </select>
                        </div>
                        <Input label="Type de Document" placeholder="ex: Assurance, Carte grise, Visite Technique…" value={form.type_document} onChange={e => setForm({ ...form, type_document: e.target.value })} required fullWidth />
                        <Input label="N° Document (optionnel)" placeholder="Numéro de référence" value={form.numero_document} onChange={e => setForm({ ...form, numero_document: e.target.value })} fullWidth />
                        <Input label="Date d&apos;expiration" type="date" value={form.date_expiration} onChange={e => setForm({ ...form, date_expiration: e.target.value })} required fullWidth />
                        <div className={styles.formActions}>
                            <Button type="submit">Enregistrer</Button>
                        </div>
                    </form>
                    {error && <p style={{ color: 'var(--error)', marginTop: 'var(--space-2)' }}>{error}</p>}
                </div>
            )}

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {['all', 'expire', 'urgent', 'bientot', 'valide'].map(f => (
                    <button key={f} className={`${styles.filterTab} ${filter === f ? styles.activeTab : ''}`} onClick={() => setFilter(f)}>
                        {f === 'all' ? 'Tous' : f === 'expire' ? 'Expirés' : f === 'urgent' ? 'Urgent' : f === 'bientot' ? 'Bientôt' : 'Valides'}
                    </button>
                ))}
            </div>

            <div className={`${styles.tableContainer} glass-panel`}>
                {loading ? (
                    <div className={styles.empty}>Chargement…</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>Aucun document trouvé pour ce filtre.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Véhicule</th>
                                <th>Type de document</th>
                                <th>N° Référence</th>
                                <th>Expiration</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(doc => {
                                const s = getStatusStyle(doc.date_expiration);
                                return (
                                    <tr key={doc.id}>
                                        <td style={{ fontWeight: 600 }}>{doc.immatriculation}</td>
                                        <td>{doc.type_document}</td>
                                        <td>{doc.numero_document || '—'}</td>
                                        <td>{new Date(doc.date_expiration).toLocaleDateString('fr-FR')}</td>
                                        <td><span className={`${styles.badge} ${styles[s.className]}`}>{s.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
