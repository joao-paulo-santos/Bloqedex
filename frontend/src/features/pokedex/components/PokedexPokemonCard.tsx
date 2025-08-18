import React, { useState } from 'react';
import type { Pokemon, PokemonFilters } from '../../../core/types';
import { PokedexDetailDialog } from './PokedexDetailDialog';
import { PokemonEditDialog } from './PokemonEditDialog';

interface PokedexPokemonCardProps {
    pokemon: Pokemon;
    onRelease?: () => void;
    className?: string;
    sortBy?: PokemonFilters['sortBy'];
    isSelected?: boolean;
    onSelect?: () => void;
    caughtDate?: string;
    notes?: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    onUpdatePokemon?: (updates: { notes?: string; isFavorite?: boolean }) => void;
}

export const PokedexPokemonCard: React.FC<PokedexPokemonCardProps> = ({
    pokemon,
    onRelease,
    className = '',
    sortBy,
    isSelected = false,
    onSelect,
    caughtDate,
    notes,
    isFavorite = false,
    onToggleFavorite,
    onUpdatePokemon,
}) => {
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const formatName = (name: string): string => {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getTypeColor = (typeName: string): string => {
        if (!typeName) {
            return 'bg-gray-500';
        }

        const typeColors: Record<string, string> = {
            normal: 'bg-gray-400',
            fire: 'bg-red-500',
            water: 'bg-blue-500',
            electric: 'bg-yellow-400',
            grass: 'bg-green-500',
            ice: 'bg-blue-300',
            fighting: 'bg-red-700',
            poison: 'bg-purple-500',
            ground: 'bg-yellow-600',
            flying: 'bg-indigo-400',
            psychic: 'bg-pink-500',
            bug: 'bg-green-400',
            rock: 'bg-yellow-800',
            ghost: 'bg-purple-700',
            dragon: 'bg-indigo-700',
            dark: 'bg-gray-800',
            steel: 'bg-gray-600',
            fairy: 'bg-pink-300',
        };

        return typeColors[typeName.toLowerCase()] || 'bg-gray-500';
    };

    const getSortValue = () => {
        if (!sortBy) return null;

        switch (sortBy) {
            case 'pokeApiId':
                return { label: 'Pokedex #', value: `#${pokemon.pokeApiId.toString().padStart(3, '0')}` };
            case 'name':
                return { label: 'Name', value: formatName(pokemon.name) };
            case 'height':
                return { label: 'Height', value: `${pokemon.height / 10}m` };
            case 'weight':
                return { label: 'Weight', value: `${pokemon.weight / 10}kg` };
            case 'hp':
                return { label: 'HP', value: pokemon.hp || 0 };
            case 'attack':
                return { label: 'Attack', value: pokemon.attack || 0 };
            case 'defense':
                return { label: 'Defense', value: pokemon.defense || 0 };
            case 'specialAttack':
                return { label: 'Sp. Attack', value: pokemon.specialAttack || 0 };
            case 'specialDefense':
                return { label: 'Sp. Defense', value: pokemon.specialDefense || 0 };
            case 'speed':
                return { label: 'Speed', value: pokemon.speed || 0 };
            case 'totalStats': {
                const total = (pokemon.hp || 0) + (pokemon.attack || 0) + (pokemon.defense || 0) +
                    (pokemon.specialAttack || 0) + (pokemon.specialDefense || 0) + (pokemon.speed || 0);
                return { label: 'Total Stats', value: total };
            }
            case 'firstAddedToPokedex':
                return pokemon.firstAddedToPokedex ? { label: 'Added', value: new Date(pokemon.firstAddedToPokedex).toLocaleDateString() } : null;
            case 'caughtDate':
                return caughtDate ? {
                    label: 'Caught',
                    value: new Date(caughtDate).toLocaleDateString()
                } : null;
            default:
                return null;
        }
    };

    const sortValue = getSortValue();

    return (
        <div
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-75 overflow-hidden cursor-pointer ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-75' : ''
                } ${className}`}
            onClick={onSelect}
        >
            {/* Pokemon Image */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                {pokemon.officialArtworkUrl || pokemon.spriteUrl ? (
                    <img
                        src={pokemon.officialArtworkUrl || pokemon.spriteUrl}
                        alt={pokemon.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                {/* Pokedex Number */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    #{pokemon.pokeApiId.toString().padStart(3, '0')}
                </div>

                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite();
                        }}
                        className="absolute top-2 left-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200 cursor-pointer"
                    >
                        <span className={`text-2xl ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}>
                            ♥
                        </span>
                    </button>
                )}
            </div>

            {/* Pokemon Info */}
            <div className="p-4">
                <div className="flex items-center justify-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {formatName(pokemon.name)}
                    </h3>
                </div>

                {/* Sort Value Display */}
                {sortValue && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 mb-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-blue-700">{sortValue.label}:</span>
                            <span className="text-sm font-semibold text-blue-800">{sortValue.value}</span>
                        </div>
                    </div>
                )}

                {/* Types and Action Buttons */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-wrap gap-1 flex-1 mr-2">
                        {pokemon.types?.map((type) => {
                            return (
                                <span
                                    key={type}
                                    className={`${getTypeColor(type)} text-white text-xs px-2 py-1 rounded-full font-medium`}
                                >
                                    {formatName(type)}
                                </span>
                            );
                        }) || (
                                <span className="text-gray-500 text-sm">No type data</span>
                            )}
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetailsDialog(true);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View details"
                        >
                            <svg
                                className="w-4 h-4"
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
                                setShowEditDialog(true);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit details"
                        >
                            <svg
                                className="w-4 h-4"
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
                    </div>
                </div>

                {/* Action Buttons - Empty for consistency with Pokemon card layout */}
                <div className="flex gap-2">
                    {/* No action buttons in Pokedex card - actions are in dialog */}
                </div>
            </div>

            {/* Details Dialog */}
            <PokedexDetailDialog
                pokemon={pokemon}
                isOpen={showDetailsDialog}
                onClose={() => setShowDetailsDialog(false)}
                caughtDate={caughtDate}
                notes={notes}
                isFavorite={isFavorite}
            />

            {/* Edit Dialog */}
            <PokemonEditDialog
                caughtPokemon={showEditDialog ? {
                    userId: 0, // Temporary userId
                    pokemon: pokemon,
                    caughtDate: caughtDate || new Date().toISOString(),
                    notes: notes || '',
                    isFavorite: isFavorite
                } : null}
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                onRelease={onRelease}
                onUpdatePokemon={onUpdatePokemon ? (_caughtPokemonId, updates) => onUpdatePokemon(updates) : undefined}
            />
        </div>
    );
};
