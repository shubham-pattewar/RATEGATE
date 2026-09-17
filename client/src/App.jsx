import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return null;
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
            <Route
              path="/login"
              element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>}
            />
            <Route
              path="/signup"
              element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>}
            />
            <Route
              path="/"
              element={<RequireAuth><DashboardPage /></RequireAuth>}
            />
            <Route
              path="/endpoints/:id"
              element={<RequireAuth><EndpointDetailPage /></RequireAuth>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
