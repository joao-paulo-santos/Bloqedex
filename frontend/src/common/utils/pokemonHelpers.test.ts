import { describe, it, expect } from 'vitest'
import { getLastConsecutiveId, getLastConsecutiveIdFromMap } from './pokemonHelpers'
import type { Pokemon } from '../../core/entities'

describe('Pokemon Helpers', () => {
    describe('getLastConsecutiveId', () => {
        it('should return 0 for empty array', () => {
            const result = getLastConsecutiveId([])
            expect(result).toBe(0)
        })

        it('should return the highest consecutive ID starting from 1', () => {
            const pokemon: Pokemon[] = [
                { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] },
                { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] },
                { id: 3, pokeApiId: 3, name: 'venusaur', height: 20, weight: 1000, stats: [], types: ['grass'] }
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(3)
        })

        it('should stop at first gap in sequence', () => {
            const pokemon: Pokemon[] = [
                { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] },
                { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] },
                { id: 5, pokeApiId: 5, name: 'charmeleon', height: 11, weight: 190, stats: [], types: ['fire'] }
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(2)
        })

        it('should handle non-sequential order in array', () => {
            const pokemon: Pokemon[] = [
                { id: 3, pokeApiId: 3, name: 'venusaur', height: 20, weight: 1000, stats: [], types: ['grass'] },
                { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] },
                { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] }
            ]

            const result = getLastConsecutiveId(pokemon)
            expect(result).toBe(3)
        })

        it('should return 0 if sequence does not start from 1', () => {
            const pokemon: Pokemon[] = [
                { id: 5, pokeApiId: 5, name: 'charmeleon', height: 11, weight: 190, stats: [], types: ['fire'] },
                { id: 6, pokeApiId: 6, name: 'charizard', height: 17, weight: 905, stats: [], types: ['fire'] }
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
            pokemonMap.set(1, { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] })
            pokemonMap.set(2, { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] })
            pokemonMap.set(3, { id: 3, pokeApiId: 3, name: 'venusaur', height: 20, weight: 1000, stats: [], types: ['grass'] })

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(3)
        })

        it('should stop at first gap in sequence', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(1, { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] })
            pokemonMap.set(2, { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] })
            pokemonMap.set(5, { id: 5, pokeApiId: 5, name: 'charmeleon', height: 11, weight: 190, stats: [], types: ['fire'] })

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(2)
        })

        it('should return 0 if sequence does not start from 1', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(5, { id: 5, pokeApiId: 5, name: 'charmeleon', height: 11, weight: 190, stats: [], types: ['fire'] })
            pokemonMap.set(6, { id: 6, pokeApiId: 6, name: 'charizard', height: 17, weight: 905, stats: [], types: ['fire'] })

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(0)
        })

        it('should handle large gaps correctly', () => {
            const pokemonMap = new Map<number, Pokemon>()
            pokemonMap.set(1, { id: 1, pokeApiId: 1, name: 'bulbasaur', height: 7, weight: 69, stats: [], types: ['grass'] })
            pokemonMap.set(2, { id: 2, pokeApiId: 2, name: 'ivysaur', height: 10, weight: 130, stats: [], types: ['grass'] })
            pokemonMap.set(3, { id: 3, pokeApiId: 3, name: 'venusaur', height: 20, weight: 1000, stats: [], types: ['grass'] })
            pokemonMap.set(150, { id: 150, pokeApiId: 150, name: 'mewtwo', height: 20, weight: 1220, stats: [], types: ['psychic'] })

            const result = getLastConsecutiveIdFromMap(pokemonMap)
            expect(result).toBe(3)
        })
    })
})
