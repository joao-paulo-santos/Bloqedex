import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeStores, useAuthStore, useAppStore } from './infrastructure/stores';
import { Layout } from './components/layout/Layout';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { ToastContainer } from './components/common/ToastContainer';

// Feature imports
import { HomePage, PokedexPage, SharePage, ProfilePage } from './features';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  const isOnline = useAppStore(state => state.isOnline);

  useEffect(() => {
    // Initialize stores and database
    initializeStores().catch(console.error);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Offline indicator */}
        {!isOnline && <OfflineIndicator />}

        {/* Toast notifications */}
        <ToastContainer />

        <Routes>
          {/* Public home page - browse all Pokemon (no auth required) */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />

          {/* Public share route (no auth required) */}
          <Route path="/share/:shareToken" element={<Layout><SharePage /></Layout>} />

          {/* Protected routes */}
          <Route
            path="/pokedex"
            element={
              <ProtectedRoute>
                <Layout>
                  <PokedexPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
