import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';

interface Notification {
    id: string;
    titre: string;
    message: string;
    date: string;
    type: 'info' | 'warning' | 'success';
    lue: boolean;
}

export default function NotificationsScreen() {
    const notifications: Notification[] = [
        {
            id: '1',
            titre: 'Versement attendu',
            message: 'Votre versement de 25,000 FCFA est attendu pour le 15 mars.',
            date: '2026-03-10T10:30:00',
            type: 'warning',
            lue: false,
        },
        {
            id: '2',
            titre: 'Panne signalée',
            message: 'Votre déclaration de panne est en cours de traitement.',
            date: '2026-03-08T14:20:00',
            type: 'info',
            lue: true,
        },
        {
            id: '3',
            titre: 'Visite technique',
            message: 'Votre visite technique expire dans 15 jours. Pensez à la renouveler.',
            date: '2026-03-05T09:00:00',
            type: 'warning',
            lue: false,
        },
        {
            id: '4',
            titre: 'Versement reçu',
            message: 'Votre versement de février a été reçu. Merci !',
            date: '2026-02-15T16:45:00',
            type: 'success',
            lue: true,
        },
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'info': return '#3b82f6';
            case 'warning': return '#f59e0b';
            case 'success': return '#10b981';
            default: return '#64748b';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            default: return '📌';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'À l\'instant';
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR');
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity style={[styles.notificationCard, !item.lue && styles.notificationUnread]}>
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
                <Text style={styles.titre}>{item.titre}</Text>
                <Text style={styles.message}>{item.message}</Text>
            </View>
            {!item.lue && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    list: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    notificationUnread: {
        backgroundColor: '#f8fafc',
        borderColor: '#bfdbfe',
    },
    typeIndicator: {
        width: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 20,
    },
    date: {
        fontSize: 12,
        color: '#94a3b8',
    },
    titre: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563eb',
        margin: 16,
        alignSelf: 'center',
    },
});
