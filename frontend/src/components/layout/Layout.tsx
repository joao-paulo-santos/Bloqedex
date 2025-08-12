import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../../stores';
import { indexedDBStorage } from '../../infrastructure/storage/IndexedDBStorage';
import { LoginDialog, RegisterDialog, FloatingAuthButton, SwitchToOnlineButton, OfflineAccountWarning, PendingActionsWarning } from '../../features/auth';
import { eventBus, authEvents } from '../../common/utils/eventBus';
import {
    MenuIcon,
    XIcon,
    UserIcon,
    LogOutIcon,
    GridIcon,
    LockIcon,
    StatusDotIcon,
    RefreshIcon
} from '../common/Icons';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [showOfflineWarning, setShowOfflineWarning] = useState(false);
    const [showPendingActionsWarning, setShowPendingActionsWarning] = useState(false);
    const [pendingActionsCount, setPendingActionsCount] = useState(0);
    const location = useLocation();
    const { user, logout, isAuthenticated, isOfflineAccount } = useAuthStore();
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
        if (isOnline) {
            authEvents.openLogin();
        }
        else {
            authEvents.openRegister();
        }
    };

    const isActivePath = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        const { logoutWithPendingCheck } = useAuthStore.getState();

        const shouldProceed = await logoutWithPendingCheck();

        if (!shouldProceed) {
            if (isOfflineAccount) {
                setShowOfflineWarning(true);
            } else {
                try {
                    const pendingActions = await indexedDBStorage.getPendingActions();
                    setPendingActionsCount(pendingActions.length);
                    setShowPendingActionsWarning(true);
                } catch (error) {
                    console.error('Failed to get pending actions for warning:', error);
                    logout();
                }
            }
        }
    };

    const handleConfirmLogout = () => {
        setShowOfflineWarning(false);
        setShowPendingActionsWarning(false);
        logout();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
                <div className="w-full pl-2 pr-2 sm:pl-4 sm:pr-3 lg:pl-4 lg:pr-4">
                    <div className="flex items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center mr-5">
                                <img
                                    src="/logo_small.png"
                                    alt="Bloqedex Logo"
                                    className="w-8 h-8 object-contain"
                                />
                                <span className="ml-1 text-xl font-bold text-gray-900">Bloqédex</span>
                            </Link>
                            <div className="flex items-center md:hidden">
                                <div title={isOnline ? 'Online' : 'Offline'}>
                                    <StatusDotIcon size={8} online={isOnline} />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex  ml-5">
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
                                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
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
                        <div className="flex items-center ml-auto">
                            {/* Backend Status Indicator */}
                            <div className="hidden md:flex items-center space-x-2 mr-4">
                                <StatusDotIcon size={8} online={isOnline} />
                                <span className="text-sm text-gray-600">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>

                            {/* Authentication Section */}
                            {isAuthenticated ? (
                                /* Authenticated User Menu */
                                <div className="relative group">
                                    <button className={`flex items-center transition-colors ${isOfflineAccount
                                        ? 'text-yellow-600 hover:text-yellow-700 sm:text-gray-700 sm:hover:text-blue-600'
                                        : 'text-gray-700 hover:text-blue-600'
                                        }`}>
                                        <UserIcon size={20} className="mr-2" />
                                        <div className="hidden sm:flex items-center">
                                            <span>{user?.username}</span>
                                            {isOfflineAccount && (
                                                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Dropdown menu */}
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-1">
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <UserIcon size={16} className="mr-3" />
                                                Profile
                                            </Link>
                                            {isOfflineAccount && isOnline && (
                                                <button
                                                    onClick={() => authEvents.openRegister()}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                                                >
                                                    <RefreshIcon size={16} className="mr-3 flex-shrink-0" />
                                                    <span>Switch to Online</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={handleLogout}
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
                                    onClick={isOnline ? authEvents.openLogin : authEvents.openRegister}
                                    className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    {isOnline ? 'Login' : 'Create offline account'}
                                </button>
                            )}                            {/* Mobile menu button */}
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
                                        {isOfflineAccount && isOnline && (
                                            <button
                                                onClick={() => {
                                                    authEvents.openRegister();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-left text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                            >
                                                <RefreshIcon size={20} className="mr-3 flex-shrink-0" />
                                                <span>Switch to Online</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                handleLogout();
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
                                            if (isOnline) {
                                                authEvents.openLogin();
                                            } else {
                                                authEvents.openRegister();
                                            }
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <UserIcon size={20} className="mr-3" />
                                        {isOnline ? 'Login' : 'Create offline account'}
                                    </button>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content*/}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
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

            {/* Offline Account Warning Dialog */}
            <OfflineAccountWarning
                isOpen={showOfflineWarning}
                onClose={() => setShowOfflineWarning(false)}
                onConfirmLogout={handleConfirmLogout}
                username={user?.username || ''}
            />

            {/* Pending Actions Warning Dialog */}
            <PendingActionsWarning
                isOpen={showPendingActionsWarning}
                onClose={() => setShowPendingActionsWarning(false)}
                onConfirmLogout={handleConfirmLogout}
                username={user?.username || ''}
                pendingActionsCount={pendingActionsCount}
            />

            {/* Floating Auth Button (only show if not authenticated) */}
            {!isAuthenticated && <FloatingAuthButton />}

            {/* Switch to Online Button (only show if offline account is active) */}
            <SwitchToOnlineButton />
        </div>
    );
};
