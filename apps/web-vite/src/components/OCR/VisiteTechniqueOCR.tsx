import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '../ui';
import type { OCRResult } from '../../types';

interface VisiteTechniqueOCRProps {
    onResult: (result: OCRResult) => void;
    onError?: (error: string) => void;
}

export default function VisiteTechniqueOCR({ onResult, onError }: VisiteTechniqueOCRProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);

    const extractDate = (text: string): string | undefined => {
        // Patterns pour les dates
        const patterns = [
            // Format: DD/MM/YYYY ou DD-MM-YYYY
            /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g,
            // Format: YYYY/MM/DD
            /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g,
        ];

        for (const pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            for (const match of matches) {
                let dateStr: string;
                if (match[3].length === 4) {
                    // DD/MM/YYYY
                    dateStr = `${match[3]}-${match[2]}-${match[1]}`;
                } else {
                    // YYYY/MM/DD
                    dateStr = `${match[1]}-${match[2]}-${match[3]}`;
                }

                const date = new Date(dateStr);
                const now = new Date();
                
                if (!isNaN(date.getTime()) && date > now) {
                    return dateStr;
                }
            }
        }
        return undefined;
    };

    const extractNumeroCarte = (text: string): string | undefined => {
        const patterns = [
            /VT[\s\-]?([A-Z0-9]{6,12})/i,
            /N°?\s*[:\-]?\s*([0-9]{6,12})/i,
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
            // Preview
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);

            // OCR
            const result = await Tesseract.recognize(
                file,
                'fra',
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

            const ocrResult: OCRResult = {
                dateExpiration: extractDate(texteComplet),
                numeroCarte: extractNumeroCarte(texteComplet),
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

    const reset = () => {
        setPreview(null);
        setProgress(0);
        const input = document.getElementById('ocr-upload') as HTMLInputElement;
        if (input) input.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isProcessing}
                    id="ocr-upload"
                    className="hidden"
                />
                <label
                    htmlFor="ocr-upload"
                    className={`
                        flex flex-col items-center justify-center
                        w-full h-48 border-2 border-dashed rounded-lg
                        cursor-pointer transition-colors
                        ${isProcessing 
                            ? 'border-sky-300 bg-sky-50' 
                            : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
                        }
                    `}
                >
                    {isProcessing ? (
                        <div className="text-center space-y-3">
                            <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-slate-600">Analyse en cours... {progress}%</p>
                            <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto">
                                <div
                                    className="h-full bg-sky-600 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-2">
                            <span className="text-4xl">📷</span>
                            <p className="text-slate-600">Cliquez pour prendre une photo</p>
                            <p className="text-sm text-slate-400">JPG, PNG</p>
                        </div>
                    )}
                </label>
            </div>

            {preview && !isProcessing && (
                <div className="space-y-3">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain bg-slate-100 rounded-lg"
                    />
                    <Button variant="secondary" onClick={reset} className="w-full">
                        🔄 Reprendre la photo
                    </Button>
                </div>
            )}
        </div>
    );
}
