import { ITicketRepository } from '../../../infrastructure/repositories/TicketRepository';
import { Ticket, CreateTicketDTO } from '../../../domain/entities/Ticket';

export class GetTicketsUseCase {
    constructor(private ticketRepo: ITicketRepository) { }

    async execute(): Promise<Ticket[]> {
        return this.ticketRepo.findAll();
    }
}

export class CreateTicketUseCase {
    constructor(private ticketRepo: ITicketRepository) { }

    async execute(dto: CreateTicketDTO): Promise<Ticket> {
        if (!dto.type || !dto.description) {
            throw new Error("Le type et la description sont obligatoires.");
        }
        return this.ticketRepo.create(dto);
    }
}
