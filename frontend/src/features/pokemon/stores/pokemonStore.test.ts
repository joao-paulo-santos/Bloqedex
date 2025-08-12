import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePokemonStore } from '../stores/pokemonStore'
import type { Pokemon } from '../../../core/entities'

vi.mock('../../../core/usecases', () => ({
    PokemonUseCases: vi.fn().mockImplementation(() => ({
        getAllPokemon: vi.fn(),
        searchByName: vi.fn(),
        getPaginated: vi.fn(),
    }))
}))

vi.mock('../../../infrastructure/repositories', () => ({
    pokemonRepository: {
        getAllPokemon: vi.fn(),
        searchByName: vi.fn(),
    }
}))

vi.mock('../../../infrastructure/storage/IndexedDBStorage', () => ({
    indexedDBStorage: {
        getAllPokemon: vi.fn(),
        bulkStorePokemon: vi.fn(),
    }
}))

describe('Pokemon Store', () => {
    beforeEach(() => {
        usePokemonStore.setState({
            pokemonMap: new Map(),
            lastConsecutiveId: 0,
            totalPokemons: null,
            allPokemonFetchedAt: null,
            isLoading: false,
            error: null,
            filters: { name: '', types: [], sortBy: 'pokeApiId', sortOrder: 'asc' },
        })
        vi.clearAllMocks()
    })

    describe('getPokemonArray', () => {
        it('should return an empty array when no Pokemon are stored', () => {
            const store = usePokemonStore.getState()
            const pokemonArray = store.getPokemonArray()

            expect(pokemonArray).toEqual([])
        })

        it('should return Pokemon sorted by pokeApiId by default', () => {
            const mockPokemon: Pokemon[] = [
                {
                    id: 3,
                    pokeApiId: 3,
                    name: 'venusaur',
                    types: ['grass', 'poison'],
                    height: 20,
                    weight: 1000,
                    hp: 80,
                    attack: 82,
                    defense: 83,
                    specialAttack: 100,
                    specialDefense: 100,
                    speed: 80,
                    spriteUrl: 'https://example.com/venusaur-sprite.png',
                    officialArtworkUrl: 'https://example.com/venusaur-artwork.png',
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                },
                {
                    id: 1,
                    pokeApiId: 1,
                    name: 'bulbasaur',
                    types: ['grass', 'poison'],
                    height: 7,
                    weight: 69,
                    hp: 45,
                    attack: 49,
                    defense: 49,
                    specialAttack: 65,
                    specialDefense: 65,
                    speed: 45,
                    spriteUrl: 'https://example.com/bulbasaur-sprite.png',
                    officialArtworkUrl: 'https://example.com/bulbasaur-artwork.png',
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                },
                {
                    id: 2,
                    pokeApiId: 2,
                    name: 'ivysaur',
                    types: ['grass', 'poison'],
                    height: 10,
                    weight: 130,
                    hp: 60,
                    attack: 62,
                    defense: 63,
                    specialAttack: 80,
                    specialDefense: 80,
                    speed: 60,
                    spriteUrl: 'https://example.com/ivysaur-sprite.png',
                    officialArtworkUrl: 'https://example.com/ivysaur-artwork.png',
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                }
            ]

            const pokemonMap = new Map()
            mockPokemon.forEach(pokemon => pokemonMap.set(pokemon.pokeApiId, pokemon))

            usePokemonStore.setState({ pokemonMap })

            const store = usePokemonStore.getState()
            const pokemonArray = store.getPokemonArray()

            expect(pokemonArray).toHaveLength(3)
            expect(pokemonArray[0].pokeApiId).toBe(1)
            expect(pokemonArray[1].pokeApiId).toBe(2)
            expect(pokemonArray[2].pokeApiId).toBe(3)
        })

        it('should sort Pokemon by name when filter is set', () => {
            const mockPokemon: Pokemon[] = [
                {
                    id: 3,
                    pokeApiId: 3,
                    name: 'venusaur',
                    types: ['grass', 'poison'],
                    height: 20,
                    weight: 1000,
                    hp: 80,
                    attack: 82,
                    defense: 83,
                    specialAttack: 100,
                    specialDefense: 100,
                    speed: 80,
                    spriteUrl: 'https://example.com/venusaur-sprite.png',
                    officialArtworkUrl: 'https://example.com/venusaur-artwork.png',
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                },
                {
                    id: 1,
                    pokeApiId: 1,
                    name: 'bulbasaur',
                    types: ['grass', 'poison'],
                    height: 7,
                    weight: 69,
                    hp: 45,
                    attack: 49,
                    defense: 49,
                    specialAttack: 65,
                    specialDefense: 65,
                    speed: 45,
                    spriteUrl: 'https://example.com/bulbasaur-sprite.png',
                    officialArtworkUrl: 'https://example.com/bulbasaur-artwork.png',
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                }
            ]

            const pokemonMap = new Map()
            mockPokemon.forEach(pokemon => pokemonMap.set(pokemon.pokeApiId, pokemon))

            usePokemonStore.setState({
                pokemonMap,
                filters: { name: '', types: [], sortBy: 'name', sortOrder: 'asc' }
            })

            const store = usePokemonStore.getState()
            const pokemonArray = store.getPokemonArray()

            expect(pokemonArray[0].name).toBe('bulbasaur')
            expect(pokemonArray[1].name).toBe('venusaur')
        })
    })

    describe('getPokemonByPokeApiId', () => {
        it('should return Pokemon by pokeApiId', () => {
            const mockPokemon: Pokemon = {
                id: 1,
                pokeApiId: 1,
                name: 'bulbasaur',
                types: ['grass', 'poison'],
                height: 7,
                weight: 69,
                hp: 45,
                attack: 49,
                defense: 49,
                specialAttack: 65,
                specialDefense: 65,
                speed: 45,
                spriteUrl: 'https://example.com/bulbasaur-sprite.png',
                officialArtworkUrl: 'https://example.com/bulbasaur-artwork.png',
                isCaught: false,
                firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
            }

            const pokemonMap = new Map()
            pokemonMap.set(1, mockPokemon)

            usePokemonStore.setState({ pokemonMap })

            const store = usePokemonStore.getState()
            const result = store.getPokemonByPokeApiId(1)

            expect(result).toEqual(mockPokemon)
        })

        it('should return undefined for non-existent Pokemon', () => {
            const store = usePokemonStore.getState()
            const result = store.getPokemonByPokeApiId(999)

            expect(result).toBeUndefined()
        })
    })

    describe('hasAllPokemon', () => {
        it('should return false when no Pokemon are stored', () => {
            const store = usePokemonStore.getState()
            const result = store.hasAllPokemon()

            expect(result).toBe(false)
        })

        it('should return false when lastConsecutiveId is less than totalPokemons', () => {
            usePokemonStore.setState({
                lastConsecutiveId: 150,
                totalPokemons: 1000
            })

            const store = usePokemonStore.getState()
            const result = store.hasAllPokemon()

            expect(result).toBe(false)
        })

        it('should return true when lastConsecutiveId equals totalPokemons', () => {
            // Create a pokemonMap with 1000 Pokemon to match totalPokemons
            const pokemonMap = new Map()
            for (let i = 1; i <= 1000; i++) {
                pokemonMap.set(i, {
                    id: i,
                    pokeApiId: i,
                    name: `pokemon-${i}`,
                    types: ['normal'],
                    spriteUrl: `https://example.com/${i}-sprite.png`,
                    officialArtworkUrl: `https://example.com/${i}-artwork.png`,
                    height: 10,
                    weight: 100,
                    hp: 50,
                    attack: 50,
                    defense: 50,
                    specialAttack: 50,
                    specialDefense: 50,
                    speed: 50,
                    isCaught: false,
                    firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
                })
            }

            usePokemonStore.setState({
                pokemonMap,
                lastConsecutiveId: 1000,
                totalPokemons: 1000
            })

            const store = usePokemonStore.getState()
            const result = store.hasAllPokemon()

            expect(result).toBe(true)
        })
    })

    describe('isCacheStale', () => {
        it('should return true when cache is older than configured time', () => {
            const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago

            usePokemonStore.setState({
                allPokemonFetchedAt: oldTimestamp
            })

            const store = usePokemonStore.getState()
            const result = store.isCacheStale()

            expect(result).toBe(true)
        })

        it('should return false when cache is fresh', () => {
            const freshTimestamp = Date.now() - (1 * 60 * 60 * 1000) // 1 hour ago

            usePokemonStore.setState({
                allPokemonFetchedAt: freshTimestamp
            })

            const store = usePokemonStore.getState()
            const result = store.isCacheStale()

            expect(result).toBe(false)
        })

        it('should return true when allPokemonFetchedAt is null', () => {
            usePokemonStore.setState({
                allPokemonFetchedAt: null
            })

            const store = usePokemonStore.getState()
            const result = store.isCacheStale()

            expect(result).toBe(true)
        })
    })

    describe('setFilters', () => {
        it('should update filters', () => {
            const newFilters = {
                name: 'pikachu',
                types: ['electric'],
                sortBy: 'name' as const,
                sortOrder: 'desc' as const
            }

            const store = usePokemonStore.getState()
            store.setFilters(newFilters)

            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.filters).toEqual(newFilters)
        })
    })

    describe('clearError', () => {
        it('should clear the error state', () => {
            usePokemonStore.setState({ error: 'Some error occurred' })

            const store = usePokemonStore.getState()
            store.clearError()

            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.error).toBeNull()
        })
    })
})
