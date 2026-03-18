import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { default as Login } from './pages/Login';
import { default as Register } from './pages/Register';
import { default as Dashboard } from './pages/Dashboard';
import { default as Vehicules } from './pages/Vehicules';
import { default as Admin } from './pages/Admin';

// Layout pour les pages protégées
function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-slate-600">Chargement...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header navigation */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
                        <span className="font-bold text-lg">AfriMobilis</span>
                    </div>
                    <nav className="hidden md:flex gap-6">
                        <a href="/dashboard" className="text-slate-600 hover:text-sky-600">Dashboard</a>
                        <a href="/vehicules" className="text-slate-600 hover:text-sky-600">Véhicules</a>
                        <a href="/admin" className="text-slate-600 hover:text-sky-600">Admin</a>
                    </nav>
                    <button
                        onClick={() => {/* TODO: logout */}}
                        className="text-slate-600 hover:text-red-600"
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedLayout>
                        <Dashboard />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/vehicules"
                element={
                    <ProtectedLayout>
                        <Vehicules />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedLayout>
                        <Admin />
                    </ProtectedLayout>
                }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
