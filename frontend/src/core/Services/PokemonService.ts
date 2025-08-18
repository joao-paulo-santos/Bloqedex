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
        return await this.pokemonRepo.getPaginated(isOnline, pageIndex, pageSize);
    }

    async getAllLocalPokemons(): Promise<Pokemon[]> {
        return this.pokemonRepo.getAllLocal();
    }

    async getPokemonById(id: number, isOnline: boolean): Promise<Pokemon | null> {
        return this.pokemonRepo.getById(id, isOnline);
    }

    async savePokemon(pokemon: Pokemon): Promise<void> {
        return this.pokemonRepo.savePokemon(pokemon);
    }

    async searchPokemon(name: string, isOnline: boolean): Promise<Pokemon[]> {
        if (!name.trim()) {
            return [];
        }
        return this.pokemonRepo.search(name.trim(), isOnline);
    }

    async clearAllCaughtStatus(): Promise<void> {
        return this.pokemonRepo.clearAllCaughtStatus();
    }
}
