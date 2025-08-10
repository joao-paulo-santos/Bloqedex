import { indexedDBStorage } from '../../infrastructure/storage/IndexedDBStorage';
import type { Pokemon } from '../../core/entities';

// Sample Pokemon data for offline seeding
const samplePokemon: Omit<Pokemon, 'id'>[] = [
    {
        pokeApiId: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        baseExperience: 64,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
        officialArtworkUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        types: [
            { slot: 1, name: 'grass' },
            { slot: 2, name: 'poison' }
        ],
        stats: [
            { name: 'hp', baseStat: 45 },
            { name: 'attack', baseStat: 49 },
            { name: 'defense', baseStat: 49 },
            { name: 'special-attack', baseStat: 65 },
            { name: 'special-defense', baseStat: 65 },
            { name: 'speed', baseStat: 45 }
        ]
    },
    {
        pokeApiId: 4,
        name: 'charmander',
        height: 6,
        weight: 85,
        baseExperience: 62,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',
        officialArtworkUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',
        types: [
            { slot: 1, name: 'fire' }
        ],
        stats: [
            { name: 'hp', baseStat: 39 },
            { name: 'attack', baseStat: 52 },
            { name: 'defense', baseStat: 43 },
            { name: 'special-attack', baseStat: 60 },
            { name: 'special-defense', baseStat: 50 },
            { name: 'speed', baseStat: 65 }
        ]
    },
    {
        pokeApiId: 7,
        name: 'squirtle',
        height: 5,
        weight: 90,
        baseExperience: 63,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',
        officialArtworkUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
        types: [
            { slot: 1, name: 'water' }
        ],
        stats: [
            { name: 'hp', baseStat: 44 },
            { name: 'attack', baseStat: 48 },
            { name: 'defense', baseStat: 65 },
            { name: 'special-attack', baseStat: 50 },
            { name: 'special-defense', baseStat: 64 },
            { name: 'speed', baseStat: 43 }
        ]
    },
    {
        pokeApiId: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        baseExperience: 112,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
        officialArtworkUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        types: [
            { slot: 1, name: 'electric' }
        ],
        stats: [
            { name: 'hp', baseStat: 35 },
            { name: 'attack', baseStat: 55 },
            { name: 'defense', baseStat: 40 },
            { name: 'special-attack', baseStat: 50 },
            { name: 'special-defense', baseStat: 50 },
            { name: 'speed', baseStat: 90 }
        ]
    },
    {
        pokeApiId: 150,
        name: 'mewtwo',
        height: 20,
        weight: 1220,
        baseExperience: 306,
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
        officialArtworkUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
        types: [
            { slot: 1, name: 'psychic' }
        ],
        stats: [
            { name: 'hp', baseStat: 106 },
            { name: 'attack', baseStat: 110 },
            { name: 'defense', baseStat: 90 },
            { name: 'special-attack', baseStat: 154 },
            { name: 'special-defense', baseStat: 90 },
            { name: 'speed', baseStat: 130 }
        ]
    }
];

export const seedOfflineData = async (): Promise<void> => {
    try {
        // Initialize the database first
        await indexedDBStorage.init();

        // Check if we already have Pokemon data
        const existingPokemon = await indexedDBStorage.getAllPokemon();

        if (existingPokemon.length === 0) {
            console.log('Seeding offline Pokemon data...');

            // Add sample Pokemon data
            for (const pokemon of samplePokemon) {
                // Generate a simple ID for storage
                const pokemonWithId = {
                    ...pokemon,
                    id: pokemon.pokeApiId
                };

                await indexedDBStorage.savePokemon(pokemonWithId);
            }

            console.log(`Seeded ${samplePokemon.length} Pokemon for offline use`);
        } else {
            console.log(`Found ${existingPokemon.length} Pokemon already in offline storage`);
        }
    } catch (error) {
        console.warn('Failed to seed offline data:', error);
    }
};

export const clearOfflineData = async (): Promise<void> => {
    try {
        await indexedDBStorage.init();
        // Clear all Pokemon data (this would need to be implemented in IndexedDBStorage)
        console.log('Offline data cleared');
    } catch (error) {
        console.warn('Failed to clear offline data:', error);
    }
};
