import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Versement {
    id: string;
    date: string;
    montant: number;
    statut: 'paye' | 'attente' | 'retard';
    mois: string;
}

export default function VersementsScreen() {
    const { user } = useAuth();
    const [versements, setVersements] = useState<Versement[]>([]);
    const [filter, setFilter] = useState<'tous' | 'paye' | 'attente' | 'retard'>('tous');

    useEffect(() => {
        // TODO: Charger les vrais versements depuis Supabase
        const demoData: Versement[] = [
            { id: '1', date: '2026-03-15', montant: 25000, statut: 'paye', mois: 'Mars 2026' },
            { id: '2', date: '2026-02-15', montant: 25000, statut: 'paye', mois: 'Février 2026' },
            { id: '3', date: '2026-01-15', montant: 25000, statut: 'retard', mois: 'Janvier 2026' },
            { id: '4', date: '2026-04-15', montant: 25000, statut: 'attente', mois: 'Avril 2026' },
        ];
        setVersements(demoData);
    }, []);

    const filteredVersements = versements.filter(v => 
        filter === 'tous' || v.statut === filter
    );

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'paye': return '#10b981';
            case 'attente': return '#f59e0b';
            case 'retard': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case 'paye': return 'Payé';
            case 'attente': return 'En attente';
            case 'retard': return 'En retard';
            default: return statut;
        }
    };

    const renderVersement = ({ item }: { item: Versement }) => (
        <View style={styles.versementCard}>
            <View style={styles.versementHeader}>
                <Text style={styles.versementMois}>{item.mois}</Text>
                <View style={[styles.statutBadge, { backgroundColor: `${getStatutColor(item.statut)}20` }]}>
                    <Text style={[styles.statutText, { color: getStatutColor(item.statut) }]}>
                        {getStatutLabel(item.statut)}
                    </Text>
                </View>
            </View>
            <View style={styles.versementDetails}>
                <Text style={styles.versementMontant}>
                    {item.montant.toLocaleString()} FCFA
                </Text>
                <Text style={styles.versementDate}>
                    Échéance: {new Date(item.date).toLocaleDateString('fr-FR')}
                </Text>
            </View>
        </View>
    );

    const totalPaye = versements
        .filter(v => v.statut === 'paye')
        .reduce((sum, v) => sum + v.montant, 0);

    const totalAttendu = versements
        .filter(v => v.statut === 'attente' || v.statut === 'retard')
        .reduce((sum, v) => sum + v.montant, 0);

    return (
        <View style={styles.container}>
            {/* Résumé */}
            <View style={styles.summary}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total payé</Text>
                    <Text style={styles.summaryValue}>{totalPaye.toLocaleString()} FCFA</Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardWarning]}>
                    <Text style={styles.summaryLabel}>En attente</Text>
                    <Text style={[styles.summaryValue, styles.summaryValueWarning]}>
                        {totalAttendu.toLocaleString()} FCFA
                    </Text>
                </View>
            </View>

            {/* Filtres */}
            <View style={styles.filterContainer}>
                {(['tous', 'paye', 'attente', 'retard'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'tous' ? 'Tous' : getStatutLabel(f)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Liste */}
            <FlatList
                data={filteredVersements}
                renderItem={renderVersement}
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
    summary: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    summaryCardWarning: {
        borderLeftColor: '#f59e0b',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10b981',
    },
    summaryValueWarning: {
        color: '#f59e0b',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
    },
    filterBtnActive: {
        backgroundColor: '#2563eb',
    },
    filterText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    versementCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    versementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    versementMois: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    statutBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statutText: {
        fontSize: 12,
        fontWeight: '600',
    },
    versementDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    versementMontant: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    versementDate: {
        fontSize: 12,
        color: '#64748b',
    },
});
