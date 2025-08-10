import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../stores';
import { LoginDialog, RegisterDialog } from '../../features/auth';
import { eventBus, authEvents } from '../../common/utils/eventBus';
import {
    MenuIcon,
    XIcon,
    UserIcon,
    LogOutIcon,
    GridIcon,
    LockIcon,
    StatusDotIcon
} from '../common/Icons';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuthStore();
    const { isOnline } = useAppStore();

    // Listen for auth dialog events
    useEffect(() => {
        const unsubscribeLogin = eventBus.on('auth:openLogin', () => {
            setShowLoginDialog(true);
            setShowRegisterDialog(false);
        });

        const unsubscribeRegister = eventBus.on('auth:openRegister', () => {
            setShowRegisterDialog(true);
            setShowLoginDialog(false);
        });

        const unsubscribeClose = eventBus.on('auth:closeDialogs', () => {
            setShowLoginDialog(false);
            setShowRegisterDialog(false);
        });

        return () => {
            unsubscribeLogin();
            unsubscribeRegister();
            unsubscribeClose();
        };
    }, []);

    const navigation = [
        { name: 'Browse All', href: '/', icon: GridIcon, requiresAuth: false },
        { name: 'My Pokédex', href: '/pokedex', icon: GridIcon, requiresAuth: true },
    ];

    const handleLockedNavClick = (e: React.MouseEvent) => {
        e.preventDefault();
        authEvents.openLogin();
    };

    const isActivePath = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="w-full pl-2 pr-4 sm:pl-4 sm:pr-6 lg:pl-4 lg:pr-8">
                    <div className="flex items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <img
                                    src="/logo_small.png"
                                    alt="Bloqedex Logo"
                                    className="w-8 h-8 object-contain"
                                />
                                <span className="ml-1 text-xl font-bold text-gray-900">Bloqedex</span>
                            </Link>
                            <div className="flex items-center space-x-2 ml-4 md:hidden">
                                <div title={isOnline ? 'Online' : 'Offline'}>
                                    <StatusDotIcon size={8} online={isOnline} />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8 ml-5">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isLocked = item.requiresAuth && !isAuthenticated;
                                const isActive = isActivePath(item.href);

                                if (isLocked) {
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={handleLockedNavClick}
                                            className="flex items-center h-16 px-4 text-sm font-medium text-gray-500 bg-gray-100 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            <LockIcon size={16} className="mr-2" />
                                            {item.name}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'text-blue-600'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={18} className="mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4 ml-auto">
                            {/* Backend Status Indicator */}
                            <div className="hidden md:flex items-center space-x-2">
                                <StatusDotIcon size={8} online={isOnline} />
                                <span className="text-sm text-gray-600">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            {/* Authentication Section */}
                            {isAuthenticated ? (
                                /* Authenticated User Menu */
                                <div className="relative group">
                                    <button className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                                        <UserIcon size={20} className="mr-2" />
                                        <span className="hidden sm:block">{user?.username}</span>
                                    </button>

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <UserIcon size={16} className="mr-3" />
                                                Profile
                                            </Link>
                                            <button
                                                onClick={logout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <LogOutIcon size={16} className="mr-3" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Login Button for Non-authenticated Users */
                                <button
                                    onClick={authEvents.openLogin}
                                    className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    Login
                                </button>
                            )}

                            {/* Mobile menu button */}
                            <button
                                className="md:hidden p-2 text-gray-700 hover:text-blue-600"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <nav className="px-4 pt-2 pb-4 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isLocked = item.requiresAuth && !isAuthenticated;
                                const isActive = isActivePath(item.href);

                                if (isLocked) {
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={(e) => {
                                                handleLockedNavClick(e);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-500 bg-gray-100 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                        >
                                            <LockIcon size={18} className="mr-3" />
                                            {item.name}
                                        </button>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                                            ? 'text-blue-600'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Icon size={20} className="mr-3" />
                                        {item.name}
                                    </Link>
                                );
                            })}

                            {/* Authentication Section for Mobile */}
                            <div className="border-t border-gray-200 pt-2 mt-2">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <UserIcon size={20} className="mr-3" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                        >
                                            <LogOutIcon size={20} className="mr-3" />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            authEvents.openLogin();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <UserIcon size={20} className="mr-3" />
                                        Login
                                    </button>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Auth Dialogs */}
            <LoginDialog
                isOpen={showLoginDialog}
                onClose={() => setShowLoginDialog(false)}
                onSwitchToRegister={() => {
                    setShowLoginDialog(false);
                    setShowRegisterDialog(true);
                }}
            />
            <RegisterDialog
                isOpen={showRegisterDialog}
                onClose={() => setShowRegisterDialog(false)}
                onSwitchToLogin={() => {
                    setShowRegisterDialog(false);
                    setShowLoginDialog(true);
                }}
            />
        </div>
    );
};
