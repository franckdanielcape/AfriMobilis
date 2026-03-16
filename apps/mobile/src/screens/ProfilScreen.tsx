import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfilScreen() {
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: '👤', title: 'Mes informations', subtitle: 'Nom, téléphone, email' },
        { icon: '🚗', title: 'Mon véhicule', subtitle: 'Immatriculation, documents' },
        { icon: '📄', title: 'Mes documents', subtitle: 'Permis, pièces d\'identité' },
        { icon: '🔔', title: 'Notifications', subtitle: 'Paramètres des alertes' },
        { icon: '❓', title: 'Aide & Support', subtitle: 'FAQ, contact' },
    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header Profil */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
                <Text style={styles.role}>Chauffeur</Text>
                <Text style={styles.phone}>{user?.email}</Text>
            </View>

            {/* Menu */}
            <View style={styles.menu}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.menuItem}>
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Déconnexion */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={styles.version}>AfriMobilis v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    phone: {
        fontSize: 14,
        color: '#94a3b8',
    },
    menu: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    menuArrow: {
        fontSize: 24,
        color: '#94a3b8',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 8,
    },
    logoutIcon: {
        fontSize: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#dc2626',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 24,
    },
});
