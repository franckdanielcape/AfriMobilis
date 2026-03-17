'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input, Modal } from '@/components/ui';
import styles from './admin.module.css';

interface Ticket {
    id: string;
    type: string;
    description: string;
    statut: 'soumis' | 'en_cours' | 'resolu' | 'rejete';
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    lieu?: string;
    date_incident?: string;
    date_creation: string;
    passager_prenom?: string;
    passager_nom?: string;
    passager_email?: string;
    passager_telephone?: string;
    agent_prenom?: string;
    agent_nom?: string;
    nb_commentaires: number;
}

interface Commentaire {
    id: string;
    auteur_prenom?: string;
    auteur_nom?: string;
    auteur_role?: string;
    message: string;
    type: string;
    ancien_statut?: string;
    nouveau_statut?: string;
    date_creation: string;
}

interface Stats {
    total: number;
    soumis: number;
    en_cours: number;
    resolus: number;
    rejetés: number;
    urgents: number;
}

export default function AdminTicketsPage(): JSX.Element {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0, soumis: 0, en_cours: 0, resolus: 0, rejetés: 0, urgents: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'soumis' | 'en_cours' | 'resolu' | 'rejete' | 'urgent'>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
    const [newComment, setNewComment] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/tickets/stats', {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    }, []);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            let url = '/api/tickets/admin';
            if (filter !== 'all' && filter !== 'urgent') {
                url += `?statut=${filter}`;
            }

            const response = await fetch(url, {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.status === 403) {
                setIsAuthorized(false);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                let filteredTickets = data.tickets || [];
                
                // Filtre urgent manuel (priorité urgente + statut ouvert)
                if (filter === 'urgent') {
                    filteredTickets = filteredTickets.filter(
                        (t: Ticket) => t.priorite === 'urgente' && ['soumis', 'en_cours'].includes(t.statut)
                    );
                }
                
                setTickets(filteredTickets);
            }
        } catch (error) {
            console.error('Erreur récupération tickets:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, router]);

    const fetchCommentaires = async (ticketId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/tickets/${ticketId}/commentaires`, {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                setCommentaires(data.commentaires || []);
            }
        } catch (error) {
            console.error('Erreur commentaires:', error);
        }
    };

    const changeStatut = async (ticketId: string, nouveauStatut: string, notes?: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/tickets/admin', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id,
                },
                body: JSON.stringify({
                    ticket_id: ticketId,
                    statut: nouveauStatut,
                    notes,
                }),
            });

            if (response.ok) {
                fetchTickets();
                fetchStats();
                if (selectedTicket?.id === ticketId) {
                    fetchCommentaires(ticketId);
                    setSelectedTicket({ ...selectedTicket, statut: nouveauStatut as Ticket['statut'] });
                }
            }
        } catch (error) {
            console.error('Erreur changement statut:', error);
        }
    };

    const addComment = async () => {
        if (!selectedTicket || !newComment.trim()) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/tickets/${selectedTicket.id}/commentaires`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': session.user.id,
                },
                body: JSON.stringify({ message: newComment }),
            });

            if (response.ok) {
                setNewComment('');
                fetchCommentaires(selectedTicket.id);
                fetchTickets();
            }
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
        }
    };

    const openTicketModal = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setResolutionNotes('');
        await fetchCommentaires(ticket.id);
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchTickets();
        fetchStats();
    }, [fetchTickets, fetchStats]);

    if (!isAuthorized) {
        return (
            <div className={styles.container}>
                <div className={styles.unauthorized}>
                    <h2>⛔ Accès refusé</h2>
                    <p>Vous n&apos;avez pas les permissions pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    // Helpers
    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            reclamation: 'Réclamation',
            assistance: 'Assistance',
            objet_perdu: 'Objet perdu',
            objet_retrouve: 'Objet retrouvé',
        };
        return labels[type] || type;
    };

    const getStatutBadge = (statut: string): string => {
        const badges: Record<string, string> = {
            soumis: '📥 Soumis',
            en_cours: '🔧 En cours',
            resolu: '✅ Résolu',
            rejete: '❌ Rejeté',
        };
        return badges[statut] || statut;
    };

    const getPrioriteBadge = (priorite: string): string => {
        const badges: Record<string, string> = {
            basse: '⬇️ Basse',
            normale: '➡️ Normale',
            haute: '⬆️ Haute',
            urgente: '🔴 Urgente',
        };
        return badges[priorite] || priorite;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🎫 Gestion des Tickets</h1>
                    <p className={styles.subtitle}>
                        Traitement des réclamations et demandes des passagers
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardNew}`}>
                    <span className={styles.statValue}>{stats.soumis}</span>
                    <span className={styles.statLabel}>Nouveaux</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardProgress}`}>
                    <span className={styles.statValue}>{stats.en_cours}</span>
                    <span className={styles.statLabel}>En cours</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardResolved}`}>
                    <span className={styles.statValue}>{stats.resolus}</span>
                    <span className={styles.statLabel}>Résolus</span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardUrgent}`}>
                    <span className={styles.statValue}>{stats.urgents}</span>
                    <span className={styles.statLabel}>Urgents</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Tous ({stats.total})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'soumis' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('soumis')}
                >
                    📥 Nouveaux ({stats.soumis})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'en_cours' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('en_cours')}
                >
                    🔧 En cours ({stats.en_cours})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'urgent' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('urgent')}
                >
                    🔴 Urgents ({stats.urgents})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'resolu' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('resolu')}
                >
                    ✅ Résolus ({stats.resolus})
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'rejete' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('rejete')}
                >
                    ❌ Rejetés ({stats.rejetés})
                </button>
            </div>

            {/* Tickets Table */}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loading}>Chargement...</div>
                ) : tickets.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🎫</span>
                        <h3>Aucun ticket</h3>
                        <p>Il n&apos;y a pas de tickets dans cette catégorie.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Passager</th>
                                <th>Priorité</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map((ticket) => (
                                <tr key={ticket.id} className={styles[`row${ticket.statut}`]}>
                                    <td>{getTypeLabel(ticket.type)}</td>
                                    <td className={styles.descriptionCell}>
                                        {ticket.description}
                                        {ticket.nb_commentaires > 0 && (
                                            <span className={styles.commentBadge}>
                                                💬 {ticket.nb_commentaires}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {ticket.passager_prenom} {ticket.passager_nom}
                                        <br />
                                        <small>{ticket.passager_telephone}</small>
                                    </td>
                                    <td>{getPrioriteBadge(ticket.priorite)}</td>
                                    <td>{getStatutBadge(ticket.statut)}</td>
                                    <td>
                                        {new Date(ticket.date_creation).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className={styles.actions}>
                                        <Button
                                            onClick={() => openTicketModal(ticket)}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Voir
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Ticket Detail */}
            {isModalOpen && selectedTicket && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`Ticket #${selectedTicket.id.slice(0, 8)}`}
                    size="large"
                >
                    <div className={styles.modalContent}>
                        {/* Ticket Info */}
                        <div className={styles.ticketInfo}>
                            <div className={styles.infoGrid}>
                                <div>
                                    <label>Type</label>
                                    <span>{getTypeLabel(selectedTicket.type)}</span>
                                </div>
                                <div>
                                    <label>Priorité</label>
                                    <span>{getPrioriteBadge(selectedTicket.priorite)}</span>
                                </div>
                                <div>
                                    <label>Statut</label>
                                    <span>{getStatutBadge(selectedTicket.statut)}</span>
                                </div>
                                <div>
                                    <label>Date</label>
                                    <span>{new Date(selectedTicket.date_creation).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>

                            <div className={styles.infoSection}>
                                <label>Passager</label>
                                <p>{selectedTicket.passager_prenom} {selectedTicket.passager_nom}</p>
                                <p>{selectedTicket.passager_email}</p>
                                <p>{selectedTicket.passager_telephone}</p>
                            </div>

                            <div className={styles.infoSection}>
                                <label>Description</label>
                                <p className={styles.description}>{selectedTicket.description}</p>
                            </div>

                            {selectedTicket.lieu && (
                                <div className={styles.infoSection}>
                                    <label>Lieu</label>
                                    <p>{selectedTicket.lieu}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {selectedTicket.statut !== 'resolu' && selectedTicket.statut !== 'rejete' && (
                            <div className={styles.actionsSection}>
                                <h4>Actions</h4>
                                
                                {selectedTicket.statut === 'soumis' && (
                                    <Button
                                        onClick={() => changeStatut(selectedTicket.id, 'en_cours')}
                                        variant="primary"
                                    >
                                        🔧 Prendre en charge
                                    </Button>
                                )}

                                {selectedTicket.statut === 'en_cours' && (
                                    <>
                                        <div className={styles.resolutionSection}>
                                            <label>Notes de résolution</label>
                                            <textarea
                                                value={resolutionNotes}
                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                placeholder="Décrivez la résolution ou le motif du rejet..."
                                                rows={3}
                                            />
                                        </div>
                                        <div className={styles.actionButtons}>
                                            <Button
                                                onClick={() => {
                                                    changeStatut(selectedTicket.id, 'resolu', resolutionNotes);
                                                    setIsModalOpen(false);
                                                }}
                                                variant="success"
                                            >
                                                ✅ Marquer comme résolu
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    changeStatut(selectedTicket.id, 'rejete', resolutionNotes);
                                                    setIsModalOpen(false);
                                                }}
                                                variant="danger"
                                            >
                                                ❌ Rejeter le ticket
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Commentaires */}
                        <div className={styles.commentsSection}>
                            <h4>Historique</h4>
                            
                            <div className={styles.commentsList}>
                                {commentaires.length === 0 ? (
                                    <p className={styles.noComments}>Aucun commentaire</p>
                                ) : (
                                    commentaires.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className={`${styles.comment} ${styles[`comment${comment.type}`]}`}
                                        >
                                            <div className={styles.commentHeader}>
                                                <strong>
                                                    {comment.auteur_prenom} {comment.auteur_nom}
                                                </strong>
                                                <span className={styles.commentRole}>
                                                    {comment.auteur_role}
                                                </span>
                                                <span className={styles.commentDate}>
                                                    {new Date(comment.date_creation).toLocaleString('fr-FR')}
                                                </span>
                                            </div>
                                            
                                            {comment.type === 'changement_statut' && (
                                                <div className={styles.statusChange}>
                                                    {getStatutBadge(comment.ancien_statut || '')} → {getStatutBadge(comment.nouveau_statut || '')}
                                                </div>
                                            )}
                                            
                                            <p className={styles.commentMessage}>{comment.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment */}
                            {selectedTicket.statut !== 'resolu' && selectedTicket.statut !== 'rejete' && (
                                <div className={styles.addComment}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Ajouter un commentaire..."
                                        rows={2}
                                    />
                                    <Button
                                        onClick={addComment}
                                        disabled={!newComment.trim()}
                                        variant="secondary"
                                    >
                                        Envoyer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
