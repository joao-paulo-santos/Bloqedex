import React, { useEffect, useState } from 'react';
import { usePokemonStore } from '../stores/pokemonStore';
import { PokemonCard } from './PokemonCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyPokemonState } from './EmptyPokemonState';
import type { Pokemon, PokemonFilters } from '../../../core/types';

interface PokemonGridProps {
    customFilters?: Partial<PokemonFilters>;
    selectedPokemonIds?: Set<number>;
    onPokemonSelect?: (pokemonId: number) => void;
}

export const PokemonGrid: React.FC<PokemonGridProps> = ({
    customFilters = {},
    selectedPokemonIds = new Set(),
    onPokemonSelect
}) => {
    const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon[]>([]);

    const {
        pokemonMap,
        getFilteredPokemon,
        isLoading,
        error,
        clearError
    } = usePokemonStore();

    const isOnline = usePokemonStore(state => state.isOnline);

    useEffect(() => {
        // Get filtered Pokemon array from store using custom filters
        const filtered = getFilteredPokemon(customFilters);
        setDisplayedPokemon(filtered);
    }, [pokemonMap, getFilteredPokemon, customFilters]);

    // Error state when no Pokemon and there's an error
    if (error && pokemonMap.size === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                    <p className="text-lg font-medium">
                        {!isOnline ? 'No Pokémon Data Available Offline' : 'Error Loading Pokémon'}
                    </p>
                    <p className="text-sm mt-2">
                        {!isOnline
                            ? 'Connect to the internet and refresh to load Pokémon data for offline viewing.'
                            : error
                        }
                    </p>
                </div>
                <button
                    onClick={clearError}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Loading state when no Pokemon
    if (isLoading && pokemonMap.size === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Empty state - when no Pokemon to display
    if (!isLoading && displayedPokemon.length === 0) {
        return (
            <EmptyPokemonState />
        );
    }

    // Pokemon grid
    return (
        <>
            {/* Error banner when there's cached data */}
            {error && pokemonMap.size > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Limited connectivity:</strong> Showing cached data. Some information may be outdated.
                            </p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={clearError}
                                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Results count */}
            <div className="flex justify-between items-center text-sm text-gray-600 mb-6">
                <div>
                    {isLoading ? (
                        'Loading Pokémon...'
                    ) : (
                        <>
                            Showing {displayedPokemon.length} of {pokemonMap.size} Pokémon
                            {!isOnline && pokemonMap.size > 0 && (
                                <span className="text-yellow-600"> (cached data)</span>
                            )}
                        </>
                    )}
                </div>
                {!isOnline && (
                    <div className="flex items-center text-yellow-600">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Offline Mode
                    </div>
                )}
            </div>

            {/* Pokemon grid */}
            {displayedPokemon.length > 0 && (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayedPokemon.map((pokemon) => (
                        <PokemonCard
                            key={pokemon.pokeApiId}
                            pokemon={pokemon}
                            className="h-full"
                            sortBy={customFilters.sortBy}
                            isSelected={selectedPokemonIds.has(pokemon.pokeApiId)}
                            onSelect={onPokemonSelect ? () => onPokemonSelect(pokemon.pokeApiId) : undefined}
                        />
                    ))}
                </div>
            )}
        </>
    );
};
