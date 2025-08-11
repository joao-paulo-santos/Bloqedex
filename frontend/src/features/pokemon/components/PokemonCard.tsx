import React from 'react';
import type { Pokemon } from '../../../core/entities';

interface PokemonCardProps {
    pokemon: Pokemon;
    onCatch?: () => void;
    onRelease?: () => void;
    showCatchButton?: boolean;
    showReleaseButton?: boolean;
    className?: string;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
    pokemon,
    onCatch,
    onRelease,
    showCatchButton = false,
    showReleaseButton = false,
    className = ''
}) => {
    // Debug: Log the entire pokemon object
    console.log('PokemonCard received pokemon:', pokemon);
    console.log('Pokemon name:', pokemon?.name);
    console.log('Pokemon types:', pokemon?.types);

    const getTypeColor = (typeName: string): string => {
        if (!typeName) {
            return 'bg-gray-400'; // Default color for undefined types
        }

        const typeColors: Record<string, string> = {
            normal: 'bg-type-normal',
            fighting: 'bg-type-fighting',
            flying: 'bg-type-flying',
            poison: 'bg-type-poison',
            ground: 'bg-type-ground',
            rock: 'bg-type-rock',
            bug: 'bg-type-bug',
            ghost: 'bg-type-ghost',
            steel: 'bg-type-steel',
            fire: 'bg-type-fire',
            water: 'bg-type-water',
            grass: 'bg-type-grass',
            electric: 'bg-type-electric',
            psychic: 'bg-type-psychic',
            ice: 'bg-type-ice',
            dragon: 'bg-type-dragon',
            dark: 'bg-type-dark',
            fairy: 'bg-type-fairy',
        };
        return typeColors[typeName.toLowerCase()] || 'bg-gray-400';
    };

    const formatName = (name: string): string => {
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const formatHeight = (height: number): string => {
        return `${(height / 10).toFixed(1)} m`;
    };

    const formatWeight = (weight: number): string => {
        return `${(weight / 10).toFixed(1)} kg`;
    };

    return (
        <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${className}`}>
            {/* Pokemon Image */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                {pokemon.officialArtworkUrl || pokemon.spriteUrl || pokemon.imageUrl ? (
                    <img
                        src={pokemon.officialArtworkUrl || pokemon.spriteUrl || pokemon.imageUrl}
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
                {pokemon.isCaught && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Caught
                    </div>
                )}
            </div>

            {/* Pokemon Info */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {formatName(pokemon.name)}
                </h3>

                {/* Types */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {pokemon.types?.map((type) => {
                        console.log('Rendering type:', type);
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

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                    <div>
                        <span className="font-medium">Height:</span> {formatHeight(pokemon.height)}
                    </div>
                    <div>
                        <span className="font-medium">Weight:</span> {formatWeight(pokemon.weight)}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {showCatchButton && onCatch && (
                        <button
                            onClick={onCatch}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                            Catch
                        </button>
                    )}

                    {showReleaseButton && onRelease && (
                        <button
                            onClick={onRelease}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        >
                            Release
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
