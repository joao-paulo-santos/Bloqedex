import type { Pokemon } from './Pokemon';

export interface CaughtPokemon {
    id: number;
    userId: number;
    pokemon: Pokemon;
    caughtDate: string;
    notes?: string;
    isFavorite: boolean;
}
