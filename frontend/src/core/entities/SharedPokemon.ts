import type { Pokemon } from './Pokemon';

export interface SharedPokemon {
    id: number;
    shareToken: string;
    title: string;
    description?: string;
    isActive: boolean;
    expiresAt?: string;
    maxViews?: number;
    currentViews: number;
    isCollection: boolean;
    createdAt: string;
    pokemon?: Pokemon[];
}
