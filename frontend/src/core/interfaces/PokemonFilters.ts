export interface PokemonFilters {
    name?: string; // Contains search
    nameExact?: string; //exact

    pokeApiId?: number;

    types?: string[]; // Must have 
    typesAll?: string[]; // Must have all
    excludeTypes?: string[]; // Must not haves

    minBaseExperience?: number;
    maxBaseExperience?: number;

    // Battle stats filters
    minSpecialAttack?: number;
    maxSpecialAttack?: number;
    minSpecialDefense?: number;
    maxSpecialDefense?: number;
    minSpeed?: number;
    maxSpeed?: number;

    minTotalStats?: number;
    maxTotalStats?: number;

    // User interaction filters
    caughtOnly?: boolean;
    uncaughtOnly?: boolean;
    favoritesOnly?: boolean;

    sortBy?: 'name' | 'pokeApiId' | 'height' | 'weight' | 'baseExperience' |
    'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' |
    'speed' | 'totalStats' | 'caughtAt' | 'firstAddedToPokedex';
    sortOrder?: 'asc' | 'desc';
}
