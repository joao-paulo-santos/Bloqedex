export interface Pokemon {
    pokeApiId: number;
    name: string;
    height: number;
    weight: number;
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
    spriteUrl: string;
    officialArtworkUrl: string;
    types: string[];
    isCaught: boolean;
    firstAddedToPokedex: string;
}
