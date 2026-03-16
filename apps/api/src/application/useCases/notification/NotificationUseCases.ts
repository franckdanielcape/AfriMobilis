import { INotificationRepository } from '../../../infrastructure/repositories/NotificationRepository';
import { Notification, CreateNotificationDTO } from '../../../domain/entities/Notification';

export class GetNotificationsUseCase {
    constructor(private notificationRepo: INotificationRepository) { }

    async execute(userId: string): Promise<Notification[]> {
        return this.notificationRepo.findByUserId(userId);
    }
}

export class CreateNotificationUseCase {
    constructor(private notificationRepo: INotificationRepository) { }

    async execute(dto: CreateNotificationDTO): Promise<Notification> {
        if (!dto.profil_id || !dto.titre || !dto.message || !dto.type) {
            throw new Error("L'ID profil, le titre, le message et le type sont obligatoires.");
        }
        return this.notificationRepo.create(dto);
    }
}

export class MarkNotificationReadUseCase {
    constructor(private notificationRepo: INotificationRepository) { }

    async execute(id: string): Promise<void> {
        return this.notificationRepo.markAsRead(id);
    }
}

export class MarkAllNotificationsReadUseCase {
    constructor(private notificationRepo: INotificationRepository) { }

    async execute(userId: string): Promise<void> {
        return this.notificationRepo.markAllAsRead(userId);
    }
}
