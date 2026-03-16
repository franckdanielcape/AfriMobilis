/**
 * Service de notifications push pour l'application mobile
 * Utilise Expo Notifications
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    private expoPushToken: string | null = null;

    /**
     * Initialiser les notifications
     */
    async initialize(): Promise<boolean> {
        if (!Device.isDevice) {
            console.log('[Notifications] Must use physical device for Push Notifications');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return false;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
        });

        this.expoPushToken = token.data;
        console.log('[Notifications] Token:', this.expoPushToken);

        // Configurer le canal pour Android
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return true;
    }

    /**
     * Enregistrer le token sur le serveur
     */
    async registerToken(userId: string): Promise<void> {
        if (!this.expoPushToken) return;

        try {
            await apiService.client
                .from('push_tokens')
                .upsert({
                    user_id: userId,
                    token: this.expoPushToken,
                    platform: Platform.OS,
                    updated_at: new Date().toISOString(),
                });
        } catch (error) {
            console.error('[Notifications] Failed to register token:', error);
        }
    }

    /**
     * Écouter les notifications reçues
     */
    addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Écouter les interactions avec les notifications
     */
    addNotificationResponseReceivedListener(
        callback: (response: Notifications.NotificationResponse) => void
    ) {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Supprimer un listener
     */
    removeNotificationSubscription(subscription: Notifications.Subscription) {
        Notifications.removeNotificationSubscription(subscription);
    }

    /**
     * Planifier une notification locale
     */
    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: any,
        trigger?: Notifications.NotificationTriggerInput
    ): Promise<string> {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: trigger || null,
        });
        return id;
    }

    /**
     * Annuler une notification planifiée
     */
    async cancelScheduledNotification(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    /**
     * Effacer le badge
     */
    async clearBadge(): Promise<void> {
        await Notifications.setBadgeCountAsync(0);
    }

    /**
     * Récupérer le token
     */
    getToken(): string | null {
        return this.expoPushToken;
    }
}

export const notificationService = new NotificationService();
