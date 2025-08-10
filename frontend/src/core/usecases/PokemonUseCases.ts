import type { Pokemon } from '../entities';
import type { IPokemonRepository, PokemonFilters, PaginatedResponse } from '../interfaces';

export class PokemonUseCases {
    private pokemonRepo: IPokemonRepository;

    constructor(pokemonRepo: IPokemonRepository) {
        this.pokemonRepo = pokemonRepo;
    }

    async getAllPokemon(
        filters?: PokemonFilters,
        pageIndex = 0,
        pageSize = 20
    ): Promise<PaginatedResponse<Pokemon>> {
        return this.pokemonRepo.getAll(filters, pageIndex, pageSize);
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
