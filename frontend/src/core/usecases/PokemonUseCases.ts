import type { Pokemon } from '../entities';
import type { IPokemonRepository, PaginatedResponse } from '../interfaces';

export class PokemonUseCases {
    private pokemonRepo: IPokemonRepository;

    constructor(pokemonRepo: IPokemonRepository) {
        this.pokemonRepo = pokemonRepo;
    }

    async getAllPokemon(): Promise<Pokemon[]> {
        // Get all Pokemon without pagination
        const result = await this.pokemonRepo.getPaginated();
        return result.pokemon;
    }

    async getPaginated(
        pageIndex: number = 0,
        pageSize: number = 50,
    ): Promise<PaginatedResponse<Pokemon>> {
        return this.pokemonRepo.getPaginated(pageIndex, pageSize);
    }

    async getPokemonById(id: number): Promise<Pokemon | null> {
        return this.pokemonRepo.getById(id);
    }

    async searchPokemon(name: string): Promise<Pokemon[]> {
        if (!name.trim()) {
            return [];
        }
        return this.pokemonRepo.search(name.trim());
    }
}
