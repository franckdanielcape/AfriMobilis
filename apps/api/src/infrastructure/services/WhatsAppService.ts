/**
 * Service WhatsApp pour AfriMobilis
 * Utilise Twilio WhatsApp Business API
 */

interface WhatsAppMessage {
    to: string;
    body: string;
}

export class WhatsAppService {
    private enabled: boolean;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.enabled = !!(accountSid && authToken);

        if (this.enabled) {
            console.log('[WhatsApp] Service initialized');
        } else {
            console.log('[WhatsApp] Service disabled - configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
        }
    }

    async sendMessage(message: WhatsAppMessage): Promise<boolean> {
        try {
            console.log('[WhatsApp] Sending to:', message.to);
            console.log('[WhatsApp] Message:', message.body);

            if (!this.enabled) {
                console.log('[WhatsApp] DEV MODE - Message logged but not sent');
                return true;
            }

            // TODO: Implement actual Twilio sending
            return true;
        } catch (error) {
            console.error('[WhatsApp] Error:', error);
            return false;
        }
    }

    async sendWelcome(to: string, name: string): Promise<boolean> {
        const body = `🎉 Bienvenue sur AfriMobilis, ${name}!\nVotre compte est actif.`;
        return this.sendMessage({ to, body });
    }

    async sendCredentials(to: string, email: string, tempPassword: string): Promise<boolean> {
        const body = `🔐 Vos identifiants:\nEmail: ${email}\nMot de passe: ${tempPassword}`;
        return this.sendMessage({ to, body });
    }
}

export const whatsappService = new WhatsAppService();
