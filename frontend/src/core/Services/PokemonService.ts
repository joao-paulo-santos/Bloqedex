import type { Pokemon, IPokemonRepository, PaginatedResponse } from '../types';

export class PokemonService {
    private pokemonRepo: IPokemonRepository;

    constructor(pokemonRepo: IPokemonRepository) {
        this.pokemonRepo = pokemonRepo;
    }

    async getPaginated(
        isOnline: boolean,
        pageIndex: number = 0,
        pageSize: number = 50,
    ): Promise<PaginatedResponse<Pokemon>> {
        return this.pokemonRepo.getPaginated(isOnline, pageIndex, pageSize);
    }

    async getPokemonById(id: number, isOnline: boolean): Promise<Pokemon | null> {
        return this.pokemonRepo.getById(id, isOnline);
    }

    async searchPokemon(name: string, isOnline: boolean): Promise<Pokemon[]> {
        if (!name.trim()) {
            return [];
        }
        return this.pokemonRepo.search(name.trim(), isOnline);
    }
}
