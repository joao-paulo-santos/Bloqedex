import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePokemonStore } from '../stores/pokemonStore'
import type { Pokemon } from '../../../core/types'

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
        savePokemon: vi.fn(() => Promise.resolve()),
    }
}))

// Helper function to create mock Pokemon
const createMockPokemon = (pokeApiId: number, name: string): Pokemon => ({
    id: pokeApiId,
    pokeApiId,
    name,
    types: ['normal'],
    height: 10,
    weight: 100,
    hp: 50,
    attack: 60,
    defense: 70,
    specialAttack: 80,
    specialDefense: 90,
    speed: 100,
    spriteUrl: `https://example.com/pokemon/${pokeApiId}.png`,
    officialArtworkUrl: `https://example.com/artwork/${pokeApiId}.png`,
    isCaught: false,
    firstAddedToPokedex: new Date().toISOString()
})

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

    describe('Event Bus Integration', () => {
        it('should respond to auth:logout event by clearing all caught status', async () => {
            // Setup: Add some Pokemon with caught status
            const mockPokemon = createMockPokemon(1, 'Pikachu')
            mockPokemon.isCaught = true

            const pokemonMap = new Map()
            pokemonMap.set(1, mockPokemon)

            usePokemonStore.setState({ pokemonMap })

            // Verify Pokemon is caught
            const store = usePokemonStore.getState()
            expect(store.pokemonMap.get(1)?.isCaught).toBe(true)

            // Import eventBus to trigger the event
            const { eventBus } = await import('../../../common/utils/eventBus')

            // Trigger logout event
            eventBus.emit('auth:logout', { isOfflineAccount: false })

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 0))

            // Verify Pokemon caught status is cleared
            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.pokemonMap.get(1)?.isCaught).toBe(false)
        })

        it('should respond to pokemon:caught event by updating caught status', async () => {
            // Setup: Add Pokemon
            const mockPokemon = createMockPokemon(25, 'Pikachu')
            mockPokemon.isCaught = false

            const pokemonMap = new Map()
            pokemonMap.set(25, mockPokemon)

            usePokemonStore.setState({ pokemonMap })

            // Import eventBus to trigger the event
            const { eventBus } = await import('../../../common/utils/eventBus')

            // Trigger caught event
            eventBus.emit('pokemon:caught', { pokeApiId: 25 })

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 0))

            // Verify Pokemon caught status is updated
            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.pokemonMap.get(25)?.isCaught).toBe(true)
        })

        it('should respond to pokemon:released event by updating caught status', async () => {
            // Setup: Add Pokemon with caught status
            const mockPokemon = createMockPokemon(25, 'Pikachu')
            mockPokemon.isCaught = true

            const pokemonMap = new Map()
            pokemonMap.set(25, mockPokemon)

            usePokemonStore.setState({ pokemonMap })

            // Import eventBus to trigger the event
            const { eventBus } = await import('../../../common/utils/eventBus')

            // Trigger released event
            eventBus.emit('pokemon:released', { pokeApiId: 25 })

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 0))

            // Verify Pokemon caught status is updated
            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.pokemonMap.get(25)?.isCaught).toBe(false)
        })

        it('should respond to pokemon:bulk-caught event by updating multiple caught statuses', async () => {
            // Setup: Add multiple Pokemon
            const mockPokemon1 = createMockPokemon(25, 'Pikachu')
            const mockPokemon2 = createMockPokemon(26, 'Raichu')
            mockPokemon1.isCaught = false
            mockPokemon2.isCaught = false

            const pokemonMap = new Map()
            pokemonMap.set(25, mockPokemon1)
            pokemonMap.set(26, mockPokemon2)

            usePokemonStore.setState({ pokemonMap })

            // Import eventBus to trigger the event
            const { eventBus } = await import('../../../common/utils/eventBus')

            // Trigger bulk caught event
            eventBus.emit('pokemon:bulk-caught', { pokeApiIds: [25, 26] })

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 0))

            // Verify both Pokemon caught statuses are updated
            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.pokemonMap.get(25)?.isCaught).toBe(true)
            expect(updatedStore.pokemonMap.get(26)?.isCaught).toBe(true)
        })

        it('should respond to pokemon:refresh-caught-status event by refreshing all caught statuses', async () => {
            // Setup: Add multiple Pokemon with mixed caught statuses
            const mockPokemon1 = createMockPokemon(25, 'Pikachu')
            const mockPokemon2 = createMockPokemon(26, 'Raichu')
            const mockPokemon3 = createMockPokemon(27, 'Sandshrew')
            mockPokemon1.isCaught = true
            mockPokemon2.isCaught = true
            mockPokemon3.isCaught = false

            const pokemonMap = new Map()
            pokemonMap.set(25, mockPokemon1)
            pokemonMap.set(26, mockPokemon2)
            pokemonMap.set(27, mockPokemon3)

            usePokemonStore.setState({ pokemonMap })

            // Import eventBus to trigger the event
            const { eventBus } = await import('../../../common/utils/eventBus')

            // Trigger refresh event with only Pokemon 26 as caught
            eventBus.emit('pokemon:refresh-caught-status', {
                caughtPokemon: [{ pokemon: { pokeApiId: 26 } }]
            })

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 0))

            // Verify caught statuses are refreshed correctly
            const updatedStore = usePokemonStore.getState()
            expect(updatedStore.pokemonMap.get(25)?.isCaught).toBe(false) // Should be cleared
            expect(updatedStore.pokemonMap.get(26)?.isCaught).toBe(true)  // Should remain caught
            expect(updatedStore.pokemonMap.get(27)?.isCaught).toBe(false) // Should remain not caught
        })
    })
})
