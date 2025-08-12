import type { Pokemon } from '../../core/types';

export function getLastConsecutiveId(pokemon: Pokemon[]): number {
    if (pokemon.length === 0) {
        return 0;
    }
    const sortedIds = pokemon.map(p => p.id).sort((a, b) => a - b);

    let lastConsecutive = 0;
    for (const id of sortedIds) {
        if (id === lastConsecutive + 1) {
            lastConsecutive = id;
        } else {
            break;
        }
    }

    return lastConsecutive;
}

export function getLastConsecutiveIdFromMap(pokemonMap: Map<number, Pokemon>): number {
    return getLastConsecutiveId(Array.from(pokemonMap.values()));
}

export function getLastConsecutiveIdFromIds(ids: Set<number>): number {
    if (ids.size === 0) {
        return 0;
    }

    const sortedIds = Array.from(ids).sort((a, b) => a - b);

    let lastConsecutive = 0;
    for (const id of sortedIds) {
        if (id === lastConsecutive + 1) {
            lastConsecutive = id;
        } else {
            break;
        }
    }

    return lastConsecutive;
}
