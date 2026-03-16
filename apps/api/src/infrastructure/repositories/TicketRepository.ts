import { supabaseAdmin } from '../../config/supabase';
import { Ticket, CreateTicketDTO } from '../../domain/entities/Ticket';

export interface ITicketRepository {
    findAll(): Promise<Ticket[]>;
    findById(id: string): Promise<Ticket | null>;
    create(ticket: CreateTicketDTO): Promise<Ticket>;
}

export class TicketRepository implements ITicketRepository {
    async findAll(): Promise<Ticket[]> {
        const { data, error } = await supabaseAdmin.from('tickets').select('*');
        if (error) throw new Error(error.message);
        return data as Ticket[];
    }

    async findById(id: string): Promise<Ticket | null> {
        const { data, error } = await supabaseAdmin.from('tickets').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Ticket | null;
    }

    async create(ticket: CreateTicketDTO): Promise<Ticket> {
        const { data, error } = await supabaseAdmin.from('tickets').insert([ticket]).select().single();
        if (error) throw new Error(error.message);
        return data as Ticket;
    }
}
