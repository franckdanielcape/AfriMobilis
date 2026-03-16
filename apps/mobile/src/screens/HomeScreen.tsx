import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

interface DashboardData {
    versementsAttendus: number;
    versementsPayes: number;
    pannesEnCours: number;
    notificationsNonLues: number;
}

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({
        versementsAttendus: 0,
        versementsPayes: 0,
        pannesEnCours: 0,
        notificationsNonLues: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            // TODO: Implémenter les vraies requêtes Supabase
            // Pour l'instant, données de démo
            setData({
                versementsAttendus: 50000,
                versementsPayes: 35000,
                pannesEnCours: 1,
                notificationsNonLues: 3,
            });
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const quickActions = [
        {
            icon: '💰',
            title: 'Mes Versements',
            subtitle: 'Voir l\'historique',
            onPress: () => navigation.navigate('Versements'),
        },
        {
            icon: '🔧',
            title: 'Déclarer Panne',
            subtitle: 'Signaler un problème',
            onPress: () => navigation.navigate('Pannes'),
        },
        {
            icon: '📋',
            title: 'Mes Documents',
            subtitle: 'Gérer les documents',
            onPress: () => {},
        },
        {
            icon: '⚠️',
            title: 'Sanctions',
            subtitle: 'Voir mes avertissements',
            onPress: () => {},
        },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header avec salutation */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bonjour,</Text>
                    <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.notificationBtn}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Text style={styles.notificationIcon}>🔔</Text>
                    {data.notificationsNonLues > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{data.notificationsNonLues}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Carte principale - Versement du jour */}
            <View style={styles.mainCard}>
                <Text style={styles.mainCardLabel}>Versement attendu ce mois</Text>
                <Text style={styles.mainCardAmount}>
                    {data.versementsAttendus.toLocaleString()} FCFA
                </Text>
                <View style={styles.mainCardProgress}>
                    <View 
                        style={[
                            styles.mainCardProgressFill,
                            { width: `${(data.versementsPayes / data.versementsAttendus) * 100}%` }
                        ]} 
                    />
                </View>
                <Text style={styles.mainCardSubtext}>
                    Payé: {data.versementsPayes.toLocaleString()} FCFA
                </Text>
            </View>

            {/* Statistiques */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, styles.statCardWarning]}>
                    <Text style={styles.statIcon}>🔧</Text>
                    <Text style={styles.statValue}>{data.pannesEnCours}</Text>
                    <Text style={styles.statLabel}>Panne(s) en cours</Text>
                </View>
                <View style={[styles.statCard, styles.statCardSuccess]}>
                    <Text style={styles.statIcon}>✅</Text>
                    <Text style={styles.statValue}>2</Text>
                    <Text style={styles.statLabel}>Versements à jour</Text>
                </View>
            </View>

            {/* Actions rapides */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.actionCard}
                        onPress={action.onPress}
                    >
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Alerte conformité */}
            <View style={styles.alertCard}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Visite technique à renouveler</Text>
                    <Text style={styles.alertText}>
                        Votre visite technique expire dans 15 jours. Pensez à la renouveler.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    notificationBtn: {
        position: 'relative',
        padding: 8,
    },
    notificationIcon: {
        fontSize: 24,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    mainCard: {
        margin: 20,
        padding: 24,
        backgroundColor: '#2563eb',
        borderRadius: 16,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    mainCardLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    mainCardAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    mainCardProgress: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        marginBottom: 8,
    },
    mainCardProgressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    mainCardSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statCardWarning: {
        backgroundColor: '#fef3c7',
    },
    statCardSuccess: {
        backgroundColor: '#d1fae5',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginHorizontal: 20,
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: '47%',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    alertCard: {
        flexDirection: 'row',
        margin: 20,
        marginTop: 0,
        padding: 16,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    alertIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    alertText: {
        fontSize: 12,
        color: '#a16207',
    },
});
