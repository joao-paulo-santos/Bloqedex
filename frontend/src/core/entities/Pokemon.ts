export interface Pokemon {
    id: number;
    pokeApiId: number;
    name: string;
    height: number;
    weight: number;
    baseExperience: number;
    imageUrl?: string;
    officialArtworkUrl?: string;
    stats: PokemonStat[];
    types: PokemonType[];
    isCaught?: boolean;
    caughtAt?: string;
}

export interface PokemonStat {
    name: string;
    baseStat: number;
}

export interface PokemonType {
    name: string;
    slot: number;
}
