export interface Pokemon {
    id: number;
    pokeApiId: number;
    name: string;
    height: number;
    weight: number;
    baseExperience?: number;
    imageUrl?: string;
    spriteUrl?: string;
    officialArtworkUrl?: string;
    stats: PokemonStat[];
    types: string[];
    isCaught?: boolean;
    caughtAt?: string;
    hp?: number;
    attack?: number;
    defense?: number;
    specialAttack?: number;
    specialDefense?: number;
    speed?: number;
    firstAddedToPokedex?: string;
}

export interface PokemonStat {
    name: string;
    baseStat: number;
}
