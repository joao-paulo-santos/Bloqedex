// Pokemon entity following clean architecture principles
export interface Pokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    baseExperience: number;
    sprites: PokemonSprites;
    types: PokemonType[];
    stats: PokemonStat[];
    abilities: PokemonAbility[];
    species: PokemonSpecies;
}

export interface PokemonSprites {
    frontDefault: string;
    frontShiny: string;
    backDefault: string;
    backShiny: string;
    frontFemale?: string;
    backFemale?: string;
    frontShinyFemale?: string;
    backShinyFemale?: string;
}

export interface PokemonType {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

export interface PokemonStat {
    baseStat: number;
    effort: number;
    stat: {
        name: string;
        url: string;
    };
}

export interface PokemonAbility {
    isHidden: boolean;
    slot: number;
    ability: {
        name: string;
        url: string;
    };
}

export interface PokemonSpecies {
    name: string;
    url: string;
}

export interface PokemonSummary {
    id: number;
    name: string;
    imageUrl: string;
    types: string[];
}
