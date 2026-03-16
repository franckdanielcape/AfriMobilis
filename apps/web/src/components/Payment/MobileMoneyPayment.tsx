'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import styles from './payment.module.css';

export type MobileMoneyProvider = 'orange_money' | 'mtn_money' | 'wave' | 'moov_money';

export type PaymentType = 'acompte' | 'total';

interface MobileMoneyPaymentProps {
    montantTotal: number;
    vehiculeId: string;
    vehiculeInfo: {
        immatriculation: string;
        marque: string;
        modele: string;
    };
    syndicatPhone: string; // Numéro de versement du syndicat
    onSuccess: (reference: string) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}

interface PaymentFormData {
    provider: MobileMoneyProvider;
    type: PaymentType;
    montant: number;
    phoneNumber: string;
}

const PROVIDERS = [
    { id: 'orange_money' as MobileMoneyProvider, name: 'Orange Money', color: '#ff6600', icon: '🍊' },
    { id: 'mtn_money' as MobileMoneyProvider, name: 'MTN Money', color: '#ffcc00', icon: '🟡' },
    { id: 'moov_money' as MobileMoneyProvider, name: 'Moov Money', color: '#0066cc', icon: '🔵' },
    { id: 'wave' as MobileMoneyProvider, name: 'Wave', color: '#00d4aa', icon: '💚' },
];

export default function MobileMoneyPayment({
    montantTotal,
    vehiculeId,
    vehiculeInfo,
    syndicatPhone,
    onSuccess,
    onError,
    onCancel,
}: MobileMoneyPaymentProps) {
    const [step, setStep] = useState<'amount' | 'provider' | 'confirm' | 'processing' | 'success'>('amount');
    const [formData, setFormData] = useState<PaymentFormData>({
        provider: 'orange_money',
        type: 'total',
        montant: montantTotal,
        phoneNumber: '',
    });
    const [reference, setReference] = useState('');
    const [error, setError] = useState('');

    const handleAmountSubmit = () => {
        if (formData.montant <= 0 || formData.montant > montantTotal) {
            setError(`Le montant doit être entre 1 et ${montantTotal.toLocaleString()} FCFA`);
            return;
        }
        setError('');
        setStep('provider');
    };

    const handleProviderSubmit = () => {
        if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
            setError('Veuillez entrer un numéro de téléphone valide');
            return;
        }
        setError('');
        setStep('confirm');
    };

    const processPayment = async () => {
        setStep('processing');
        setError('');

        try {
            // Simuler l'appel API vers le backend
            // En production, cela appellerait l'API de paiement
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Générer une référence unique
            const ref = `VT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            setReference(ref);

            // TODO: Enregistrer le paiement dans la base de données
            // await supabase.from('paiements_visites').insert([{
            //     vehicule_id: vehiculeId,
            //     montant: formData.montant,
            //     type_paiement: formData.type,
            //     moyen_paiement: formData.provider,
            //     reference_transaction: ref,
            //     telephone_paiement: formData.phoneNumber,
            //     statut: 'en_attente_confirmation',
            // }]);

            setStep('success');
            onSuccess(ref);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur de paiement';
            setError(msg);
            onError?.(msg);
            setStep('confirm');
        }
    };

    const getProviderById = (id: MobileMoneyProvider) => PROVIDERS.find(p => p.id === id);

    // Étape 1: Choix du montant
    if (step === 'amount') {
        return (
            <div className={styles.paymentContainer}>
                <h3 className={styles.title}>💳 Paiement Visite Technique</h3>
                
                <div className={styles.vehiculeInfo}>
                    <p><strong>{vehiculeInfo.marque} {vehiculeInfo.modele}</strong></p>
                    <p className={styles.immatriculation}>{vehiculeInfo.immatriculation}</p>
                </div>

                <div className={styles.montantTotal}>
                    <span>Montant total dû:</span>
                    <strong>{montantTotal.toLocaleString()} FCFA</strong>
                </div>

                <div className={styles.typeSelection}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="paymentType"
                            checked={formData.type === 'total'}
                            onChange={() => setFormData({ ...formData, type: 'total', montant: montantTotal })}
                        />
                        <span className={styles.radioText}>
                            <strong>Paiement total</strong>
                            <small>{montantTotal.toLocaleString()} FCFA</small>
                        </span>
                    </label>

                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="paymentType"
                            checked={formData.type === 'acompte'}
                            onChange={() => setFormData({ ...formData, type: 'acompte', montant: Math.round(montantTotal * 0.5) })}
                        />
                        <span className={styles.radioText}>
                            <strong>Acompte (50%)</strong>
                            <small>{Math.round(montantTotal * 0.5).toLocaleString()} FCFA</small>
                        </span>
                    </label>
                </div>

                {formData.type === 'acompte' && (
                    <div className={styles.customAmount}>
                        <Input
                            label="Montant de l'acompte"
                            type="number"
                            value={formData.montant}
                            onChange={(e) => setFormData({ ...formData, montant: parseInt(e.target.value) || 0 })}
                            suffix="FCFA"
                        />
                        <p className={styles.hint}>Minimum recommandé: {Math.round(montantTotal * 0.3).toLocaleString()} FCFA</p>
                    </div>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button onClick={handleAmountSubmit}>
                        Continuer →
                    </Button>
                </div>
            </div>
        );
    }

    // Étape 2: Choix du provider
    if (step === 'provider') {
        const selectedProvider = getProviderById(formData.provider);

        return (
            <div className={styles.paymentContainer}>
                <h3 className={styles.title}>📱 Choisissez votre opérateur</h3>

                <div className={styles.montantRecap}>
                    <span>Montant à payer:</span>
                    <strong>{formData.montant.toLocaleString()} FCFA</strong>
                </div>

                <div className={styles.providersGrid}>
                    {PROVIDERS.map((provider) => (
                        <button
                            key={provider.id}
                            className={`${styles.providerCard} ${formData.provider === provider.id ? styles.providerSelected : ''}`}
                            onClick={() => setFormData({ ...formData, provider: provider.id })}
                            style={{ '--provider-color': provider.color } as React.CSSProperties}
                        >
                            <span className={styles.providerIcon}>{provider.icon}</span>
                            <span className={styles.providerName}>{provider.name}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.phoneInput}>
                    <Input
                        label={`Numéro ${selectedProvider?.name}`}
                        type="tel"
                        placeholder="07 XX XX XX XX"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => setStep('amount')}>
                        ← Retour
                    </Button>
                    <Button onClick={handleProviderSubmit}>
                        Continuer →
                    </Button>
                </div>
            </div>
        );
    }

    // Étape 3: Confirmation
    if (step === 'confirm') {
        const provider = getProviderById(formData.provider);

        return (
            <div className={styles.paymentContainer}>
                <h3 className={styles.title}>✅ Confirmation</h3>

                <div className={styles.recapCard}>
                    <div className={styles.recapRow}>
                        <span>Véhicule:</span>
                        <strong>{vehiculeInfo.immatriculation}</strong>
                    </div>
                    <div className={styles.recapRow}>
                        <span>Montant:</span>
                        <strong>{formData.montant.toLocaleString()} FCFA</strong>
                    </div>
                    <div className={styles.recapRow}>
                        <span>Type:</span>
                        <strong>{formData.type === 'acompte' ? 'Acompte' : 'Paiement total'}</strong>
                    </div>
                    <div className={styles.recapRow}>
                        <span>Opérateur:</span>
                        <strong>{provider?.icon} {provider?.name}</strong>
                    </div>
                    <div className={styles.recapRow}>
                        <span>Numéro:</span>
                        <strong>{formData.phoneNumber}</strong>
                    </div>
                </div>

                <div className={styles.syndicatInfo}>
                    <p>Le paiement sera effectué vers:</p>
                    <strong>{syndicatPhone}</strong>
                    <small>Compte officiel du syndicat</small>
                </div>

                <div className={styles.notice}>
                    <p>📌 Vous allez recevoir une notification sur votre téléphone pour confirmer le paiement.</p>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => setStep('provider')}>
                        ← Retour
                    </Button>
                    <Button onClick={processPayment} variant="primary">
                        Confirmer le paiement
                    </Button>
                </div>
            </div>
        );
    }

    // Étape 4: Traitement
    if (step === 'processing') {
        return (
            <div className={styles.paymentContainer}>
                <div className={styles.processing}>
                    <div className={styles.spinner} />
                    <h3>Traitement en cours...</h3>
                    <p>Veuillez confirmer la transaction sur votre téléphone</p>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: '60%' }} />
                    </div>
                </div>
            </div>
        );
    }

    // Étape 5: Succès
    if (step === 'success') {
        return (
            <div className={styles.paymentContainer}>
                <div className={styles.success}>
                    <div className={styles.successIcon}>✅</div>
                    <h3>Paiement initié avec succès !</h3>
                    <p>Votre paiement est en cours de traitement.</p>

                    <div className={styles.referenceBox}>
                        <span>Référence de transaction:</span>
                        <strong>{reference}</strong>
                    </div>

                    <div className={styles.nextSteps}>
                        <p>Prochaines étapes:</p>
                        <ol>
                            <li>Confirmez la transaction sur votre téléphone</li>
                            <li>Upload la photo de votre carte de visite technique</li>
                            <li>Attendez la validation du syndicat</li>
                        </ol>
                    </div>

                    <Button onClick={() => onSuccess(reference)} variant="primary">
                        Continuer
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
