import React, { useState, useEffect, useRef } from 'react';
import { useCaughtPokemon } from '../stores/pokedexStore';
import { usePokemonStore } from '../../pokemon/stores/pokemonStore';
import { CaughtPokemonFiltersComponent } from '../components/CaughtPokemonFilters';
import { PokedexProgress } from '../components/PokedexProgress';
import { PokedexTable } from '../components/PokedexTable';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { EmptyPokemonState } from '../../pokemon/components/EmptyPokemonState';
import { PokedexPokemonCard } from '../components/PokedexPokemonCard';
import type { CaughtPokemonFilters } from '../../../core/types';

type ViewMode = 'grid' | 'table';

export const PokedexPage: React.FC = () => {
    const [filters, setFilters] = useState<CaughtPokemonFilters>({
        sortBy: 'pokeApiId',
        sortOrder: 'asc'
    });
    const [selectedPokemonIds, setSelectedPokemonIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const stickyControlsRef = useRef<HTMLDivElement>(null);

    const {
        caughtPokemon,
        filteredPokemon,
        isLoading,
        error,
        loadCaughtPokemon,
        toggleFavorite,
        releaseBulkPokemon,
        updateCaughtPokemon,
        applyFilters
    } = useCaughtPokemon();
    const { updatePokemonCaughtStatus } = usePokemonStore();

    useEffect(() => {
        loadCaughtPokemon();
    }, [loadCaughtPokemon]);

    const handleFiltersChange = (newFilters: Partial<CaughtPokemonFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        applyFilters(updatedFilters);
    };

    const handleClearFilters = () => {
        const defaultFilters: CaughtPokemonFilters = {
            sortBy: 'pokeApiId',
            sortOrder: 'asc'
        };
        setFilters(defaultFilters);
        applyFilters(defaultFilters);
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

    const handleBulkRelease = async () => {
        if (selectedPokemonIds.size === 0) return;

        try {
            // Get the Pokemon IDs that will be released (we need their pokeApiIds for the Pokemon store)
            const pokemonToRelease = Array.from(selectedPokemonIds).map(id => {
                const caughtPokemon = filteredPokemon.find(cp => cp.id === id);
                return caughtPokemon;
            }).filter(Boolean);

            // Release all selected Pokemon at once
            await releaseBulkPokemon(Array.from(selectedPokemonIds));

            // Update the Pokemon store to reflect that these Pokemon are no longer caught
            pokemonToRelease.forEach(caughtPokemon => {
                if (caughtPokemon) {
                    updatePokemonCaughtStatus(caughtPokemon.pokemon.pokeApiId, false);
                }
            });

            // Clear selection after releasing
            setSelectedPokemonIds(new Set());
        } catch (error) {
            console.error('Failed to release selected Pokemon:', error);
        }
    };

    const handleSingleRelease = async (caughtPokemonId: number) => {
        try {
            const caughtPokemon = filteredPokemon.find(cp => cp.id === caughtPokemonId);
            if (!caughtPokemon) return;

            await releaseBulkPokemon([caughtPokemonId]);

            updatePokemonCaughtStatus(caughtPokemon.pokemon.pokeApiId, false);
        } catch (error) {
            console.error('Failed to release Pokemon:', error);
        }
    };

    const handleUpdatePokemon = async (caughtPokemonId: number, updates: { notes?: string; isFavorite?: boolean }) => {
        try {
            await updateCaughtPokemon(caughtPokemonId, updates);
        } catch (error) {
            console.error('Failed to update Pokemon:', error);
        }
    };

    const handleExportCSV = () => {
        // Export selected Pokemon if any are selected, otherwise export all filtered Pokemon
        const pokemonToExport = selectedPokemonIds.size > 0
            ? filteredPokemon.filter(p => selectedPokemonIds.has(p.id))
            : filteredPokemon;

        const headers = [
            'Caught Pokemon ID',
            'Pokemon Name',
            'PokeAPI ID',
            'Types',
            'Height',
            'Weight',
            'HP',
            'Attack',
            'Defense',
            'Special Attack',
            'Special Defense',
            'Speed',
            'Total Stats',
            'Caught Date',
            'First Added to Pokedex',
            'Is Favorite',
            'Notes',
            'Sprite URL',
            'Official Artwork URL'
        ];

        const rows = pokemonToExport.map(caughtPokemon => {
            const pokemon = caughtPokemon.pokemon;
            const totalStats = pokemon.hp + pokemon.attack + pokemon.defense +
                pokemon.specialAttack + pokemon.specialDefense + pokemon.speed;

            return [
                caughtPokemon.id,
                pokemon.name,
                pokemon.pokeApiId,
                pokemon.types.join(', '),
                pokemon.height,
                pokemon.weight,
                pokemon.hp,
                pokemon.attack,
                pokemon.defense,
                pokemon.specialAttack,
                pokemon.specialDefense,
                pokemon.speed,
                totalStats,
                new Date(caughtPokemon.caughtDate).toLocaleDateString(),
                new Date(pokemon.firstAddedToPokedex).toLocaleDateString(),
                caughtPokemon.isFavorite ? 'Yes' : 'No',
                caughtPokemon.notes || '',
                pokemon.spriteUrl,
                pokemon.officialArtworkUrl
            ];
        });

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

    // Track scroll position to show/hide back to top button
    useEffect(() => {
        const handleScroll = () => {
            if (stickyControlsRef.current) {
                const rect = stickyControlsRef.current.getBoundingClientRect();
                // Show back to top button when sticky controls are stuck (top position equals navbar height)
                setShowBackToTop(rect.top <= 64); // 64px is the navbar height (h-16)
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Your Pokédex
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                    View and manage your caught Pokémon collection. Track favorites, add notes, and export your data.
                </p>
            </div>

            {/* Progress Bar and Stats */}
            <PokedexProgress />

            {/* Search and Filters */}
            <CaughtPokemonFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
            />

            {/* View Mode Controls - Sticky */}
            <div
                ref={stickyControlsRef}
                className="sticky top-16 z-40 py-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all duration-200"
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
                                onClick={handleBulkRelease}
                                className="px-6 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                            >
                                Release ({selectedPokemonIds.size})
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

            {/* Content based on loading/error states */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <ErrorMessage message={error} />
                </div>
            ) : filteredPokemon.length === 0 ? (
                <EmptyPokemonState
                    title={caughtPokemon.length === 0
                        ? "You haven't caught any Pokémon yet!"
                        : "No Pokémon match your current filters."
                    }
                    subtitle={caughtPokemon.length === 0
                        ? "Start catching Pokémon to build your collection!"
                        : undefined
                    }
                    showHint={caughtPokemon.length > 0}
                />
            ) : (
                <div className="space-y-6">
                    {/* Results count */}
                    <div className="text-sm text-gray-600">
                        Showing {filteredPokemon.length} of {caughtPokemon.length} caught Pokémon
                    </div>

                    {/* Pokemon Grid/List */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredPokemon.map((caughtPokemon) => (
                                <PokedexPokemonCard
                                    key={caughtPokemon.id}
                                    pokemon={caughtPokemon.pokemon}
                                    className="h-full"
                                    onRelease={() => handleSingleRelease(caughtPokemon.id)}
                                    isSelected={selectedPokemonIds.has(caughtPokemon.id)}
                                    onSelect={() => handlePokemonSelect(caughtPokemon.id)}
                                    sortBy={filters.sortBy}
                                    caughtDate={caughtPokemon.caughtDate}
                                    notes={caughtPokemon.notes}
                                    isFavorite={caughtPokemon.isFavorite}
                                    onToggleFavorite={() => toggleFavorite(caughtPokemon.id)}
                                    onUpdatePokemon={(updates) => handleUpdatePokemon(caughtPokemon.id, updates)}
                                />
                            ))}
                        </div>
                    ) : (
                        <PokedexTable
                            caughtPokemon={filteredPokemon}
                            selectedPokemonIds={selectedPokemonIds}
                            onPokemonSelect={(pokemonId) => {
                                // Find the caught pokemon with this pokemon ID
                                const caughtPokemon = filteredPokemon.find(cp => cp.pokemon.pokeApiId === pokemonId);
                                if (caughtPokemon) {
                                    handlePokemonSelect(caughtPokemon.id);
                                }
                            }}
                            onToggleFavorite={toggleFavorite}
                            onRelease={handleSingleRelease}
                            onUpdatePokemon={updateCaughtPokemon}
                            sortBy={filters.sortBy}
                            sortOrder={filters.sortOrder}
                            onSort={(sortBy, sortOrder) => handleFiltersChange({ sortBy, sortOrder })}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default PokedexPage;
