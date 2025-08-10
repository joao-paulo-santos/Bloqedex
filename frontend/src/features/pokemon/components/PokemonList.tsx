import React, { useEffect } from 'react';
import type { Pokemon } from '../../../core/entities';
import { usePokemonStore } from '../stores/pokemonStore';
import { usePokedexStore } from '../../pokedex';
import { PokemonCard } from './PokemonCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export const PokemonList: React.FC = () => {
    const {
        pokemon,
        isLoading,
        error,
        filters,
        pagination,
        fetchPokemon,
        setFilters,
        setPage
    } = usePokemonStore();

    const { catchPokemon } = usePokedexStore();

    useEffect(() => {
        fetchPokemon();
    }, [fetchPokemon, filters, pagination.currentPage]);

    const handleCatchPokemon = async (pokemonId: number) => {
        try {
            await catchPokemon(pokemonId);
        } catch (error) {
            console.error('Failed to catch Pokemon:', error);
        }
    };

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters({ ...filters, ...newFilters });
    };

    const handlePageChange = (page: number) => {
        setPage(page);
    };

    if (isLoading && pokemon.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorMessage
                message={error}
                onRetry={() => fetchPokemon()}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                            Search Pokemon
                        </label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Enter Pokemon name..."
                            value={filters.name || ''}
                            onChange={(e) => handleFilterChange({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="caughtFilter" className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Status
                        </label>
                        <select
                            id="caughtFilter"
                            value={filters.caughtOnly ? 'caught' : 'all'}
                            onChange={(e) => handleFilterChange({
                                caughtOnly: e.target.value === 'caught' ? true : undefined
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Pokemon</option>
                            <option value="caught">Caught Only</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                            Sort By
                        </label>
                        <select
                            id="sortBy"
                            value={filters.sortBy || 'pokeApiId'}
                            onChange={(e) => handleFilterChange({
                                sortBy: e.target.value as 'name' | 'height' | 'weight' | 'caughtAt' | 'pokeApiId'
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pokeApiId">Pokedex Number</option>
                            <option value="name">Name</option>
                            <option value="height">Height</option>
                            <option value="weight">Weight</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pokemon Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {pokemon.map((p: Pokemon) => (
                    <PokemonCard
                        key={p.id}
                        pokemon={p}
                        onCatch={() => handleCatchPokemon(p.id)}
                        showCatchButton={!p.isCaught}
                    />
                ))}
            </div>

            {/* Loading indicator for pagination */}
            {isLoading && pokemon.length > 0 && (
                <div className="flex justify-center py-4">
                    <LoadingSpinner />
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 py-6">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <span className="px-4 py-2 text-sm text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* No results */}
            {pokemon.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No Pokemon found</p>
                    {filters.name && (
                        <button
                            onClick={() => setFilters({ ...filters, name: '' })}
                            className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
