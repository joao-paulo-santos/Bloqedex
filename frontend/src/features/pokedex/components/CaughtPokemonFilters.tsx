import React from 'react';
import { SearchIcon, FilterIcon } from '../../../components/common/Icons';
import type { CaughtPokemonFilters } from '../../../core/types';

interface CaughtPokemonFiltersProps {
    filters: CaughtPokemonFilters;
    onFiltersChange: (filters: Partial<CaughtPokemonFilters>) => void;
    onClearFilters: () => void;
}

export const CaughtPokemonFiltersComponent: React.FC<CaughtPokemonFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters
}) => {
    const pokemonTypes = [
        'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
        'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon',
        'dark', 'fairy'
    ];

    const sortOptions = [
        { value: 'caughtDate', label: 'Caught Date' },
        { value: 'name', label: 'Name' },
        { value: 'pokeApiId', label: 'Pokemon ID' },
        { value: 'height', label: 'Height' },
        { value: 'weight', label: 'Weight' },
        { value: 'hp', label: 'HP' },
        { value: 'attack', label: 'Attack' },
        { value: 'defense', label: 'Defense' },
        { value: 'specialAttack', label: 'Special Attack' },
        { value: 'specialDefense', label: 'Special Defense' },
        { value: 'speed', label: 'Speed' },
        { value: 'totalStats', label: 'Total Stats' },
    ];

    const hasActiveFilters = () => {
        return !!(
            filters.name ||
            filters.types?.length ||
            filters.favoritesOnly ||
            filters.caughtDateFrom ||
            filters.caughtDateTo
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            {/* Basic Filters Row */}
            <div className="flex flex-wrap gap-4 mb-4">
                {/* Search Input */}
                <div className="flex-1 min-w-48">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={filters.name || ''}
                            onChange={(e) => onFiltersChange({ name: e.target.value || undefined })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Type Filter */}
                <div className="w-32">
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                            value={filters.types?.[0] || ''}
                            onChange={(e) => onFiltersChange({
                                types: e.target.value ? [e.target.value] : undefined
                            })}
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

                {/* Favorites Filter */}
                <label className="flex items-center whitespace-nowrap">
                    <input
                        type="checkbox"
                        checked={filters.favoritesOnly || false}
                        onChange={(e) => onFiltersChange({
                            favoritesOnly: e.target.checked || undefined
                        })}
                        className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Favorites Only</span>
                </label>

                {/* Sort By */}
                <div className="w-56">
                    <select
                        value={filters.sortBy || 'caughtDate'}
                        onChange={(e) => onFiltersChange({
                            sortBy: e.target.value as CaughtPokemonFilters['sortBy']
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                Sort by {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sort Order */}
                <div className="w-20">
                    <select
                        value={filters.sortOrder || 'desc'}
                        onChange={(e) => onFiltersChange({
                            sortOrder: e.target.value as 'asc' | 'desc'
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                        <option value="asc">↑ Asc</option>
                        <option value="desc">↓ Desc</option>
                    </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters() && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-wrap gap-4">
                {/* Caught Date From */}
                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caught From
                    </label>
                    <input
                        type="date"
                        value={filters.caughtDateFrom || ''}
                        onChange={(e) => onFiltersChange({ caughtDateFrom: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Caught Date To */}
                <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caught To
                    </label>
                    <input
                        type="date"
                        value={filters.caughtDateTo || ''}
                        onChange={(e) => onFiltersChange({ caughtDateTo: e.target.value || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Stats Filters can be added here in the future */}
            </div>
        </div>
    );
};

export type { CaughtPokemonFilters };
