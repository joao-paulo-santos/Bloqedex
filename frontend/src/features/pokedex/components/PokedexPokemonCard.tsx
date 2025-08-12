import React, { useState, useEffect } from 'react';
import type { Pokemon, PokemonFilters } from '../../../core/types';
import { useAuthStore } from '../../auth/stores/authStore';

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
    onUpdateNotes?: (notes: string) => void;
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
    onUpdateNotes,
    onUpdatePokemon,
}) => {
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [editedNotes, setEditedNotes] = useState(notes || '');
    const [editedIsFavorite, setEditedIsFavorite] = useState(isFavorite);
    const { user } = useAuthStore();

    // Sync the edited states with the props when they change or when dialog opens
    useEffect(() => {
        setEditedNotes(notes || '');
        setEditedIsFavorite(isFavorite);
    }, [notes, isFavorite, showDetailsDialog]);

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
    const isAuthenticated = !!user;

    const handleSave = async () => {
        try {
            // Check what has changed
            const favoriteChanged = editedIsFavorite !== isFavorite;
            const notesChanged = editedNotes !== (notes || '');

            // If nothing changed, no need to save
            if (!favoriteChanged && !notesChanged) {
                console.log('No changes to save');
                return;
            }

            // Prepare updates object
            const updates: { notes?: string; isFavorite?: boolean } = {};

            if (notesChanged) {
                updates.notes = editedNotes;
            }

            if (favoriteChanged) {
                updates.isFavorite = editedIsFavorite;
            }

            // Use the new combined update function if available
            if (onUpdatePokemon) {
                await onUpdatePokemon(updates);
            } else {
                // Fallback to individual functions for backward compatibility
                if (notesChanged && onUpdateNotes) {
                    await onUpdateNotes(editedNotes);
                }

                if (favoriteChanged && onToggleFavorite) {
                    await onToggleFavorite();
                }
            }

            console.log('Pokemon data saved successfully', updates);

        } catch (error) {
            console.error('Failed to save Pokemon data:', error);
        }
    }; return (
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
                        className="absolute top-2 left-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
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

                {/* Types and Edit Details */}
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
                        Edit
                    </button>
                </div>

                {/* Action Buttons - Empty for consistency with Pokemon card layout */}
                <div className="flex gap-2">
                    {/* No action buttons in Pokedex card - actions are in dialog */}
                </div>
            </div>

            {/* Details Dialog with Release Action */}
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
                                            {caughtDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Caught:</span>
                                                    <span className="font-medium">{new Date(caughtDate).toLocaleDateString()}</span>
                                                </div>
                                            )}

                                            {/* Favorite Status */}
                                            {isAuthenticated && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Favorite:</span>
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={editedIsFavorite}
                                                            onChange={(e) => setEditedIsFavorite(e.target.checked)}
                                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="text-sm">Favorite</span>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {isAuthenticated && (
                                                <div className="space-y-1">
                                                    <span className="text-gray-600">Notes:</span>
                                                    <textarea
                                                        value={editedNotes}
                                                        onChange={(e) => setEditedNotes(e.target.value)}
                                                        placeholder="Add notes about this Pokemon..."
                                                        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Dialog Action Buttons */}
                                {isAuthenticated && pokemon.isCaught && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex gap-3">
                                            {/* Save Button */}
                                            <button
                                                onClick={handleSave}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                Save
                                            </button>

                                            {/* Release Button */}
                                            {onRelease && (
                                                <button
                                                    onClick={() => {
                                                        setShowDetailsDialog(false);
                                                        onRelease();
                                                    }}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                >
                                                    Release
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!isAuthenticated && pokemon.isCaught && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-500 text-center">
                                            Sign in to release Pokemon
                                        </p>
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
