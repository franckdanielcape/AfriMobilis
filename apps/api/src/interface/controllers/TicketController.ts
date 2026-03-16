import { Request, Response } from 'express';
import { GetTicketsUseCase, CreateTicketUseCase } from '../../application/useCases/ticket/TicketUseCases';
import { TicketRepository } from '../../infrastructure/repositories/TicketRepository';

const ticketRepository = new TicketRepository();
const getTicketsUseCase = new GetTicketsUseCase(ticketRepository);
const createTicketUseCase = new CreateTicketUseCase(ticketRepository);

export class TicketController {
    static async getTickets(req: Request, res: Response) {
        try {
            const tickets = await getTicketsUseCase.execute();
            res.status(200).json(tickets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createTicket(req: Request, res: Response) {
        try {
            const newTicket = await createTicketUseCase.execute(req.body);
            res.status(201).json(newTicket);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
