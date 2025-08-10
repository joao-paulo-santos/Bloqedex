import React, { useEffect, useState } from 'react';
import { usePokemonStore } from '../stores/pokemonStore';
import { useAppStore } from '../../../stores';
import { PokemonCard } from '../components/PokemonCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { SearchIcon, FilterIcon } from '../../../components/common/Icons';
import type { Pokemon } from '../../../core/entities';

export const HomePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon[]>([]);

    const {
        pokemon,
        isLoading,
        error,
        fetchPokemon,
        clearError
    } = usePokemonStore();

    const isOnline = useAppStore(state => state.isOnline);

    useEffect(() => {
        fetchPokemon();
    }, [fetchPokemon]);

    useEffect(() => {
        let filtered = pokemon;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.pokeApiId.toString().includes(searchTerm)
            );
        }

        if (typeFilter) {
            filtered = filtered.filter(p =>
                p.types.some(type => type.name.toLowerCase() === typeFilter.toLowerCase())
            );
        }

        setDisplayedPokemon(filtered);
    }, [pokemon, searchTerm, typeFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
    };

    const pokemonTypes = [
        'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
        'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon',
        'dark', 'fairy'
    ];

    if (error && pokemon.length === 0) {
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

    return (
        <>
            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-yellow-50 border-b border-yellow-200 -mx-4 sm:-mx-6 lg:-mx-8 mb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Offline Mode:</strong> You're viewing cached Pokémon data. Some features may be limited until connection is restored.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Discover All Pokémon
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                    Explore the complete Pokédex with detailed information about every Pokémon.
                    Register to track your caught Pokémon and add personal notes.
                </p>
            </div>                {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                {/* Error Banner for when there's an error but cached data exists */}
                {error && pokemon.length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
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

                <form onSubmit={handleSearch} className="mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="sm:w-48">
                            <div className="relative">
                                <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                >
                                    <option value="">All Types</option>
                                    {pokemonTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(searchTerm || typeFilter) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </form>

                {/* Results Count */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <div>
                        {isLoading ? (
                            'Loading Pokémon...'
                        ) : (
                            <>
                                Showing {displayedPokemon.length} of {pokemon.length} Pokémon
                                {!isOnline && pokemon.length > 0 && (
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
            </div>

            {/* Loading State */}
            {isLoading && pokemon.length === 0 && (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {/* Pokemon Grid */}
            {!isLoading && displayedPokemon.length === 0 && pokemon.length > 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        No Pokémon found matching your criteria.
                    </p>
                    <button
                        onClick={clearFilters}
                        className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {displayedPokemon.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayedPokemon.map((pokemon) => (
                        <div key={pokemon.id} className="relative">
                            <PokemonCard
                                pokemon={pokemon}
                                className="h-full"
                            />
                            {/* Overlay for login prompt */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
                                <div className="bg-white rounded-lg p-4 shadow-lg text-center">
                                    <p className="text-sm text-gray-600">
                                        Want to track this Pokémon?
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Use the floating button to register!
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Call to Action */}
            {!isLoading && displayedPokemon.length > 0 && (
                <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Ready to Start Your Journey?
                    </h3>
                    <p className="text-gray-600">
                        Register to track your caught Pokémon, add personal notes, and build your own Pokédex collection.
                        {!isOnline && (
                            <span className="block mt-2 text-yellow-700">
                                <strong>Note:</strong> Registration requires an internet connection.
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-500 mt-4">
                        Register or login to track your Pokemon collection!
                    </p>
                </div>
            )}
        </>
    );
};
