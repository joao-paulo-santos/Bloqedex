import React, { useState, useEffect, useRef } from 'react';
import { usePokemonStore } from '../stores/pokemonStore';
import { useAuthStore } from '../../auth/stores/authStore';
import { usePokedexStore } from '../../pokedex/stores/pokedexStore';
import { PokemonGrid } from '../components/PokemonGrid';
import { PokemonTable } from '../components/PokemonTable';
import { PokemonFiltersComponent } from '../components/PokemonFilters';
import { toastEvents } from '../../../common/utils/eventBus';
import type { PokemonFilters } from '../../../core/types';

type ViewMode = 'grid' | 'table';

export const HomePage: React.FC = () => {
    const [filters, setFilters] = useState<PokemonFilters>({
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    });
    const [selectedPokemonIds, setSelectedPokemonIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isCatchingPokemon, setIsCatchingPokemon] = useState(false);
    const stickyControlsRef = useRef<HTMLDivElement>(null);

    const { setFilters: setStoreFilters, getFilteredPokemon, updatePokemonCaughtStatus } = usePokemonStore();
    const { isAuthenticated } = useAuthStore();
    const { catchBulkPokemon } = usePokedexStore();

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

        const allSelectedIds = Array.from(selectedPokemonIds);

        const uncaughtIds = allSelectedIds.filter(pokemonId => {
            const pokemon = getFilteredPokemon().find(p => p.pokeApiId === pokemonId);
            return pokemon && !pokemon.isCaught;
        });

        const alreadyCaughtCount = allSelectedIds.length - uncaughtIds.length;

        if (uncaughtIds.length === 0) {
            toastEvents.showInfo('All selected Pokemon are already caught!');
            return;
        }

        if (alreadyCaughtCount > 0) {
            toastEvents.showInfo(`${alreadyCaughtCount} Pokemon were already caught and will be skipped.`);
        }

        setIsCatchingPokemon(true);

        try {
            await catchBulkPokemon(uncaughtIds);

            uncaughtIds.forEach(pokemonId => {
                updatePokemonCaughtStatus(pokemonId, true);
            });

            setSelectedPokemonIds(new Set());

            if (alreadyCaughtCount > 0) {
                toastEvents.showSuccess(`Successfully caught ${uncaughtIds.length} new Pokemon! (${alreadyCaughtCount} were already caught)`);
            } else {
                toastEvents.showSuccess(`Successfully caught ${uncaughtIds.length} Pokemon!`);
            }

        } catch (error) {
            console.error('Failed to catch Pokemon:', error);
            toastEvents.showError('Failed to catch some Pokemon. Please try again.');
        } finally {
            setIsCatchingPokemon(false);
        }
    };

    const getUncaughtSelectedCount = () => {
        const allSelectedIds = Array.from(selectedPokemonIds);
        return allSelectedIds.filter(pokemonId => {
            const pokemon = getFilteredPokemon().find(p => p.pokeApiId === pokemonId);
            return pokemon && !pokemon.isCaught;
        }).length;
    };

    const getCatchButtonText = () => {
        if (isCatchingPokemon) return 'Catching...';

        const uncaughtCount = getUncaughtSelectedCount();
        const totalSelected = selectedPokemonIds.size;

        if (uncaughtCount === totalSelected) {
            return `Catch (${uncaughtCount})`;
        } else if (uncaughtCount === 0) {
            return `All Selected Already Caught (${totalSelected})`;
        } else {
            return `Catch ${uncaughtCount} (${totalSelected - uncaughtCount} already caught)`;
        }
    };

    const handleExportCSV = () => {
        const filteredPokemon = getFilteredPokemon(filters);

        // Export selected Pokemon if any are selected, otherwise export all filtered Pokemon
        const pokemonToExport = selectedPokemonIds.size > 0
            ? filteredPokemon.filter(p => selectedPokemonIds.has(p.pokeApiId))
            : filteredPokemon;

        const headers = [
            'ID', 'Name', 'Type 1', 'Type 2', 'Height (m)', 'Weight (kg)',
            'HP', 'Attack', 'Defense', 'Special Attack',
            'Special Defense', 'Speed', 'Total Stats', 'Caught'
        ];

        const rows = pokemonToExport.map(pokemon => [
            pokemon.pokeApiId,
            pokemon.name,
            pokemon.types?.[0] || '',
            pokemon.types?.[1] || '',
            pokemon.height ? (pokemon.height / 10).toFixed(1) : '',
            pokemon.weight ? (pokemon.weight / 10).toFixed(1) : '',
            pokemon.hp || '',
            pokemon.attack || '',
            pokemon.defense || '',
            pokemon.specialAttack || '',
            pokemon.specialDefense || '',
            pokemon.speed || '',
            (pokemon.hp || 0) + (pokemon.attack || 0) + (pokemon.defense || 0) +
            (pokemon.specialAttack || 0) + (pokemon.specialDefense || 0) + (pokemon.speed || 0) || '',
            pokemon.isCaught ? 'Yes' : 'No'
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

    useEffect(() => {
        const handleScroll = () => {
            if (stickyControlsRef.current) {
                const rect = stickyControlsRef.current.getBoundingClientRect();
                setShowBackToTop(rect.top <= 64);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

            {/* View Mode Controls*/}
            <div
                ref={stickyControlsRef}
                className="sticky top-16 z-40 py-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            >
                <div className="flex justify-between items-center">
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
                                disabled={!isAuthenticated || isCatchingPokemon || getUncaughtSelectedCount() === 0}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${isAuthenticated && !isCatchingPokemon && getUncaughtSelectedCount() > 0
                                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {getCatchButtonText()}
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

                        {showBackToTop && (
                            <button
                                onClick={scrollToTop}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
                                title="Back to top"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                                Top
                            </button>
                        )}
                    </div>
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
        </>
    );
};
