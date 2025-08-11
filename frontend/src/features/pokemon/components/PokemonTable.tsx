import React from 'react';
import type { Pokemon } from '../../../core/entities';
import type { PokemonFilters } from '../../../core/interfaces';

interface PokemonTableProps {
    pokemon: Pokemon[];
    selectedPokemonIds: Set<number>;
    onPokemonSelect: (pokemonId: number) => void;
    sortBy?: PokemonFilters['sortBy'];
    onSort?: (sortBy: PokemonFilters['sortBy']) => void;
}

export const PokemonTable: React.FC<PokemonTableProps> = ({
    pokemon,
    selectedPokemonIds,
    onPokemonSelect,
    sortBy,
    onSort
}) => {
    const formatName = (name: string) => {
        return name.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
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

    const handleSort = (column: PokemonFilters['sortBy']) => {
        if (onSort) {
            onSort(column);
        }
    };

    const SortableHeader: React.FC<{ column: PokemonFilters['sortBy']; children: React.ReactNode }> = ({ column, children }) => (
        <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                {sortBy === column && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
        </th>
    );

    return (
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
                                        pokemon.forEach(p => {
                                            if (!selectedPokemonIds.has(p.pokeApiId)) {
                                                onPokemonSelect(p.pokeApiId);
                                            }
                                        });
                                    } else {
                                        pokemon.forEach(p => {
                                            if (selectedPokemonIds.has(p.pokeApiId)) {
                                                onPokemonSelect(p.pokeApiId);
                                            }
                                        });
                                    }
                                }}
                                checked={pokemon.length > 0 && pokemon.every(p => selectedPokemonIds.has(p.pokeApiId))}
                            />
                        </th>
                        <SortableHeader column="pokeApiId">ID</SortableHeader>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <SortableHeader column="name">Name</SortableHeader>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Types</th>
                        <SortableHeader column="height">Height</SortableHeader>
                        <SortableHeader column="weight">Weight</SortableHeader>
                        <SortableHeader column="baseExperience">Base Exp</SortableHeader>
                        <SortableHeader column="hp">HP</SortableHeader>
                        <SortableHeader column="attack">Attack</SortableHeader>
                        <SortableHeader column="defense">Defense</SortableHeader>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caught</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {pokemon.map((p, index) => {
                        const isSelected = selectedPokemonIds.has(p.pokeApiId);
                        const prevSelected = index > 0 && selectedPokemonIds.has(pokemon[index - 1].pokeApiId);
                        const nextSelected = index < pokemon.length - 1 && selectedPokemonIds.has(pokemon[index + 1].pokeApiId);

                        return (
                            <tr
                                key={p.pokeApiId}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => onPokemonSelect(p.pokeApiId)}
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
                                        checked={selectedPokemonIds.has(p.pokeApiId)}
                                        onChange={() => onPokemonSelect(p.pokeApiId)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{p.pokeApiId.toString().padStart(3, '0')}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <img
                                        src={p.spriteUrl || p.imageUrl || '/placeholder-pokemon.png'}
                                        alt={p.name}
                                        className="w-12 h-12 object-contain"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatName(p.name)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex space-x-1">
                                        {p.types?.map((type) => (
                                            <span
                                                key={type}
                                                className={`${getTypeColor(type)} text-white text-xs px-2 py-1 rounded-full font-medium`}
                                            >
                                                {formatName(type)}
                                            </span>
                                        )) || <span className="text-gray-400 text-sm">-</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.height ? `${(p.height / 10).toFixed(1)}m` : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.weight ? `${(p.weight / 10).toFixed(1)}kg` : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.baseExperience || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.hp || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.attack || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {p.defense || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {((p.hp || 0) + (p.attack || 0) + (p.defense || 0) +
                                        (p.specialAttack || 0) + (p.specialDefense || 0) + (p.speed || 0)) || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.isCaught
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {p.isCaught ? 'Caught' : 'Not Caught'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
