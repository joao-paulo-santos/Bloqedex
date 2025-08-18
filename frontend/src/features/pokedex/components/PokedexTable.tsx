import React, { useState } from 'react';
import { EmptyPokemonState } from '../../pokemon/components/EmptyPokemonState';
import { PokemonEditDialog } from './PokemonEditDialog';
import { PokedexDetailDialog } from './PokedexDetailDialog';
import type { CaughtPokemon, CaughtPokemonFilters } from '../../../core/types';

interface PokedexTableProps {
    caughtPokemon: CaughtPokemon[];
    selectedPokemonIds: Set<number>;
    onPokemonSelect: (pokemonId: number) => void;
    onToggleFavorite: (caughtPokemonId: number) => void;
    onRelease?: (caughtPokemonId: number) => void;
    onUpdatePokemon?: (caughtPokemonId: number, updates: { notes?: string; isFavorite?: boolean }) => void;
    sortBy?: CaughtPokemonFilters['sortBy'];
    sortOrder?: CaughtPokemonFilters['sortOrder'];
    onSort?: (sortBy: CaughtPokemonFilters['sortBy'], sortOrder: CaughtPokemonFilters['sortOrder']) => void;
}

export const PokedexTable: React.FC<PokedexTableProps> = ({
    caughtPokemon,
    selectedPokemonIds,
    onPokemonSelect,
    onToggleFavorite,
    onRelease,
    onUpdatePokemon,
    sortBy,
    sortOrder,
    onSort
}) => {
    const [editingPokemon, setEditingPokemon] = useState<CaughtPokemon | null>(null);
    const [viewingDetails, setViewingDetails] = useState<CaughtPokemon | null>(null);
    const formatName = (name: string) => {
        return name.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleSort = (column: CaughtPokemonFilters['sortBy']) => {
        if (onSort) {
            // If clicking the same column, toggle the order
            if (sortBy === column) {
                const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                onSort(column, newOrder);
            } else {
                // If clicking a different column, start with ascending
                onSort(column, 'asc');
            }
        }
    };

    // Handle empty state
    if (caughtPokemon.length === 0) {
        return (
            <EmptyPokemonState />
        );
    }

    const SortableHeader: React.FC<{ column: CaughtPokemonFilters['sortBy']; children: React.ReactNode }> = ({ column, children }) => (
        <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === column && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        {sortOrder === 'asc' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                    </svg>
                )}
            </div>
        </th>
    );

    return (
        <>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            caughtPokemon.forEach(cp => {
                                                if (!selectedPokemonIds.has(cp.pokemon.pokeApiId)) {
                                                    onPokemonSelect(cp.pokemon.pokeApiId);
                                                }
                                            });
                                        } else {
                                            caughtPokemon.forEach(cp => {
                                                if (selectedPokemonIds.has(cp.pokemon.pokeApiId)) {
                                                    onPokemonSelect(cp.pokemon.pokeApiId);
                                                }
                                            });
                                        }
                                    }}
                                    checked={caughtPokemon.length > 0 && caughtPokemon.every(cp => selectedPokemonIds.has(cp.pokemon.pokeApiId))}
                                />
                            </th>
                            <SortableHeader column="pokeApiId">Pokemon</SortableHeader>
                            <SortableHeader column="caughtDate">Caught Date</SortableHeader>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {caughtPokemon.map((cp, index) => {
                            const isSelected = selectedPokemonIds.has(cp.pokemon.pokeApiId);
                            const prevSelected = index > 0 && selectedPokemonIds.has(caughtPokemon[index - 1].pokemon.pokeApiId);
                            const nextSelected = index < caughtPokemon.length - 1 && selectedPokemonIds.has(caughtPokemon[index + 1].pokemon.pokeApiId);

                            return (
                                <tr
                                    key={cp.pokemon.pokeApiId}
                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => onPokemonSelect(cp.pokemon.pokeApiId)}
                                    style={isSelected ? {
                                        borderLeft: '3px solid #3B82F6',
                                        borderRight: '3px solid #3B82F6',
                                        borderTop: !prevSelected ? '3px solid #3B82F6' : 'none',
                                        borderBottom: !nextSelected ? '3px solid #3B82F6' : 'none'
                                    } : {}}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedPokemonIds.has(cp.pokemon.pokeApiId)}
                                            onChange={() => onPokemonSelect(cp.pokemon.pokeApiId)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={cp.pokemon.spriteUrl || cp.pokemon.officialArtworkUrl || '/placeholder-pokemon.png'}
                                                alt={cp.pokemon.name}
                                                className="w-12 h-12 object-contain"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatName(cp.pokemon.name)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    #{cp.pokemon.pokeApiId.toString().padStart(3, '0')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(cp.caughtDate)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        <div className="max-w-xs truncate" title={cp.notes || ''}>
                                            {cp.notes || <span className="text-gray-400 italic">No notes</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewingDetails(cp);
                                                }}
                                                className="p-2 rounded-md text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                                                title="View details"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleFavorite(cp.pokemon.pokeApiId);
                                                }}
                                                className={`p-2 rounded-md transition-colors cursor-pointer ${cp.isFavorite
                                                    ? 'text-red-500 hover:bg-red-50'
                                                    : 'text-gray-400 hover:bg-gray-50 hover:text-red-500'
                                                    }`}
                                                title={cp.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                <span className="text-xl font-bold">♥</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPokemon(cp);
                                                }}
                                                className="p-2 rounded-md text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                                                title="Edit details"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                            </button>
                                            {onRelease && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRelease(cp.pokemon.pokeApiId);
                                                    }}
                                                    className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                                    title="Release Pokemon"
                                                >
                                                    <svg
                                                        className="w-5 h-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <PokemonEditDialog
                caughtPokemon={editingPokemon}
                isOpen={!!editingPokemon}
                onClose={() => setEditingPokemon(null)}
                onRelease={editingPokemon ? () => onRelease?.(editingPokemon.pokemon.pokeApiId) : undefined}
                onUpdatePokemon={onUpdatePokemon}
            />

            <PokedexDetailDialog
                pokemon={viewingDetails?.pokemon || null}
                isOpen={!!viewingDetails}
                onClose={() => setViewingDetails(null)}
                caughtDate={viewingDetails?.caughtDate}
                notes={viewingDetails?.notes}
                isFavorite={viewingDetails?.isFavorite || false}
            />
        </>
    );
};