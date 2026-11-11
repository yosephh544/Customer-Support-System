import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogoPulse, EyeIcon, EyeOffIcon } from '../../components/icons/Icons';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { ApiError } from '../../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; details?: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);

    const identifier = usernameOrEmail.trim();
    if (!identifier || !password) {
      setErrorInfo({
        message: 'Please enter both your username/email and password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorInfo({
          message: err.message,
          details: err.errors,
        });
      } else {
        setErrorInfo({
          message: err?.message || 'Invalid username or password. Please verify your credentials.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    if (errorInfo) {
      setErrorInfo(null);
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Brand Hero Section */}
      <div className="login-hero-pane">
        <div className="hero-top-brand">
          <div className="hero-logo-box">
            <LogoPulse size={20} className="hero-logo-icon" />
          </div>
          <span className="hero-brand-title">DAF Support</span>
        </div>

        <div className="hero-center-content">
          <span className="hero-tagline">Customer Operations</span>
          <h1 className="hero-main-heading">
            Every customer conversation, confidently managed.
          </h1>
          <p className="hero-subtext">
            Plan outreach, capture feedback, and resolve blockers in one calm, accountable workspace.
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
          Enterprise workspace for customer operations teams
        </div>
      </div>

      {/* Right Sign-in Form Pane */}
      <div className="login-form-pane">
        <div className="login-form-card">
          <div className="login-form-header">
            <span className="login-welcome-tag">Welcome back</span>
            <h2 className="login-form-title">Sign in to your workspace</h2>
          </div>

          {errorInfo && (
            <Alert
              variant="error"
              message={errorInfo.message}
              details={errorInfo.details}
              onClose={() => setErrorInfo(null)}
              className="login-alert-spacing"
            />
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="work-email">
                Username or Email
              </label>
              <input
                id="work-email"
                type="text"
                className="form-input"
                placeholder="Enter your username or email"
                value={usernameOrEmail}
                onChange={(e) => handleInputChange(setUsernameOrEmail, e.target.value)}
                autoComplete="username"
                required
                disabled={isLoading}
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
                  onChange={(e) => handleInputChange(setPassword, e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="input-icon-right password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember this device</span>
              </label>
              <a
                href="#forgot"
                className="forgot-password-link"
                onClick={(e) => {
                  e.preventDefault();
                  setErrorInfo({
                    message: 'Password reset request: Please contact your system administrator to reset your account password.',
                  });
                }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="btn-signin-full"
            >
              Sign in securely
            </Button>
          </form>

          <div className="login-card-footer">
            Protected by DAF enterprise identity and access controls.
          </div>
        </div>
      </div>
    </div>
  );
};
