export interface PokemonFilters {
    name?: string;
    types?: string[];
    caughtOnly?: boolean;
    favoritesOnly?: boolean;
    sortBy?: 'name' | 'height' | 'weight' | 'caughtAt' | 'pokeApiId';
    sortOrder?: 'asc' | 'desc';
    minHeight?: number;
    maxHeight?: number;
    minWeight?: number;
    maxWeight?: number;
}
