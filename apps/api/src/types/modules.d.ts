// Type declarations for optional dependencies

declare module 'redis' {
    export function createClient(options?: any): any;
}

declare module '@sendgrid/mail' {
    const mail: any;
    export default mail;
}

declare module 'nodemailer' {
    export function createTransport(options: any): any;
}

declare module 'twilio' {
    export default function twilio(accountSid: string, authToken: string): any;
}

declare module 'axios' {
    export default function axios(config: any): Promise<any>;
}

declare module 'zod' {
    export class ZodError extends Error {
        errors: Array<{ path: string[]; message: string }>;
    }
    export class ZodSchema {
        parse(data: any): any;
    }
    export function object(shape: any): any;
    export function string(): any;
    export function number(): any;
    export function enum_(values: any): any;
    export function uuid(): any;
    export function datetime(): any;
}

declare module 'express-rate-limit' {
    export default function rateLimit(options: any): any;
}

declare module 'compression' {
    export default function compression(): any;
}
