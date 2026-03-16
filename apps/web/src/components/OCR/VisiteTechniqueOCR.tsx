'use client';

import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui';
import styles from './ocr.module.css';

interface OCRResult {
    dateExpiration?: string;
    numeroCarte?: string;
    confiance: number;
    texteComplet: string;
}

interface VisiteTechniqueOCRProps {
    onResult: (result: OCRResult) => void;
    onError?: (error: string) => void;
}

export default function VisiteTechniqueOCR({ onResult, onError }: VisiteTechniqueOCRProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);

    const extractDate = (text: string): string | undefined => {
        // Patterns pour les dates (format français et international)
        const patterns = [
            // Format: DD/MM/YYYY ou DD-MM-YYYY
            /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g,
            // Format: YYYY/MM/DD
            /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g,
            // Format texte: 31 décembre 2024
            /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi,
        ];

        for (const pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                // Vérifier si c'est une date future plausible (expiration)
                let dateStr: string;
                if (match[0].toLowerCase().includes('janvier')) {
                    // Format texte
                    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                    const moisNum = mois.findIndex(m => match[2].toLowerCase().includes(m)) + 1;
                    dateStr = `${match[3]}-${moisNum.toString().padStart(2, '0')}-${match[1].padStart(2, '0')}`;
                } else if (match[3].length === 4) {
                    // DD/MM/YYYY
                    dateStr = `${match[3]}-${match[2]}-${match[1]}`;
                } else {
                    // YYYY/MM/DD
                    dateStr = `${match[1]}-${match[2]}-${match[3]}`;
                }

                const date = new Date(dateStr);
                const now = new Date();
                
                // Vérifier si c'est une date valide et future (probablement expiration)
                if (!isNaN(date.getTime()) && date > now) {
                    return dateStr;
                }
            }
        }
        return undefined;
    };

    const extractNumeroCarte = (text: string): string | undefined => {
        // Patterns pour numéro de carte visite technique
        const patterns = [
            // Format: VT suivi de chiffres
            /VT[\s\-]?([A-Z0-9]{6,12})/i,
            // Format: Numéro de contrôle
            /N°?\s*[:\-]?\s*([0-9]{6,12})/i,
            // Format: Référence
            /RÉF[ÉE]RENCE\s*[:\-]?\s*([A-Z0-9]{6,12})/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        return undefined;
    };

    const processImage = useCallback(async (file: File) => {
        setIsProcessing(true);
        setProgress(0);

        try {
            // Créer un preview
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);

            // OCR avec Tesseract
            const result = await Tesseract.recognize(
                file,
                'fra', // Français
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    },
                }
            );

            const texteComplet = result.data.text;
            const confiance = result.data.confidence;

            // Extraire les informations
            const dateExpiration = extractDate(texteComplet);
            const numeroCarte = extractNumeroCarte(texteComplet);

            const ocrResult: OCRResult = {
                dateExpiration,
                numeroCarte,
                confiance,
                texteComplet,
            };

            onResult(ocrResult);
        } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Erreur OCR');
        } finally {
            setIsProcessing(false);
        }
    }, [onResult, onError]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                processImage(file);
            } else {
                onError?.('Veuillez sélectionner une image');
            }
        }
    };

    return (
        <div className={styles.ocrContainer}>
            <div className={styles.uploadZone}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    id="ocr-upload"
                    className={styles.fileInput}
                />
                <label htmlFor="ocr-upload" className={styles.uploadLabel}>
                    {isProcessing ? (
                        <div className={styles.processing}>
                            <div className={styles.spinner} />
                            <p>Analyse en cours... {progress}%</p>
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.progressFill} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className={styles.uploadIcon}>📷</span>
                            <p>Cliquez pour prendre une photo ou sélectionner une image</p>
                            <span className={styles.hint}>Format supporté: JPG, PNG</span>
                        </>
                    )}
                </label>
            </div>

            {preview && !isProcessing && (
                <div className={styles.preview}>
                    <img src={preview} alt="Preview" className={styles.previewImage} />
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            setPreview(null);
                            const input = document.getElementById('ocr-upload') as HTMLInputElement;
                            if (input) input.value = '';
                        }}
                        className={styles.retakeBtn}
                    >
                        🔄 Reprendre
                    </Button>
                </div>
            )}
        </div>
    );
}
