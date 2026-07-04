import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { GymProvider } from './contexts/GymContext';
import { GymTracker } from './components/GymTracker';
import { AdminDashboard } from './components/AdminDashboard';

type View = 'app' | 'admin';

/**
 * Decides what to render based on auth state:
 *   - still resolving the session -> a lightweight loading screen
 *   - not signed in               -> the AuthScreen (login / signup)
 *   - signed in                   -> the tracker, or (for admins) the dashboard
 *
 * key={user.id} remounts GymProvider whenever the signed-in user changes, so
 * each account loads its own data fresh (no leftover state from a prior user).
 */
const AuthedApp: React.FC = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [view, setView] = useState<View>('app');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-600 truncate">{user.email}</span>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setView(v => (v === 'app' ? 'admin' : 'app'))}
              className="text-sm text-purple-700 font-medium hover:underline"
            >
              {view === 'app' ? 'Admin panel' : 'My workouts'}
            </button>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm text-green-700 font-medium hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {isAdmin && view === 'admin' ? (
        <AdminDashboard />
      ) : (
        <GymProvider key={user.id}>
          <GymTracker />
        </GymProvider>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}

export default App;
