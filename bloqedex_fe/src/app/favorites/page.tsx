export default function FavoritesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                    My Favorites
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Your personal collection of favorite Pokémon. Sign in to save and manage your favorites across devices.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Favorites Yet
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Start exploring the Pokédex and add your favorite Pokémon to see them here. Your favorites will be saved to your account.
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <p>❤️ Save unlimited favorites</p>
                    <p>🔄 Sync across devices</p>
                    <p>🎯 Quick access to your collection</p>
                    <p>📋 Organize and manage easily</p>
                </div>
                <a
                    href="/pokedex"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                    Explore Pokédex
                </a>
            </div>
        </div>
    );
}
