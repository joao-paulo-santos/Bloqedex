import React, { useState } from 'react';
import { useAppStore } from '../../../stores';
import { PokemonGrid } from '../components/PokemonGrid';
import { SearchIcon, FilterIcon } from '../../../components/common/Icons';

export const HomePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    const isOnline = useAppStore(state => state.isOnline);

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

    return (
        <>
            {/* Hero Section */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Discover All Pokémon
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                    Explore the complete Pokédex with detailed information about every Pokémon.
                    Register to track your caught Pokémon and add personal notes.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
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
            </div>

            {/* Pokemon Grid Component handles all the fetching and display logic */}
            <PokemonGrid
                searchTerm={searchTerm}
                typeFilter={typeFilter}
                showAllPokemon={true}
            />

            {/* Call to Action */}
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
        </>
    );
};
