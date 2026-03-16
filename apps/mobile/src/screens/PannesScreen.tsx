import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

interface Panne {
    id: string;
    type: string;
    description: string;
    date: string;
    statut: 'signalee' | 'en_cours' | 'resolue';
    photos?: string[];
}

export default function PannesScreen() {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [type, setType] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [pannes, setPannes] = useState<Panne[]>([
        {
            id: '1',
            type: 'Moteur',
            description: 'Bruit anormal au démarrage',
            date: '2026-03-10',
            statut: 'en_cours',
        },
    ]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Accès à la caméra nécessaire');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const handleSubmit = async () => {
        if (!type || !description) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        // TODO: Envoyer à Supabase
        const nouvellePanne: Panne = {
            id: Date.now().toString(),
            type,
            description,
            date: new Date().toISOString().split('T')[0],
            statut: 'signalee',
            photos,
        };

        setPannes([nouvellePanne, ...pannes]);
        setShowForm(false);
        setType('');
        setDescription('');
        setPhotos([]);
        Alert.alert('Succès', 'Panne déclarée avec succès');
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'signalee': return '#f59e0b';
            case 'en_cours': return '#3b82f6';
            case 'resolue': return '#10b981';
            default: return '#64748b';
        }
    };

    const getStatutLabel = (statut: string) => {
        switch (statut) {
            case 'signalee': return 'Signalée';
            case 'en_cours': return 'En cours';
            case 'resolue': return 'Résolue';
            default: return statut;
        }
    };

    if (showForm) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Déclarer une panne</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Type de panne</Text>
                        <View style={styles.typeButtons}>
                            {['Moteur', 'Transmission', 'Freins', 'Électricité', 'Carrosserie', 'Autre'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                                    onPress={() => setType(t)}
                                >
                                    <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                                        {t}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.textarea}
                            multiline
                            numberOfLines={4}
                            placeholder="Décrivez le problème rencontré..."
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Photos ({photos.length})</Text>
                        <View style={styles.photoButtons}>
                            <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                                <Text style={styles.photoBtnIcon}>📷</Text>
                                <Text style={styles.photoBtnText}>Prendre photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                                <Text style={styles.photoBtnIcon}>🖼️</Text>
                                <Text style={styles.photoBtnText}>Galerie</Text>
                            </TouchableOpacity>
                        </View>
                        {photos.length > 0 && (
                            <ScrollView horizontal style={styles.photosPreview}>
                                {photos.map((photo, index) => (
                                    <Image key={index} source={{ uri: photo }} style={styles.photoThumb} />
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    <View style={styles.formActions}>
                        <TouchableOpacity 
                            style={styles.cancelBtn}
                            onPress={() => setShowForm(false)}
                        >
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.submitBtn}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitBtnText}>Déclarer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => setShowForm(true)}
            >
                <Text style={styles.addBtnIcon}>+</Text>
                <Text style={styles.addBtnText}>Déclarer une panne</Text>
            </TouchableOpacity>

            <ScrollView style={styles.list}>
                {pannes.map((panne) => (
                    <View key={panne.id} style={styles.panneCard}>
                        <View style={styles.panneHeader}>
                            <View style={styles.panneType}>
                                <Text style={styles.panneTypeText}>{panne.type}</Text>
                            </View>
                            <View style={[styles.statutBadge, { backgroundColor: `${getStatutColor(panne.statut)}20` }]}>
                                <Text style={[styles.statutText, { color: getStatutColor(panne.statut) }]}>
                                    {getStatutLabel(panne.statut)}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.panneDesc}>{panne.description}</Text>
                        <Text style={styles.panneDate}>
                            Signalée le {new Date(panne.date).toLocaleDateString('fr-FR')}
                        </Text>
                        {panne.photos && panne.photos.length > 0 && (
                            <Text style={styles.pannePhotos}>
                                📷 {panne.photos.length} photo(s)
                            </Text>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563eb',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    addBtnIcon: {
        fontSize: 24,
        color: '#fff',
    },
    addBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    panneCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    panneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    panneType: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    panneTypeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
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
    panneDesc: {
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 8,
        lineHeight: 22,
    },
    panneDate: {
        fontSize: 12,
        color: '#64748b',
    },
    pannePhotos: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 8,
    },
    // Formulaire
    form: {
        padding: 16,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    typeButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    typeBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    typeText: {
        fontSize: 13,
        color: '#64748b',
    },
    typeTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    textarea: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#f9fafb',
        textAlignVertical: 'top',
        minHeight: 100,
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    photoBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    photoBtnIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    photoBtnText: {
        fontSize: 13,
        color: '#64748b',
    },
    photosPreview: {
        marginTop: 12,
    },
    photoThumb: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    submitBtn: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#2563eb',
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
