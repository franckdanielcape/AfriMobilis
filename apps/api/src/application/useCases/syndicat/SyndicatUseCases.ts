import { ISyndicatRepository } from '../../../infrastructure/repositories/SyndicatRepository';
import { Syndicat, CreateSyndicatDTO } from '../../../domain/entities/Syndicat';

export class GetSyndicatsUseCase {
    constructor(private syndicatRepo: ISyndicatRepository) { }

    async execute(): Promise<Syndicat[]> {
        return this.syndicatRepo.findAll();
    }
}

export class CreateSyndicatUseCase {
    constructor(private syndicatRepo: ISyndicatRepository) { }

    async execute(dto: CreateSyndicatDTO): Promise<Syndicat> {
        if (!dto.nom || !dto.code) {
            throw new Error("Le nom et le code sont obligatoires.");
        }
        return this.syndicatRepo.create(dto);
    }
}
