import { describe, it, expect } from 'vitest'
import type { Pokemon } from './Pokemon'

describe('Pokemon Entity', () => {
    const mockPokemon: Pokemon = {
        id: 1,
        pokeApiId: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        baseExperience: 112,
        stats: [
            { name: 'hp', baseStat: 35 },
            { name: 'attack', baseStat: 55 },
            { name: 'defense', baseStat: 40 },
            { name: 'special-attack', baseStat: 50 },
            { name: 'special-defense', baseStat: 50 },
            { name: 'speed', baseStat: 90 }
        ],
        types: ['electric'],
        imageUrl: 'https://example.com/pikachu.png',
        spriteUrl: 'https://example.com/pikachu-sprite.png',
        officialArtworkUrl: 'https://example.com/pikachu-artwork.png'
    }

    it('should have required properties', () => {
        expect(mockPokemon).toHaveProperty('id')
        expect(mockPokemon).toHaveProperty('pokeApiId')
        expect(mockPokemon).toHaveProperty('name')
        expect(mockPokemon).toHaveProperty('height')
        expect(mockPokemon).toHaveProperty('weight')
        expect(mockPokemon).toHaveProperty('stats')
        expect(mockPokemon).toHaveProperty('types')
    })

    it('should have correct types for properties', () => {
        expect(typeof mockPokemon.id).toBe('number')
        expect(typeof mockPokemon.pokeApiId).toBe('number')
        expect(typeof mockPokemon.name).toBe('string')
        expect(typeof mockPokemon.height).toBe('number')
        expect(typeof mockPokemon.weight).toBe('number')
        expect(Array.isArray(mockPokemon.stats)).toBe(true)
        expect(Array.isArray(mockPokemon.types)).toBe(true)
    })

    it('should have valid stat structure', () => {
        expect(mockPokemon.stats).toHaveLength(6)

        mockPokemon.stats.forEach(stat => {
            expect(stat).toHaveProperty('name')
            expect(stat).toHaveProperty('baseStat')
            expect(typeof stat.name).toBe('string')
            expect(typeof stat.baseStat).toBe('number')
        })
    })

    it('should have at least one type', () => {
        expect(mockPokemon.types.length).toBeGreaterThan(0)
        mockPokemon.types.forEach(type => {
            expect(typeof type).toBe('string')
        })
    })

    it('should handle optional properties', () => {
        const minimalPokemon: Pokemon = {
            id: 1,
            pokeApiId: 1,
            name: 'bulbasaur',
            height: 7,
            weight: 69,
            stats: [],
            types: ['grass', 'poison']
        }

        expect(minimalPokemon.isCaught).toBeUndefined()
        expect(minimalPokemon.caughtAt).toBeUndefined()
        expect(minimalPokemon.imageUrl).toBeUndefined()
        expect(minimalPokemon.baseExperience).toBeUndefined()
    })

    it('should handle caught Pokemon properties', () => {
        const caughtPokemon: Pokemon = {
            ...mockPokemon,
            isCaught: true,
            caughtAt: '2025-01-01T00:00:00.000Z'
        }

        expect(caughtPokemon.isCaught).toBe(true)
        expect(typeof caughtPokemon.caughtAt).toBe('string')
    })
})
