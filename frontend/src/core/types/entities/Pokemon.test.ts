import { describe, it, expect } from 'vitest'
import type { Pokemon } from './Pokemon'

describe('Pokemon Entity', () => {
    const mockPokemon: Pokemon = {
        id: 1,
        pokeApiId: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        hp: 35,
        attack: 55,
        defense: 40,
        specialAttack: 50,
        specialDefense: 50,
        speed: 90,
        types: ['electric'],
        spriteUrl: 'https://example.com/pikachu-sprite.png',
        officialArtworkUrl: 'https://example.com/pikachu-artwork.png',
        isCaught: false,
        firstAddedToPokedex: '2025-01-01T00:00:00.000Z'
    }

    it('should have required properties', () => {
        expect(mockPokemon).toHaveProperty('id')
        expect(mockPokemon).toHaveProperty('pokeApiId')
        expect(mockPokemon).toHaveProperty('name')
        expect(mockPokemon).toHaveProperty('height')
        expect(mockPokemon).toHaveProperty('weight')
        expect(mockPokemon).toHaveProperty('hp')
        expect(mockPokemon).toHaveProperty('attack')
        expect(mockPokemon).toHaveProperty('defense')
        expect(mockPokemon).toHaveProperty('specialAttack')
        expect(mockPokemon).toHaveProperty('specialDefense')
        expect(mockPokemon).toHaveProperty('speed')
        expect(mockPokemon).toHaveProperty('types')
        expect(mockPokemon).toHaveProperty('spriteUrl')
        expect(mockPokemon).toHaveProperty('officialArtworkUrl')
        expect(mockPokemon).toHaveProperty('isCaught')
        expect(mockPokemon).toHaveProperty('firstAddedToPokedex')
    })

    it('should have correct types for properties', () => {
        expect(typeof mockPokemon.id).toBe('number')
        expect(typeof mockPokemon.pokeApiId).toBe('number')
        expect(typeof mockPokemon.name).toBe('string')
        expect(typeof mockPokemon.height).toBe('number')
        expect(typeof mockPokemon.weight).toBe('number')
        expect(typeof mockPokemon.hp).toBe('number')
        expect(typeof mockPokemon.attack).toBe('number')
        expect(typeof mockPokemon.defense).toBe('number')
        expect(typeof mockPokemon.specialAttack).toBe('number')
        expect(typeof mockPokemon.specialDefense).toBe('number')
        expect(typeof mockPokemon.speed).toBe('number')
        expect(Array.isArray(mockPokemon.types)).toBe(true)
        expect(typeof mockPokemon.spriteUrl).toBe('string')
        expect(typeof mockPokemon.officialArtworkUrl).toBe('string')
        expect(typeof mockPokemon.isCaught).toBe('boolean')
        expect(typeof mockPokemon.firstAddedToPokedex).toBe('string')
    })

    it('should have valid stat values', () => {
        expect(mockPokemon.hp).toBeGreaterThanOrEqual(0)
        expect(mockPokemon.attack).toBeGreaterThanOrEqual(0)
        expect(mockPokemon.defense).toBeGreaterThanOrEqual(0)
        expect(mockPokemon.specialAttack).toBeGreaterThanOrEqual(0)
        expect(mockPokemon.specialDefense).toBeGreaterThanOrEqual(0)
        expect(mockPokemon.speed).toBeGreaterThanOrEqual(0)
    })

    it('should have at least one type', () => {
        expect(mockPokemon.types.length).toBeGreaterThan(0)
        mockPokemon.types.forEach(type => {
            expect(typeof type).toBe('string')
        })
    })

    it('should handle caught Pokemon correctly', () => {
        const caughtPokemon: Pokemon = {
            ...mockPokemon,
            isCaught: true
        }

        expect(caughtPokemon.isCaught).toBe(true)
    })

    it('should have valid URLs', () => {
        expect(mockPokemon.spriteUrl).toMatch(/^https?:\/\//)
        expect(mockPokemon.officialArtworkUrl).toMatch(/^https?:\/\//)
    })

    it('should have valid firstAddedToPokedex date format', () => {
        expect(mockPokemon.firstAddedToPokedex).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(new Date(mockPokemon.firstAddedToPokedex)).toBeInstanceOf(Date)
    })
})
