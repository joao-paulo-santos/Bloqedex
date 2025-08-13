import React from 'react';
import type { Pokemon } from '../../../core/types';
import { useAuthStore } from '../../auth/stores/authStore';

interface PokedexDetailDialogProps {
    pokemon: Pokemon | null;
    isOpen: boolean;
    onClose: () => void;
    caughtDate?: string;
    notes?: string;
    isFavorite?: boolean;
}

export const PokedexDetailDialog: React.FC<PokedexDetailDialogProps> = ({
    pokemon,
    isOpen,
    onClose,
    caughtDate,
    notes,
    isFavorite = false,
}) => {
    const { user } = useAuthStore();

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

    if (!isOpen || !pokemon) {
        return null;
    }

    const isAuthenticated = !!user;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 backdrop-blur-[2px] bg-black/10 transition-opacity" onClick={onClose}></div>
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
                                onClick={onClose}
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
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xl ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}>
                                                    ♥
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {isFavorite ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {isAuthenticated && (
                                        <div className="space-y-1">
                                            <span className="text-gray-600">Notes:</span>
                                            <div className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-2 min-h-[60px] break-words">
                                                {notes ? (
                                                    <p className="whitespace-pre-wrap break-words word-wrap">{notes}</p>
                                                ) : (
                                                    <span className="text-gray-400 italic">No notes</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
