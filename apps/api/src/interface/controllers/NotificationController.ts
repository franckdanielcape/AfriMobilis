import { Request, Response } from 'express';
import {
    GetNotificationsUseCase,
    CreateNotificationUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase
} from '../../application/useCases/notification/NotificationUseCases';
import { NotificationRepository } from '../../infrastructure/repositories/NotificationRepository';

const notificationRepo = new NotificationRepository();
const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
const createNotificationUseCase = new CreateNotificationUseCase(notificationRepo);
const markReadUseCase = new MarkNotificationReadUseCase(notificationRepo);
const markAllReadUseCase = new MarkAllNotificationsReadUseCase(notificationRepo);

export class NotificationController {
    static async getNotifications(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const notifications = await getNotificationsUseCase.execute(userId);
            res.status(200).json(notifications);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createNotification(req: Request, res: Response) {
        try {
            const newNotif = await createNotificationUseCase.execute(req.body);
            res.status(201).json(newNotif);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await markReadUseCase.execute(id);
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async markAllAsRead(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            await markAllReadUseCase.execute(userId);
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
