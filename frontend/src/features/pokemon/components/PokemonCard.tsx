import React, { useState } from 'react';
import type { Pokemon } from '../../../core/entities';
import type { PokemonFilters } from '../../../core/interfaces';

interface PokemonCardProps {
    pokemon: Pokemon;
    onCatch?: () => void;
    onRelease?: () => void;
    showCatchButton?: boolean;
    showReleaseButton?: boolean;
    className?: string;
    sortBy?: PokemonFilters['sortBy'];
    isSelected?: boolean;
    onSelect?: () => void;
    caughtDate?: string;
    notes?: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    showCaughtIndicator?: boolean;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
    pokemon,
    onCatch,
    onRelease,
    showCatchButton = false,
    showReleaseButton = false,
    className = '',
    sortBy,
    isSelected = false,
    onSelect,
    caughtDate,
    notes,
    isFavorite,
    onToggleFavorite,
    showCaughtIndicator = true
}) => {
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const getTypeColor = (typeName: string): string => {
        if (!typeName) {
            return 'bg-gray-500';
        }

        const typeColors: Record<string, string> = {
            normal: 'bg-gray-400',
            fighting: 'bg-red-600',
            flying: 'bg-indigo-400',
            poison: 'bg-purple-600',
            ground: 'bg-yellow-600',
            rock: 'bg-yellow-800',
            bug: 'bg-green-500',
            ghost: 'bg-purple-800',
            steel: 'bg-gray-600',
            fire: 'bg-orange-500',
            water: 'bg-blue-500',
            grass: 'bg-green-600',
            electric: 'bg-yellow-400',
            psychic: 'bg-pink-500',
            ice: 'bg-cyan-400',
            dragon: 'bg-indigo-700',
            dark: 'bg-gray-800',
            fairy: 'bg-pink-400',
        };
        return typeColors[typeName.toLowerCase()] || 'bg-gray-500';
    };

    const formatName = (name: string): string => {
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const getSortValue = (): { label: string; value: string | number; notes?: string } | null => {
        if (!sortBy || sortBy === 'pokeApiId') return null;

        switch (sortBy) {
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
                    value: new Date(caughtDate).toLocaleDateString(),
                    notes: notes
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

                {/* Caught Indicator */}
                {showCaughtIndicator && pokemon.isCaught && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Caught
                    </div>
                )}
            </div>

            {/* Pokemon Info */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {formatName(pokemon.name)}
                    </h3>
                    {onToggleFavorite && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite();
                            }}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <span className={`text-lg ${isFavorite ? 'text-red-500' : 'text-gray-300'}`}>
                                ♥
                            </span>
                        </button>
                    )}
                </div>

                {/* Sort Value Display */}
                {sortValue && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1 mb-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-blue-700">{sortValue.label}:</span>
                            <span className="text-sm font-semibold text-blue-800">{sortValue.value}</span>
                        </div>
                        {sortValue.notes && (
                            <div className="mt-1 text-xs text-blue-600">
                                Note: {sortValue.notes}
                            </div>
                        )}
                    </div>
                )}

                {/* Types and View Details */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-wrap gap-1">
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
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetailsDialog(true);
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline transition-colors flex-shrink-0 cursor-pointer"
                    >
                        View Details
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {showCatchButton && onCatch && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCatch();
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                            Catch
                        </button>
                    )}

                    {showReleaseButton && onRelease && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRelease();
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                            Release
                        </button>
                    )}
                </div>
            </div>

            {/* Details Dialog */}
            {showDetailsDialog && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 backdrop-blur-[2px] bg-black/10 transition-opacity" onClick={() => setShowDetailsDialog(false)}></div>
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto z-10"
                            onClick={e => e.stopPropagation()}>
                            <div className="p-6">
                                {/* Dialog Header */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {formatName(pokemon.name)} #{pokemon.pokeApiId.toString().padStart(3, '0')}
                                    </h2>
                                    <button
                                        onClick={() => setShowDetailsDialog(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Pokemon Image */}
                                <div className="flex justify-center mb-4">
                                    {pokemon.officialArtworkUrl || pokemon.spriteUrl ? (
                                        <img
                                            src={pokemon.officialArtworkUrl || pokemon.spriteUrl}
                                            alt={pokemon.name}
                                            className="w-32 h-32 object-contain"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 flex items-center justify-center text-gray-400 bg-gray-100 rounded">
                                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Types */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Types</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {pokemon.types?.map((type) => (
                                            <span
                                                key={type}
                                                className={`${getTypeColor(type)} text-white text-sm px-3 py-1 rounded-full font-medium`}
                                            >
                                                {formatName(type)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Physical Stats */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Physical Stats</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Height:</span>
                                            <span className="font-medium">{pokemon.height / 10}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Weight:</span>
                                            <span className="font-medium">{pokemon.weight / 10}kg</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Battle Stats */}
                                {(pokemon.hp || pokemon.attack || pokemon.defense || pokemon.specialAttack || pokemon.specialDefense || pokemon.speed) && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Battle Stats</h3>
                                        <div className="space-y-2 text-sm">
                                            {pokemon.hp && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">HP:</span>
                                                    <span className="font-medium">{pokemon.hp}</span>
                                                </div>
                                            )}
                                            {pokemon.attack && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Attack:</span>
                                                    <span className="font-medium">{pokemon.attack}</span>
                                                </div>
                                            )}
                                            {pokemon.defense && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Defense:</span>
                                                    <span className="font-medium">{pokemon.defense}</span>
                                                </div>
                                            )}
                                            {pokemon.specialAttack && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Special Attack:</span>
                                                    <span className="font-medium">{pokemon.specialAttack}</span>
                                                </div>
                                            )}
                                            {pokemon.specialDefense && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Special Defense:</span>
                                                    <span className="font-medium">{pokemon.specialDefense}</span>
                                                </div>
                                            )}
                                            {pokemon.speed && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Speed:</span>
                                                    <span className="font-medium">{pokemon.speed}</span>
                                                </div>
                                            )}
                                            {(pokemon.hp || pokemon.attack || pokemon.defense || pokemon.specialAttack || pokemon.specialDefense || pokemon.speed) && (
                                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                                    <span className="text-gray-600 font-medium">Total:</span>
                                                    <span className="font-bold">
                                                        {(pokemon.hp || 0) + (pokemon.attack || 0) + (pokemon.defense || 0) +
                                                            (pokemon.specialAttack || 0) + (pokemon.specialDefense || 0) + (pokemon.speed || 0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* User Data */}
                                {(pokemon.isCaught || pokemon.firstAddedToPokedex) && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Your Data</h3>
                                        <div className="space-y-2 text-sm">
                                            {pokemon.isCaught && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status:</span>
                                                    <span className="font-medium text-green-600">Caught</span>
                                                </div>
                                            )}
                                            {pokemon.firstAddedToPokedex && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">First Seen:</span>
                                                    <span className="font-medium">{new Date(pokemon.firstAddedToPokedex).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
