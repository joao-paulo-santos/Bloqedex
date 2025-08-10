import type { Pokemon } from './Pokemon';

export interface CaughtPokemon {
    id: number;
    pokemonId: number;
    pokemon: Pokemon;
    caughtAt: string;
    notes?: string;
    isFavorite: boolean;
    nickname?: string;
}
