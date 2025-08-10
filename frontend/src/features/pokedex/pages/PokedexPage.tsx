import React, { useState, useEffect } from 'react';
import { usePokedexStore } from '../stores/pokedexStore';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { SearchIcon } from '../../../components/common/Icons';

export const PokedexPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'favorites' | 'recent'>('all');

    const {
        caughtPokemon,
        isLoading,
        error,
        fetchCaughtPokemon
    } = usePokedexStore();

    useEffect(() => {
        fetchCaughtPokemon();
    }, [fetchCaughtPokemon]);

    const filteredPokemon = caughtPokemon.filter(caughtPoke => {
        const matchesSearch = caughtPoke.pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            caughtPoke.pokemon.id.toString().includes(searchTerm) ||
            (caughtPoke.nickname && caughtPoke.nickname.toLowerCase().includes(searchTerm.toLowerCase()));

        if (filterType === 'favorites') {
            return matchesSearch && caughtPoke.isFavorite;
        }

        return matchesSearch;
    });

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Pokedex</h1>
                <p className="mt-2 text-gray-600">
                    View and manage your caught Pokemon collection
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search your Pokemon..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100 rounded-md p-1">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'all'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            All ({caughtPokemon.length})
                        </button>
                        <button
                            onClick={() => setFilterType('favorites')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterType === 'favorites'
                                    ? 'bg-white text-red-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            ♥ Favorites ({caughtPokemon.filter(p => p.isFavorite).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Pokemon Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : filteredPokemon.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600 text-lg">
                        {searchTerm
                            ? `No Pokemon found matching "${searchTerm}"`
                            : filterType === 'favorites'
                                ? "No favorite Pokemon yet. Mark some Pokemon as favorites!"
                                : "Your Pokedex is empty. Start catching Pokemon to build your collection!"
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPokemon.map(caughtPoke => (
                        <div key={caughtPoke.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-500 mb-1">#{caughtPoke.pokemon.id}</div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {caughtPoke.nickname || caughtPoke.pokemon.name}
                                </h3>
                                {caughtPoke.nickname && (
                                    <div className="text-sm text-gray-500 mb-2">
                                        ({caughtPoke.pokemon.name})
                                    </div>
                                )}
                                <div className="text-sm text-gray-600">
                                    Caught: {new Date(caughtPoke.caughtAt).toLocaleDateString()}
                                </div>
                                {caughtPoke.isFavorite && (
                                    <div className="text-red-500 text-lg mt-2">♥</div>
                                )}
                                {caughtPoke.notes && (
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                                        {caughtPoke.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
