import { IObjetRepository } from '../../../infrastructure/repositories/ObjetRepository';
import { Objet, CreateObjetDTO } from '../../../domain/entities/Objet';

export class GetObjetsUseCase {
    constructor(private objetRepo: IObjetRepository) { }

    async execute(): Promise<Objet[]> {
        return this.objetRepo.findAll();
    }
}

export class CreateObjetUseCase {
    constructor(private objetRepo: IObjetRepository) { }

    async execute(dto: CreateObjetDTO): Promise<Objet> {
        if (!dto.type || !dto.description) {
            throw new Error("Le type et la description sont obligatoires.");
        }
        return this.objetRepo.create(dto);
    }
}
