'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './notifications.module.css';

interface Notification {
    id: string;
    type: 'conformite' | 'versement' | 'sanction' | 'ticket' | 'panne' | 'controle' | 'system';
    niveau: 'info' | 'warning' | 'urgent';
    titre: string;
    message: string;
    lien?: string;
    reference_type?: string;
    reference_id?: string;
    lue: boolean;
    date_lecture?: string;
    date_creation: string;
}

interface NotificationStats {
    total: number;
    nonLues: number;
    info: number;
    warning: number;
    urgent: number;
}

export default function NotificationsPage(): JSX.Element {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotificationStats>({
        total: 0,
        nonLues: 0,
        info: 0,
        warning: 0,
        urgent: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'non_lues' | 'info' | 'warning' | 'urgent'>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const limit = 20;

    const fetchNotifications = useCallback(async (reset = false) => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const currentPage = reset ? 1 : page;
            let url = `/api/notifications?page=${currentPage}&limit=${limit}`;

            if (filter === 'non_lues') {
                url += '&lue=false';
            } else if (filter !== 'all') {
                // Pour les filtres par niveau, on récupère tout et on filtre côté client
                // Ou on pourrait ajouter un paramètre niveau à l'API
            }

            const response = await fetch(url, {
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                const data = await response.json();
                const newNotifications = data.notifications || [];

                if (reset) {
                    setNotifications(newNotifications);
                } else {
                    setNotifications(prev => [...prev, ...newNotifications]);
                }

                setHasMore(newNotifications.length === limit);
                setStats(prev => ({
                    ...prev,
                    total: data.total,
                    nonLues: data.nonLues,
                }));
            }
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    const fetchStats = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/notifications/compteur', {
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

    const markAsRead = async (notificationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/notifications/${notificationId}/lue`, {
                method: 'PATCH',
                headers: { 'x-user-id': session.user.id },
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId
                            ? { ...n, lue: true, date_lecture: new Date().toISOString() }
                            : n
                    )
                );
                fetchStats();
            }
        } catch (error) {
            console.error('Erreur marquage lu:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Marquer toutes les notifications non lues comme lues
            const nonLues = notifications.filter(n => !n.lue);
            await Promise.all(
                nonLues.map(n =>
                    fetch(`/api/notifications/${n.id}/lue`, {
                        method: 'PATCH',
                        headers: { 'x-user-id': session.user.id },
                    })
                )
            );

            setNotifications(prev =>
                prev.map(n => ({ ...n, lue: true }))
            );
            fetchStats();
        } catch (error) {
            console.error('Erreur marquage tout lu:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', session.user.id);

            if (!error) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                fetchStats();
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    useEffect(() => {
        fetchNotifications(true);
        fetchStats();
    }, [filter]);

    useEffect(() => {
        if (page > 1) {
            fetchNotifications();
        }
    }, [page]);

    // Formater la date relative
    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays === 1) return 'Hier';
        return `Il y a ${diffDays} jours`;
    };

    // Icône selon le type
    const getTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            conformite: '📋',
            versement: '💰',
            sanction: '⚠️',
            ticket: '🎫',
            panne: '🔧',
            controle: '👮',
            system: '🔔',
        };
        return icons[type] || '🔔';
    };

    // Label du type
    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            conformite: 'Conformité',
            versement: 'Versement',
            sanction: 'Sanction',
            ticket: 'Ticket',
            panne: 'Panne',
            controle: 'Contrôle',
            system: 'Système',
        };
        return labels[type] || type;
    };

    // Filtrer les notifications affichées
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'non_lues') return !n.lue;
        return n.niveau === filter;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🔔 Notifications</h1>
                    <p className={styles.subtitle}>
                        Gérez vos alertes et messages
                    </p>
                </div>
                {stats.nonLues > 0 && (
                    <Button
                        onClick={markAllAsRead}
                        variant="secondary"
                        className={styles.markAllBtn}
                    >
                        Tout marquer comme lu
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${stats.nonLues > 0 ? styles.statCardActive : ''}`}>
                    <span className={styles.statIcon}>🔔</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.nonLues}</span>
                        <span className={styles.statLabel}>Non lues</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>ℹ️</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.info}</span>
                        <span className={styles.statLabel}>Infos</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${stats.warning > 0 ? styles.statCardWarning : ''}`}>
                    <span className={styles.statIcon}>⚠️</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.warning}</span>
                        <span className={styles.statLabel}>Alertes</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${stats.urgent > 0 ? styles.statCardUrgent : ''}`}>
                    <span className={styles.statIcon}>🚨</span>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.urgent}</span>
                        <span className={styles.statLabel}>Urgentes</span>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Toutes
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'non_lues' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('non_lues')}
                >
                    Non lues {stats.nonLues > 0 && `(${stats.nonLues})`}
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'info' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('info')}
                >
                    Infos
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'warning' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('warning')}
                >
                    Alertes
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'urgent' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('urgent')}
                >
                    Urgentes
                </button>
            </div>

            {/* Liste des notifications */}
            <div className={styles.notificationsList}>
                {loading && notifications.length === 0 ? (
                    <div className={styles.loading}>Chargement...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🔔</span>
                        <h3>Aucune notification</h3>
                        <p>Vous n'avez pas de notifications {filter !== 'all' ? 'dans cette catégorie' : ''}.</p>
                    </div>
                ) : (
                    <>
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`${styles.notificationItem} ${!notification.lue ? styles.notificationUnread : ''} ${styles[`niveau${notification.niveau}`]}`}
                            >
                                <div className={styles.notificationIcon}>
                                    {getTypeIcon(notification.type)}
                                </div>

                                <div className={styles.notificationContent}>
                                    <div className={styles.notificationHeader}>
                                        <span className={styles.notificationType}>
                                            {getTypeLabel(notification.type)}
                                        </span>
                                        <span className={styles.notificationTime}>
                                            {formatRelativeTime(notification.date_creation)}
                                        </span>
                                    </div>

                                    <h3 className={styles.notificationTitle}>
                                        {!notification.lue && <span className={styles.unreadDot} />}
                                        {notification.titre}
                                    </h3>

                                    <p className={styles.notificationMessage}>
                                        {notification.message}
                                    </p>

                                    {notification.lien && (
                                        <Link
                                            href={notification.lien}
                                            className={styles.notificationLink}
                                            onClick={() => !notification.lue && markAsRead(notification.id)}
                                        >
                                            Voir les détails →
                                        </Link>
                                    )}
                                </div>

                                <div className={styles.notificationActions}>
                                    {!notification.lue && (
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => markAsRead(notification.id)}
                                            title="Marquer comme lue"
                                        >
                                            ✓ Lu
                                        </button>
                                    )}
                                    <button
                                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                        onClick={() => deleteNotification(notification.id)}
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}

                        {hasMore && (
                            <div className={styles.loadMore}>
                                <Button
                                    onClick={() => setPage(p => p + 1)}
                                    variant="secondary"
                                    disabled={loading}
                                >
                                    {loading ? 'Chargement...' : 'Charger plus'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
