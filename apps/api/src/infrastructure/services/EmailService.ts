/**
 * Service d'envoi d'emails pour AfriMobilis
 * Utilise SendGrid ou SMTP selon la configuration
 */

interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

export class EmailService {
    private useSendGrid: boolean;

    constructor() {
        this.useSendGrid = !!process.env.SENDGRID_API_KEY;

        if (this.useSendGrid) {
            console.log('[Email] Using SendGrid');
        } else if (process.env.SMTP_HOST) {
            console.log('[Email] Using SMTP');
        } else {
            console.log('[Email] No email provider configured - emails will be logged only');
        }
    }

    async send(options: EmailOptions): Promise<boolean> {
        try {
            console.log('[Email] Sending to:', options.to);
            console.log('[Email] Subject:', options.subject);

            if (!this.useSendGrid && !process.env.SMTP_HOST) {
                console.log('[Email] DEV MODE - Email logged but not sent');
                console.log('[Email] Content:', options.html || options.text);
                return true;
            }

            // TODO: Implement actual email sending with SendGrid or SMTP
            // For now, just log in development mode
            return true;
        } catch (error) {
            console.error('[Email] Send error:', error);
            return false;
        }
    }

    async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
        return this.send({
            to,
            subject: 'Bienvenue sur AfriMobilis !',
            html: `<h1>Bienvenue ${name}!</h1><p>Votre compte est actif.</p>`,
        });
    }

    async sendPasswordReset(to: string, resetLink: string): Promise<boolean> {
        return this.send({
            to,
            subject: 'Réinitialisation de votre mot de passe',
            html: `<a href="${resetLink}">Réinitialiser</a>`,
        });
    }

    async sendVersementReminder(to: string, chauffeurName: string, montant: number, date: string): Promise<boolean> {
        return this.send({
            to,
            subject: 'Rappel: Versement en retard',
            html: `<p>Chauffeur: ${chauffeurName}</p><p>Montant: ${montant} FCFA</p>`,
        });
    }
}

export const emailService = new EmailService();
