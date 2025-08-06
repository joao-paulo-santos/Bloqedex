export default function PokedexPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                    Pokédex
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Explore the complete collection of Pokémon. Search, filter, and discover detailed information about your favorite creatures.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-2l2 2-2 2m-12-4l-2 2 2 2"></path>
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    The Pokédex feature is currently under development. We&apos;ll be integrating with your custom Pokémon API to bring you the complete Pokémon database.
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <p>✨ Search and filter Pokémon</p>
                    <p>🔍 Detailed Pokémon information</p>
                    <p>⭐ Favorite Pokémon system</p>
                    <p>📱 Responsive design</p>
                </div>
            </div>
        </div>
    );
}
