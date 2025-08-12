import { describe, it, expect } from 'vitest'
import { getLastConsecutiveId, getLastConsecutiveIdFromMap } from './pokemonHelpers'
import type { Pokemon } from '../../core/types'

// Helper function to create test Pokemon
const createTestPokemon = (id: number, pokeApiId: number, name: string, height: number, weight: number, types: string[]): Pokemon => ({
    id,
    pokeApiId,
    name,
    height,
    weight,
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45,
    spriteUrl: `https://example.com/${name}.png`,
    officialArtworkUrl: `https://example.com/${name}_artwork.png`,
    types,
    isCaught: false,
    firstAddedToPokedex: new Date().toISOString()
})

describe('Pokemon Helpers', () => {
    describe('getLastConsecutiveId', () => {
        it('should return 0 for empty array', () => {
            const result = getLastConsecutiveId([])
            expect(result).toBe(0)
        })

        it('should return the highest consecutive ID starting from 1', () => {
            const pokemon: Pokemon[] = [
                createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']),
                createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass']),
                createTestPokemon(3, 3, 'venusaur', 20, 1000, ['grass'])
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(3)
        })

        it('should stop at first gap in sequence', () => {
            const pokemon: Pokemon[] = [
                createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']),
                createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass']),
                createTestPokemon(5, 5, 'charmeleon', 11, 190, ['fire'])
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(2)
        })

        it('should handle non-sequential order in array', () => {
            const pokemon: Pokemon[] = [
                createTestPokemon(3, 3, 'venusaur', 20, 1000, ['grass']),
                createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']),
                createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass'])
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(3)
        })

        it('should return 0 if sequence does not start from 1', () => {
            const pokemon: Pokemon[] = [
                createTestPokemon(5, 5, 'charmeleon', 11, 190, ['fire']),
                createTestPokemon(6, 6, 'charizard', 17, 905, ['fire'])
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(0)
        })
    })

    describe('getLastConsecutiveIdFromMap', () => {
        it('should return 0 for empty map', () => {
            const pokemonMap = new Map<number, Pokemon>()
            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(0)
        })

        it('should return the highest consecutive ID starting from 1', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(1, createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']))
            pokemonMap.set(2, createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass']))
            pokemonMap.set(3, createTestPokemon(3, 3, 'venusaur', 20, 1000, ['grass']))

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(3)
        })

        it('should stop at first gap in sequence', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(1, createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']))
            pokemonMap.set(2, createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass']))
            pokemonMap.set(5, createTestPokemon(5, 5, 'charmeleon', 11, 190, ['fire']))

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(2)
        })

        it('should return 0 if sequence does not start from 1', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(5, createTestPokemon(5, 5, 'charmeleon', 11, 190, ['fire']))
            pokemonMap.set(6, createTestPokemon(6, 6, 'charizard', 17, 905, ['fire']))

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(0)
        })

        it('should handle large gaps correctly', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(1, createTestPokemon(1, 1, 'bulbasaur', 7, 69, ['grass']))
            pokemonMap.set(2, createTestPokemon(2, 2, 'ivysaur', 10, 130, ['grass']))
            pokemonMap.set(3, createTestPokemon(3, 3, 'venusaur', 20, 1000, ['grass']))
            pokemonMap.set(150, createTestPokemon(150, 150, 'mewtwo', 20, 1220, ['psychic']))

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(3)
        })
    })
})
