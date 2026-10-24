import React, { useState } from 'react';

interface AuthScreenProps {
  onLoginSuccess: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const VALID_USERNAME = 'Ariya0703';
const VALID_PASSWORD = 'aripriya';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedUser = username.trim();

    if (!trimmedUser || !password) {
      setError('Please enter both your Username and Password.');
      setIsSubmitting(false);
      return;
    }

    // Validate credentials (Ariya0703 / aripriya)
    if (
      trimmedUser.toLowerCase() === VALID_USERNAME.toLowerCase() &&
      password === VALID_PASSWORD
    ) {
      // Save authentication state
      localStorage.setItem('project_tracker_auth_session', 'authenticated');
      localStorage.setItem('project_tracker_logged_user', trimmedUser);
      onLoginSuccess();
    } else {
      setError('Invalid username or password. Please verify and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Top right theme toggle */}
      <div className="auth-top-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="auth-card">
        {/* Brand header */}
        <div className="auth-header">
          <div className="brand-dot-pulse">
            <span className="brand-dot" style={{ width: '10px', height: '10px' }} />
          </div>
          <h1 className="auth-title">Project Tracker</h1>
          <p className="auth-subtitle">Arijeet &amp; Priya Workspace</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error-banner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auth-username">
              Username / ID
            </label>
            <div className="input-with-icon">
              <svg
                className="input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="auth-username"
                type="text"
                className="form-input"
                placeholder="e.g. Ariya0703"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <div className="input-with-icon">
              <svg
                className="input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '8px', fontSize: '14px', fontWeight: 600 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="auth-footer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Secured workspace · PostgreSQL Live Sync</span>
        </div>
      </div>
    </div>
  );
};
