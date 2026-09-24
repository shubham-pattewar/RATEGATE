import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { EndpointDetailPage } from './pages/EndpointDetailPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Apply saved theme preference on first load.
function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem('rg_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark) || !saved) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return null;
}

/** Root route: Shows LandingPage to public visitors, DashboardPage to logged-in users */
function RootRoute() {
  const { user } = useAuth();
  if (user === undefined) return null; // loading auth state
  if (user) {
    return <DashboardPage />;
  }
  return <LandingPage />;
}

/** Redirects unauthenticated users to /login. */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null; // still loading
  if (user === null) return <Navigate to="/login" replace />;
  return children;
}

/** Redirects authenticated users away from auth pages. */
function RedirectIfAuthed({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (user !== null) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeInitializer />
        <BrowserRouter>
          <Routes>
            {/* Public Home & Landing */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* Auth */}
            <Route
              path="/login"
              element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>}
            />
            <Route
              path="/signup"
              element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>}
            />

            {/* Authenticated Dashboard */}
            <Route
              path="/dashboard"
              element={<RequireAuth><DashboardPage /></RequireAuth>}
            />
            <Route
              path="/endpoints/:id"
              element={<RequireAuth><EndpointDetailPage /></RequireAuth>}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
