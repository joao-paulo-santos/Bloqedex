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
        baseExperience: 112,
        stats: [
            { name: 'hp', baseStat: 35 },
            { name: 'attack', baseStat: 55 }
        ],
        types: ['electric'],
        imageUrl: 'https://example.com/pikachu.png',
        spriteUrl: 'https://example.com/pikachu-sprite.png'
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

    it('should render Pokemon image when imageUrl is provided', () => {
        render(<PokemonCard pokemon={mockPokemon} />)

        const image = screen.getByRole('img', { name: /pikachu/i })
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', mockPokemon.spriteUrl)
    })

    it('should render fallback image when imageUrl is not provided', () => {
        const pokemonWithoutImage = { ...mockPokemon, imageUrl: undefined }
        render(<PokemonCard pokemon={pokemonWithoutImage} />)

        const image = screen.getByRole('img', { name: /pikachu/i })
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', mockPokemon.spriteUrl)
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
