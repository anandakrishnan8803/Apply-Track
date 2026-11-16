import { useState } from 'react';

const AUTH_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'signup' ? 'signup' : 'login';
    const body =
      mode === 'signup'
        ? { name, email, password }
        : { email, password };

    try {
      const response = await fetch(`${AUTH_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not sign in');
      }

      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="auth-brand">ApplyTrack</p>

        <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-description">
          {mode === 'signup'
            ? 'Create an account to organize your job search.'
            : 'Sign in to continue tracking your applications.'}
        </p>

        {mode === 'signup' && (
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : mode === 'signup'
              ? 'Create account'
              : 'Sign in'}
        </button>

        <p className="auth-switch">
          {mode === 'signup' ? 'Already have an account?' : 'New to ApplyTrack?'}
          {' '}
          <button type="button" onClick={switchMode}>
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </main>
  );
}

export default Auth;