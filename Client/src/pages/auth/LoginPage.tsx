import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogoPulse, EyeIcon, EyeOffIcon, ShieldIcon } from '../../components/icons/Icons';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('jo');
  const [password, setPassword] = useState('P@ssw0rd');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!usernameOrEmail.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(usernameOrEmail.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="login-page-container">
      {/* Left Brand Hero Section */}
      <div className="login-hero-pane">
        <div className="hero-top-brand">
          <div className="hero-logo-box">
            <LogoPulse size={24} className="hero-logo-icon" />
          </div>
          <span className="hero-brand-title">DAF Support</span>
        </div>

        <div className="hero-center-content">
          <span className="hero-tagline">CUSTOMER OPERATIONS, SIMPLIFIED</span>
          <h1 className="hero-main-heading">
            Every customer conversation, confidently managed.
          </h1>
          <p className="hero-subtext">
            Plan outreach, capture feedback and resolve blockers in one calm, accountable workspace.
          </p>

          <div className="hero-metric-cards-row">
            <div className="hero-metric-card">
              <span className="hero-metric-val">92%</span>
              <span className="hero-metric-label">Weekly completion</span>
            </div>
            <div className="hero-metric-card">
              <span className="hero-metric-val">4.6</span>
              <span className="hero-metric-label">Average rating</span>
            </div>
            <div className="hero-metric-card">
              <span className="hero-metric-val">1</span>
              <span className="hero-metric-label">Open blocker</span>
            </div>
          </div>
        </div>

        <div className="hero-footer-note">
          Secure workspace for DAF customer teams
        </div>
      </div>

      {/* Right Sign-in Form Pane */}
      <div className="login-form-pane">
        <div className="login-form-card">
          <div className="login-form-header">
            <span className="login-welcome-tag">Welcome back</span>
            <h2 className="login-form-title">Sign in to your workspace</h2>
            <p className="login-form-subtitle">
              Use your DAF account or continue with company SSO.
            </p>
          </div>

          {/* SSO Button */}
          <button
            type="button"
            className="btn-sso"
            onClick={() => {
              setError('SSO is configured for corporate directory. Please sign in with your username/email below.');
            }}
          >
            <ShieldIcon size={18} />
            <span>Continue with SSO</span>
          </button>

          <div className="login-divider">
            <span className="divider-line" />
            <span className="divider-text">or sign in with email or username</span>
            <span className="divider-line" />
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="work-email">
                Work email or Username
              </label>
              <input
                id="work-email"
                type="text"
                className="form-input"
                placeholder="you@daf.com or username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-right-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember this device</span>
              </label>
              <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); setError('Contact your system administrator to reset credentials.'); }}>
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="btn-signin-full"
            >
              Sign in securely
            </Button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="demo-credentials-box">
            <span className="demo-label">Quick Sign-in:</span>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-pill admin"
                onClick={() => setDemoCredentials('jo', 'P@ssw0rd')}
              >
                Admin (jo)
              </button>
              <button
                type="button"
                className="demo-pill teamlead"
                onClick={() => setDemoCredentials('teamlead', 'P@ssw0rd')}
              >
                Team Lead
              </button>
              <button
                type="button"
                className="demo-pill agent"
                onClick={() => setDemoCredentials('agent', 'P@ssw0rd')}
              >
                Support Agent
              </button>
            </div>
          </div>

          <div className="login-card-footer">
            Protected by DAF identity and access controls.
          </div>
        </div>
      </div>
    </div>
  );
};

