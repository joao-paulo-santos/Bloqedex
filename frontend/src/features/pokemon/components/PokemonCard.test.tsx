import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PokemonCard } from './PokemonCard'
import type { Pokemon } from '../../../core/entities'

// Mock Zustand stores
vi.mock('../../../stores', () => ({
    useAuthStore: () => ({
        isAuthenticated: false,
        user: null
    }),
    useAppStore: () => ({
        isOnline: true
    })
}))

vi.mock('../../pokedex/stores/pokedexStore', () => ({
    usePokedexStore: () => ({
        caughtPokemon: new Map(),
        toggleCatch: vi.fn(),
        getCaughtPokemon: vi.fn(() => undefined),
        addNote: vi.fn()
    })
}))

describe('PokemonCard Component', () => {
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

    it('should render Pokemon name', () => {
        render(<PokemonCard pokemon={mockPokemon} />)

        expect(screen.getByText('Pikachu')).toBeInTheDocument()
    })

    it('should render Pokemon ID', () => {
        render(<PokemonCard pokemon={mockPokemon} />)

        expect(screen.getByText('#025')).toBeInTheDocument()
    })

    it('should render Pokemon types', () => {
        render(<PokemonCard pokemon={mockPokemon} />)

        expect(screen.getByText('Electric')).toBeInTheDocument()
    })

    it('should render Pokemon image', () => {
        render(<PokemonCard pokemon={mockPokemon} />)

        const image = screen.getByRole('img', { name: /pikachu/i })
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', mockPokemon.spriteUrl)
    })

    it('should render fallback image when spriteUrl is not provided', () => {
        const pokemonWithoutSprite = { ...mockPokemon, spriteUrl: '' }
        render(<PokemonCard pokemon={pokemonWithoutSprite} />)

        const image = screen.getByRole('img', { name: /pikachu/i })
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', mockPokemon.officialArtworkUrl)
    })

    it('should handle Pokemon with multiple types', () => {
        const multiTypePokemon = {
            ...mockPokemon,
            types: ['grass', 'poison']
        }

        render(<PokemonCard pokemon={multiTypePokemon} />)

        expect(screen.getByText('Grass')).toBeInTheDocument()
        expect(screen.getByText('Poison')).toBeInTheDocument()
    })
})
