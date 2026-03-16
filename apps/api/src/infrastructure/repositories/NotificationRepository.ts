import { supabaseAdmin } from '../../config/supabase';
import { Notification, CreateNotificationDTO } from '../../domain/entities/Notification';

export interface INotificationRepository {
    findByUserId(userId: string): Promise<Notification[]>;
    create(notification: CreateNotificationDTO): Promise<Notification>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
}

export class NotificationRepository implements INotificationRepository {
    async findByUserId(userId: string): Promise<Notification[]> {
        const { data, error } = await supabaseAdmin.from('notifications')
            .select('*')
            .eq('profil_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data as Notification[];
    }

    async create(notification: CreateNotificationDTO): Promise<Notification> {
        const { data, error } = await supabaseAdmin.from('notifications').insert([notification]).select().single();
        if (error) throw new Error(error.message);
        return data as Notification;
    }

    async markAsRead(id: string): Promise<void> {
        const { error } = await supabaseAdmin.from('notifications').update({ lu: true }).eq('id', id);
        if (error) throw new Error(error.message);
    }

    async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabaseAdmin.from('notifications').update({ lu: true }).eq('profil_id', userId);
        if (error) throw new Error(error.message);
    }
}
