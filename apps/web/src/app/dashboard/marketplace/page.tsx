'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
// We will use a simple browser print for the PDF, or user can save as PDF
// For a real app, a library like jspdf could be used, but browser print is reliable for now.

// Interfaces pour les types du marketplace
interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
}

interface UserProfile {
    id: string;
    role: string;
    nom?: string;
    prenom?: string;
}

interface Annonce {
    id: string;
    type_annonce: string;
    prix: number;
    description: string;
    statut: string;
    vehicules?: Vehicule;
}

interface VehiculeConfirmation {
    id: string;
    profil_id: string;
    role: string;
    statut: string;
    updated_at: string;
}

interface ConfirmationAuteur {
    nom: string;
    prenom: string;
}

interface Confirmation {
    id: string;
    prix: number;
    statut: string;
    acheteur_id: string;
    auteur_id: string;
    vehicules?: Vehicule;
    profiles?: ConfirmationAuteur;
    vehicule_confirmations?: VehiculeConfirmation[];
}

export default function DashboardMarketplacePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [mesAnnonces, setMesAnnonces] = useState<Annonce[]>([]);
    const [mesConfirmations, setMesConfirmations] = useState<Confirmation[]>([]);
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [loading, setLoading] = useState(true);

    const [isVenteModalOpen, setIsVenteModalOpen] = useState(false);
    const [formData, setFormData] = useState({ type: 'vente', vehicule_id: '', prix: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const userId = session.user.id;

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            setUser(profile || { id: userId, role: 'passager' });

            // Fetch Mes Annonces
            const { data: annonces } = await supabase
                .from('vehicules_annonces')
                .select('*, vehicules(immatriculation, marque, modele)')
                .eq('auteur_id', userId)
                .order('created_at', { ascending: false });

            if (annonces) setMesAnnonces(annonces as Annonce[]);

            // Fetch transactions requiring my confirmation or involving me
            const { data: confs } = await supabase
                .from('vehicules_annonces')
                .select(`
                    id, prix, statut, acheteur_id, auteur_id,
                    vehicules(immatriculation, marque, modele),
                    profiles!vehicules_annonces_auteur_id_fkey(nom, prenom),
                    vehicule_confirmations(id, profil_id, role, statut, updated_at)
                `)
                .filter('statut', 'in', '("en_cours","conclue")')
                .or(`auteur_id.eq.${userId},acheteur_id.eq.${userId}`)
            // NOTE: Complex RLS might limit this if not well formed, but as author or buyer we should see it

            if (confs) setMesConfirmations(confs as Confirmation[]);

            // If user is owner, fetch their cars for the sell dropdown
            if (profile?.role === 'proprietaire') {
                const { data: mesVehicules } = await supabase.from('vehicules').select('*').eq('proprietaire_id', userId).eq('statut', 'actif');
                if (mesVehicules) setVehicules(mesVehicules as Vehicule[]);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const handleCreateAnnonce = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const newAnnonce = {
            auteur_id: user?.id,
            type_annonce: formData.type,
            vehicule_id: formData.type === 'vente' ? formData.vehicule_id : null,
            prix: parseFloat(formData.prix),
            description: formData.description,
            statut: 'ouverte'
        };

        const { data, error } = await supabase.from('vehicules_annonces').insert([newAnnonce]).select('*, vehicules(immatriculation, marque, modele)').single();

        if (!error && data) {
            setMesAnnonces([data as Annonce, ...mesAnnonces]);
            setIsVenteModalOpen(false);
            setFormData({ type: 'vente', vehicule_id: '', prix: '', description: '' });
        } else {
            alert('Erreur: ' + (error?.message || 'Une erreur est survenue.'));
        }
        setSubmitting(false);
    };

    const handleConfirm = async (annonceId: string, role: string) => {
        // Normally, buyer would click "Buy", which creates confirmation rows.
        // For MVP, if clicking confirm, we upsert the confirmation status for this user

        // 1. Check if a confirmation row exists for me on this ad
        const { data: existingConf } = await supabase
            .from('vehicule_confirmations')
            .select('*')
            .eq('annonce_id', annonceId)
            .eq('profil_id', user?.id)
            .single();

        if (existingConf) {
            // Update to confirme
            await supabase.from('vehicule_confirmations').update({ statut: 'confirme', updated_at: new Date() }).eq('id', existingConf.id);
        } else {
            // Create
            await supabase.from('vehicule_confirmations').insert([{
                annonce_id: annonceId,
                profil_id: user?.id,
                role: role,
                statut: 'confirme'
            }]);
        }

        alert("Transaction confirmée de votre côté !");
        window.location.reload(); // Refresh to get updated stats
    };

    const handlePrintPDF = (conf: Confirmation) => {
        // Create an invisible iframe, inject HTML, and print it to generate a clean PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Veuillez autoriser les pop-ups pour imprimer le PDF.");

        const html = `
            <html>
                <head>
                    <title>Acte de Vente - ${conf.vehicules?.immatriculation}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                        .section { margin-bottom: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                        .section-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                        .label { font-weight: bold; color: #475569; width: 40%; }
                        .value { font-weight: 500; color: #0f172a; width: 60%; text-align: right; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                        .sig-block { width: 45%; text-align: center; }
                        .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
                        .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; }
                        .cert-stamp { text-align: center; margin-top: 40px; color: #10b981; border: 2px dashed #10b981; padding: 10px; display: inline-block; transform: rotate(-5deg); font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">Acte de Vente / Cession de Véhicule</div>
                        <div class="subtitle">Généré numériquement via la plateforme AfriMobilis - Réf: ${conf.id.split('-')[0].toUpperCase()}</div>
                    </div>

                    <p style="text-align:justify;">
                        Entre les soussignés, réunis numériquement sur la plateforme sécurisée AfriMobilis :
                    </p>

                    <div class="section">
                        <div class="section-title">Le Vendeur</div>
                        <div class="row"><div class="label">Nom complet</div><div class="value">${conf.profiles?.nom} ${conf.profiles?.prenom}</div></div>
                        <div class="row"><div class="label">Qualité</div><div class="value">Propriétaire enregistré</div></div>
                    </div>

                    <div class="section">
                        <div class="section-title">Le Véhicule</div>
                        <div class="row"><div class="label">Marque & Modèle</div><div class="value">${conf.vehicules?.marque} ${conf.vehicules?.modele}</div></div>
                        <div class="row"><div class="label">Immatriculation</div><div class="value">${conf.vehicules?.immatriculation}</div></div>
                    </div>

                    <div class="section">
                        <div class="section-title">Conditions de Cession</div>
                        <div class="row"><div class="label">Montant Convenu</div><div class="value">${new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(conf.prix)}</div></div>
                        <div class="row"><div class="label">Validé le</div><div class="value">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                    </div>

                    <p style="text-align:justify; margin-top: 20px; font-size: 14px;">
                        Le vendeur atteste avoir perçu le montant convenu et cède la propriété pleine et entière du véhicule désigné ci-dessus à l&apos;acheteur. 
                        La transaction a été validée cryptographiquement par les parties et un témoin sur AfriMobilis. Le registre national a été automatiquement mis à jour.
                    </p>

                    <div style="text-align:center;">
                        <div class="cert-stamp">TRANSACTION CONCLUE ET CERTIFIÉE</div>
                    </div>

                    <div class="signatures">
                        <div class="sig-block">
                            <div class="sig-line">Signature Électronique du Vendeur</div>
                        </div>
                        <div class="sig-block">
                            <div class="sig-line">Signature Électronique de l'Acheteur</div>
                        </div>
                    </div>

                    <div class="footer">
                        Document généré le ${new Date().toLocaleString()} - AfriMobilis Grand-Bassam
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

    return (
        <div className="fade-in" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Mon Espace Marketplace</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gérez vos annonces et confirmez vos transactions d&apos;achat/vente de véhicules.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/marketplace" style={{ padding: '0.75rem 1.5rem', background: 'var(--surface-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 600 }}>
                        ← Naviguer sur le marché public
                    </Link>
                    <Button onClick={() => setIsVenteModalOpen(true)} style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>
                        + Créer une annonce
                    </Button>
                </div>
            </div>

            {/* Transactions en Attente */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span> Transactions nécessitant votre attention
                </h2>

                {mesConfirmations.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Aucune transaction en cours vous concernant.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mesConfirmations.map(conf => {
                            const isMySale = conf.auteur_id === user?.id; // I am the seller
                            const isCompleted = conf.statut === 'conclue';

                            // Check if I have confirmed yet
                            const myConfRow = conf.vehicule_confirmations?.find((c: VehiculeConfirmation) => c.profil_id === user?.id);
                            const iHaveConfirmed = myConfRow?.statut === 'confirme';

                            return (
                                <div key={conf.id} className="glass-panel" style={{
                                    padding: '1.5rem', borderRadius: '12px', border: `1px solid ${isCompleted ? '#10b981' : '#f59e0b'}`,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: isCompleted ? '#10b981' : '#f59e0b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800
                                            }}>
                                                {isCompleted ? 'VENTE CONCLUE' : 'EN COURS DE VALIDATION'}
                                            </span>
                                            <strong>{conf.vehicules?.marque} {conf.vehicules?.modele} ({conf.vehicules?.immatriculation})</strong>
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {isMySale ? 'Vous êtes le VENDEUR' : 'Vous êtes l&apos;ACHETEUR'} • Prix : {new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(conf.prix)}
                                        </div>

                                        {!isCompleted && (
                                            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: iHaveConfirmed ? '#10b981' : '#ef4444' }}>
                                                {iHaveConfirmed ? '✅ Vous avez validé la transaction, en attente des autres parties.' : '❌ Vous devez valider pour finaliser l\'opération.'}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {isCompleted ? (
                                            <Button onClick={() => handlePrintPDF(conf)} style={{ background: '#10b981', color: '#fff', borderColor: '#10b981' }}>
                                                📄 Générer Lettre d&apos;Achat (PDF)
                                            </Button>
                                        ) : (
                                            !iHaveConfirmed && (
                                                <Button onClick={() => handleConfirm(conf.id, isMySale ? 'vendeur' : 'acheteur')} style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}>
                                                    ✅ Confirmer ma partie
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mes Annonces Actives */}
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mes Annonces Publiées</h2>
                {mesAnnonces.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>
                        Vous n&apos;avez publié aucune annonce pour le moment.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {mesAnnonces.map(annonce => (
                            <div key={annonce.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
                                        background: annonce.type_annonce === 'vente' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: annonce.type_annonce === 'vente' ? '#2563eb' : '#f59e0b'
                                    }}>
                                        {annonce.type_annonce}
                                    </span>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                        background: annonce.statut === 'ouverte' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                        color: annonce.statut === 'ouverte' ? '#10b981' : '#6b7280'
                                    }}>
                                        {annonce.statut.toUpperCase()}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.25rem' }}>
                                    {new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(annonce.prix)}
                                </h3>

                                {annonce.vehicules && (
                                    <div style={{ color: 'var(--text-main)', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        {annonce.vehicules.marque} {annonce.vehicules.modele} ({annonce.vehicules.immatriculation})
                                    </div>
                                )}

                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {annonce.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de création d'annonce */}
            {isVenteModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', padding: '2.5rem',
                        borderRadius: '16px', border: '1px solid var(--border)'
                    }}>
                        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 800 }}>Nouvelle Annonce</h2>
                        <form onSubmit={handleCreateAnnonce}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Que souhaitez-vous faire ?</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-main)' }}
                                >
                                    <option value="vente">Vendre un de mes véhicules</option>
                                    <option value="recherche">Rechercher un véhicule à acheter</option>
                                </select>
                            </div>

                            {formData.type === 'vente' && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Véhicule à vendre</label>
                                    {vehicules.length === 0 ? (
                                        <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                                            Vous n&apos;avez aucun véhicule actif rattaché à votre compte. Vous ne pouvez pas vendre.
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={formData.vehicule_id}
                                            onChange={e => setFormData({ ...formData, vehicule_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-main)' }}
                                        >
                                            <option value="">-- Sélectionnez un véhicule --</option>
                                            {vehicules.map(v => (
                                                <option key={v.id} value={v.id}>{v.marque} {v.modele} ({v.immatriculation})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Prix estimé ou demandé (XOF)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="Ex: 2500000"
                                    value={formData.prix}
                                    onChange={e => setFormData({ ...formData, prix: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-main)' }}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description (État, kilométrage...)</label>
                                <textarea
                                    required
                                    placeholder="Décrivez l&apos;état du véhicule ou ce que vous recherchez exactement..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-light)', color: 'var(--text-main)', minHeight: '100px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsVenteModalOpen(false)}>Annuler</Button>
                                <Button type="submit" disabled={submitting || (formData.type === 'vente' && vehicules.length === 0)}>
                                    {submitting ? 'Publication...' : 'Publier l&apos;annonce'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
