import React from 'react';

interface EmptyPokemonStateProps {
    title?: string;
    subtitle?: string;
    showHint?: boolean;
}

export const EmptyPokemonState: React.FC<EmptyPokemonStateProps> = ({
    title = "Pikachu could not find any friends",
    subtitle,
    showHint = true,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="mb-8">
                <img
                    src="/sleepypika.png"
                    alt="Sleepy Pikachu"
                    className="w-64 h-64 object-contain opacity-80"
                />
            </div>

            <div className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {title}
                </h3>

                {subtitle && (
                    <p className="text-gray-500 mb-6">
                        {subtitle}
                    </p>
                )}

                {showHint && (
                    <p className="text-sm text-gray-400">
                        Try adjusting your search or check your internet connection
                    </p>
                )}
            </div>
        </div>
    );
};
