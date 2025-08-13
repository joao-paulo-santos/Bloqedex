import React, { useState, useEffect } from 'react';
import type { CaughtPokemon } from '../../../core/types';

interface PokemonEditDialogProps {
    caughtPokemon: CaughtPokemon | null;
    isOpen: boolean;
    onClose: () => void;
    onRelease?: () => void;
    onUpdatePokemon?: (caughtPokemonId: number, updates: { notes?: string; isFavorite?: boolean }) => void;
}

export const PokemonEditDialog: React.FC<PokemonEditDialogProps> = ({
    caughtPokemon,
    isOpen,
    onClose,
    onRelease,
    onUpdatePokemon
}) => {
    const [editedPokemon, setEditedPokemon] = useState<CaughtPokemon | null>(null);

    // Sync with the prop when dialog opens or Pokemon changes
    useEffect(() => {
        if (isOpen && caughtPokemon) {
            setEditedPokemon({ ...caughtPokemon });
        }
    }, [isOpen, caughtPokemon]);

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

    const getTypeColor = (typeName: string): string => {
        const typeColors: Record<string, string> = {
            normal: 'bg-gray-400',
            fire: 'bg-red-500',
            water: 'bg-blue-500',
            electric: 'bg-yellow-400',
            grass: 'bg-green-500',
            ice: 'bg-blue-200',
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
            steel: 'bg-gray-500',
            fairy: 'bg-pink-300',
        };
        return typeColors[typeName.toLowerCase()] || 'bg-gray-400';
    };

    const handleSave = () => {
        if (editedPokemon && onUpdatePokemon) {
            onUpdatePokemon(editedPokemon.id, {
                notes: editedPokemon.notes,
                isFavorite: editedPokemon.isFavorite
            });
        }
        onClose();
    };

    const handleFavoriteToggle = () => {
        if (editedPokemon) {
            // Only update local state, don't call parent until save
            setEditedPokemon(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        }
    };

    if (!isOpen || !editedPokemon) {
        return null;
    }

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
                                {formatName(editedPokemon.pokemon.name)} #{editedPokemon.pokemon.pokeApiId.toString().padStart(3, '0')}
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
                            <img
                                src={editedPokemon.pokemon.spriteUrl || editedPokemon.pokemon.officialArtworkUrl || '/placeholder-pokemon.png'}
                                alt={editedPokemon.pokemon.name}
                                className="w-32 h-32 object-contain"
                            />
                        </div>

                        {/* Types */}
                        {editedPokemon.pokemon.types && editedPokemon.pokemon.types.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Types</h3>
                                <div className="flex flex-wrap gap-2">
                                    {editedPokemon.pokemon.types.map((type) => (
                                        <span
                                            key={type}
                                            className={`${getTypeColor(type)} text-white text-sm px-3 py-1 rounded-full font-medium`}
                                        >
                                            {formatName(type)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Caught Date */}
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Caught Date</h3>
                            <p className="text-sm text-gray-900">{formatDate(editedPokemon.caughtDate)}</p>
                        </div>

                        {/* Favorite Toggle */}
                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editedPokemon.isFavorite}
                                    onChange={handleFavoriteToggle}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Favorite Pokemon</span>
                            </label>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={editedPokemon.notes || ''}
                                onChange={(e) => {
                                    setEditedPokemon(prev => prev ? { ...prev, notes: e.target.value } : null);
                                }}
                                placeholder="Add notes about this Pokemon..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={4}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                Save Changes
                            </button>
                            {onRelease && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onRelease();
                                    }}
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                                >
                                    Release
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
