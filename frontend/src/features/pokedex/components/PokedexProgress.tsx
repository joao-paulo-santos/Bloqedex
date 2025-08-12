import React from 'react';
import { usePokemonStore } from '../../pokemon/stores/pokemonStore';
import { usePokedexStore } from '../stores/pokedexStore';

interface PokedexProgressProps {
    isLoading?: boolean;
}

export const PokedexProgress: React.FC<PokedexProgressProps> = ({ isLoading }) => {
    const { totalPokemons } = usePokemonStore();
    const { caughtPokemon } = usePokedexStore();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="flex space-x-4">
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!totalPokemons) {
        return null;
    }

    const totalCaught = caughtPokemon.length;
    const totalFavorites = caughtPokemon.filter(p => p.isFavorite).length;
    const totalAvailable = totalPokemons;
    const remaining = totalAvailable - totalCaught;
    const progressPercentage = Math.round((totalCaught / totalAvailable) * 100);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pokédex Progress</h2>
                <span className="text-sm font-medium text-gray-500">
                    {progressPercentage}% Complete
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {totalCaught.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Caught</div>
                </div>

                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                        {totalAvailable.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                </div>

                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {totalFavorites.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Favorites</div>
                </div>

                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {remaining.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Remaining</div>
                </div>
            </div>
        </div>
    );
};
