import type { Pokemon } from './Pokemon';

export interface CaughtPokemon {
    userId: number;
    pokemon: Pokemon;
    caughtDate: string;
    notes?: string;
    isFavorite: boolean;
}

export interface NormalizedCaughtPokemon {
    userId: number;
    pokemon: Pokemon;
    caughtDate: string;
    notes?: string;
    isFavorite: 0 | 1;
}