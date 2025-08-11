import React, { useState } from 'react';
import { useAppStore } from '../../../stores';
import { usePokemonStore } from '../stores/pokemonStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { PokemonGrid } from '../components/PokemonGrid';
import { PokemonTable } from '../components/PokemonTable';
import { PokemonFiltersComponent } from '../components/PokemonFilters';
import type { PokemonFilters } from '../../../core/interfaces';

type ViewMode = 'grid' | 'table';

export const HomePage: React.FC = () => {
    const [filters, setFilters] = useState<PokemonFilters>({
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    });
    const [selectedPokemonIds, setSelectedPokemonIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const isOnline = useAppStore(state => state.isOnline);
    const { setFilters: setStoreFilters, getFilteredPokemon } = usePokemonStore();
    const { isAuthenticated } = useAuthStore();

    const handleFiltersChange = (newFilters: Partial<PokemonFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        setStoreFilters(updatedFilters);
    };

    const handleClearFilters = () => {
        const defaultFilters: PokemonFilters = {
            sortBy: 'pokeApiId',
            sortOrder: 'asc'
        };
        setFilters(defaultFilters);
        setStoreFilters(defaultFilters);
    };

    const handlePokemonSelect = (pokemonId: number) => {
        setSelectedPokemonIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pokemonId)) {
                newSet.delete(pokemonId);
            } else {
                newSet.add(pokemonId);
            }
            return newSet;
        });
    };

    const handleBulkCatch = async () => {
        if (!isAuthenticated || selectedPokemonIds.size === 0) return;

        // TODO: Implement bulk catch logic
        console.log('Catching Pokemon:', Array.from(selectedPokemonIds));

        // Clear selection after catching
        setSelectedPokemonIds(new Set());
    };

    const handleExportCSV = () => {
        const filteredPokemon = getFilteredPokemon(filters);

        // Export selected Pokemon if any are selected, otherwise export all filtered Pokemon
        const pokemonToExport = selectedPokemonIds.size > 0
            ? filteredPokemon.filter(p => selectedPokemonIds.has(p.pokeApiId))
            : filteredPokemon;

        const headers = [
            'ID', 'Name', 'Type 1', 'Type 2', 'Height (m)', 'Weight (kg)',
            'Base Experience', 'HP', 'Attack', 'Defense', 'Special Attack',
            'Special Defense', 'Speed', 'Total Stats', 'Caught', 'Catch Date'
        ];

        const rows = pokemonToExport.map(pokemon => [
            pokemon.pokeApiId,
            pokemon.name,
            pokemon.types?.[0] || '',
            pokemon.types?.[1] || '',
            pokemon.height ? (pokemon.height / 10).toFixed(1) : '',
            pokemon.weight ? (pokemon.weight / 10).toFixed(1) : '',
            pokemon.baseExperience || '',
            pokemon.hp || '',
            pokemon.attack || '',
            pokemon.defense || '',
            pokemon.specialAttack || '',
            pokemon.specialDefense || '',
            pokemon.speed || '',
            (pokemon.hp || 0) + (pokemon.attack || 0) + (pokemon.defense || 0) +
            (pokemon.specialAttack || 0) + (pokemon.specialDefense || 0) + (pokemon.speed || 0) || '',
            pokemon.isCaught ? 'Yes' : 'No',
            pokemon.caughtAt ? new Date(pokemon.caughtAt).toLocaleDateString() : ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        const filename = selectedPokemonIds.size > 0
            ? `pokemon_selection_${selectedPokemonIds.size}.csv`
            : 'pokemon_data.csv';
        link.setAttribute('download', filename);

        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            <PokemonFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
            />

            {/* View Mode Controls */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Table View
                    </button>
                </div>

                <div className="flex gap-3">
                    {selectedPokemonIds.size > 0 && (
                        <button
                            onClick={handleBulkCatch}
                            disabled={!isAuthenticated}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isAuthenticated
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Catch ({selectedPokemonIds.size})
                        </button>
                    )}

                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        {selectedPokemonIds.size > 0
                            ? `Export Selection (${selectedPokemonIds.size})`
                            : 'Export CSV'
                        }
                    </button>
                </div>
            </div>

            {/* Pokemon Grid Component handles all the fetching and display logic */}
            {viewMode === 'grid' ? (
                <PokemonGrid
                    customFilters={filters}
                    selectedPokemonIds={selectedPokemonIds}
                    onPokemonSelect={handlePokemonSelect}
                />
            ) : (
                <PokemonTable
                    pokemon={getFilteredPokemon(filters)}
                    selectedPokemonIds={selectedPokemonIds}
                    onPokemonSelect={handlePokemonSelect}
                    sortBy={filters.sortBy}
                    onSort={(sortBy) => handleFiltersChange({ sortBy })}
                />
            )}

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
