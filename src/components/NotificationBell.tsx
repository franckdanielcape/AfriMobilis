'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import styles from './NotificationBell.module.css';

interface NotificationCount {
    total: number;
    info: number;
    warning: number;
    urgent: number;
}

interface Notification {
    id: string;
    type: string;
    niveau: 'info' | 'warning' | 'urgent';
    titre: string;
    message: string;
    lien?: string;
    lue: boolean;
    date_creation: string;
}

export default function NotificationBell(): JSX.Element {
    const [count, setCount] = useState<NotificationCount>({
        total: 0,
        info: 0,
        warning: 0,
        urgent: 0,
    });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Récupérer le compteur
    const fetchCount = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/notifications/compteur', {
                headers: {
                    'x-user-id': session.user.id,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCount(data);
            }
        } catch (error) {
            console.error('Erreur comptage notifications:', error);
        }
    }, []);

    // Récupérer les dernières notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/notifications?limit=5&lue=false', {
                headers: {
                    'x-user-id': session.user.id,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Marquer comme lue
    const markAsRead = async (notificationId: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/notifications/${notificationId}/lue`, {
                method: 'PATCH',
                headers: {
                    'x-user-id': session.user.id,
                },
            });

            if (response.ok) {
                // Mettre à jour localement
                setNotifications(prev =>
                    prev.filter(n => n.id !== notificationId)
                );
                setCount(prev => ({
                    ...prev,
                    total: Math.max(0, prev.total - 1),
                }));
            }
        } catch (error) {
            console.error('Erreur marquage lu:', error);
        }
    };

    // Ouvrir/fermer le dropdown
    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    // Polling toutes les 30 secondes
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

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

    // Classe CSS selon le niveau
    const getNiveauClass = (niveau: string): string => {
        switch (niveau) {
            case 'urgent':
                return styles.urgent;
            case 'warning':
                return styles.warning;
            default:
                return styles.info;
        }
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.bellButton}
                onClick={toggleDropdown}
                aria-label={`${count.total} notifications non lues`}
            >
                <span className={styles.bellIcon}>🔔</span>
                {count.total > 0 && (
                    <span className={`${styles.badge} ${count.urgent > 0 ? styles.badgeUrgent : ''}`}>
                        {count.total > 99 ? '99+' : count.total}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                    <div className={styles.dropdown}>
                        <div className={styles.header}>
                            <h3>Notifications</h3>
                            {count.total > 0 && (
                                <span className={styles.countBadge}>
                                    {count.total} non lue{count.total > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        <div className={styles.list}>
                            {loading ? (
                                <div className={styles.loading}>Chargement...</div>
                            ) : notifications.length === 0 ? (
                                <div className={styles.empty}>
                                    <span className={styles.emptyIcon}>🔔</span>
                                    <p>Aucune notification</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`${styles.item} ${getNiveauClass(notification.niveau)}`}
                                    >
                                        <div className={styles.itemIcon}>
                                            {getTypeIcon(notification.type)}
                                        </div>
                                        <div className={styles.itemContent}>
                                            <p className={styles.itemTitle}>
                                                {notification.titre}
                                            </p>
                                            <p className={styles.itemMessage}>
                                                {notification.message}
                                            </p>
                                            <span className={styles.itemTime}>
                                                {formatRelativeTime(notification.date_creation)}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.markReadBtn}
                                            onClick={(e) => markAsRead(notification.id, e)}
                                            title="Marquer comme lue"
                                            aria-label="Marquer comme lue"
                                        >
                                            ✓
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.footer}>
                            <Link
                                href="/dashboard/notifications"
                                className={styles.viewAllLink}
                                onClick={() => setIsOpen(false)}
                            >
                                Voir toutes les notifications →
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
