import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'signin' | 'signup';

/**
 * Login / signup screen. Shown whenever there is no authenticated user.
 * Single responsibility: collect credentials and delegate to AuthContext.
 */
export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setInfo(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">💪 Gym Tracker</h1>
        <p className="text-center text-gray-500 mb-6">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-green-600 font-medium hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
