import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LogoPulse,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon,
  MailIcon,
  LockIcon,
  HeadphonesIcon,
  BarChartIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '../../components/icons/Icons';
import { Alert } from '../../components/common/Alert';
import { ApiError } from '../../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { resolvedTheme, setThemeMode } = useTheme();
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
      {/* Background Ambient Contours & Waves */}
      <div className="login-ambient-backdrop" aria-hidden="true">
        <div className="ambient-curve ambient-curve-1" />
        <div className="ambient-curve ambient-curve-2" />
        <div className="ambient-curve ambient-curve-3" />
      </div>

      <div className="login-layout-wrapper">
        {/* Left Hero Section: Headline, 3D Vector Graphic, and Trust Pillars */}
        <div className="login-hero-pane">
          {/* Top Brand Logo */}
          <div className="hero-top-brand">
            <div className="hero-logo-box">
              <LogoPulse size={18} className="hero-logo-icon" />
            </div>
            <span className="hero-brand-title">DAF Support</span>
          </div>

          {/* Main Hero Content */}
          <div className="hero-center-content">
            <div className="hero-category-pill">
              <span className="category-pulse-dot" />
              <span>Customer Support Platform</span>
            </div>

            <h1 className="hero-main-heading">
              Every conversation <span className="hero-accent-text">matters.</span>
            </h1>

            <p className="hero-subtext">
              Plan outreach, capture feedback, and resolve issues efficiently in one unified, accountable workspace.
            </p>

            {/* 3D Communication Centerpiece (Headphones + Chat Bubble + Orbital Glow) */}
            <div className="hero-visual-graphic">
              <div className="graphic-glow-ring" />
              <div className="graphic-speech-bubble">
                <span className="bubble-dot dot-1" />
                <span className="bubble-dot dot-2" />
                <span className="bubble-dot dot-3" />
              </div>

              <div className="headset-vector-wrap">
                <svg
                  className="headset-svg"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="DAF Support Operations"
                >
                  <defs>
                    <linearGradient id="headbandGrad" x1="20" y1="30" x2="180" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="var(--hero-graphic-grad-start, #30345C)" />
                      <stop offset="1" stopColor="var(--hero-graphic-grad-end, #686DA6)" />
                    </linearGradient>
                    <linearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="var(--hero-cup-grad-start, #20234B)" />
                      <stop offset="1" stopColor="var(--hero-cup-grad-end, #41477A)" />
                    </linearGradient>
                    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(32, 35, 75, 0.2)" />
                    </filter>
                  </defs>

                  {/* Outer Headband Arch */}
                  <path
                    d="M 45 108 C 42 42, 158 42, 155 108"
                    stroke="url(#headbandGrad)"
                    strokeWidth="15"
                    strokeLinecap="round"
                    filter="url(#softGlow)"
                  />
                  {/* Inner Headband Cushion */}
                  <path
                    d="M 58 104 C 56 58, 144 58, 142 104"
                    stroke="rgba(255, 255, 255, 0.28)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Left Ear Cup */}
                  <g transform="translate(30, 96)">
                    <rect x="0" y="0" width="28" height="52" rx="14" fill="url(#cupGrad)" filter="url(#softGlow)" />
                    <rect x="14" y="6" width="11" height="40" rx="5.5" fill="rgba(255, 255, 255, 0.22)" />
                    <circle cx="14" cy="26" r="4.5" fill="var(--hero-accent-color, #7D82B8)" />
                  </g>

                  {/* Right Ear Cup */}
                  <g transform="translate(142, 96)">
                    <rect x="0" y="0" width="28" height="52" rx="14" fill="url(#cupGrad)" filter="url(#softGlow)" />
                    <rect x="3" y="6" width="11" height="40" rx="5.5" fill="rgba(255, 255, 255, 0.22)" />
                    <circle cx="14" cy="26" r="4.5" fill="var(--hero-accent-color, #7D82B8)" />
                  </g>

                  {/* Microphone Stem */}
                  <path
                    d="M 44 130 C 44 165, 85 174, 105 170"
                    stroke="url(#headbandGrad)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  {/* Mic Capsule */}
                  <rect x="100" y="163" width="16" height="12" rx="6" fill="url(#cupGrad)" />
                  <circle cx="112" cy="169" r="2" fill="var(--hero-accent-color, #7D82B8)" />
                </svg>
              </div>
            </div>

            {/* Bottom 3 Trust / Feature Pillars */}
            <div className="hero-features-row">
              <div className="hero-feature-item">
                <div className="feature-item-icon">
                  <HeadphonesIcon size={16} />
                </div>
                <div className="feature-item-meta">
                  <span className="feature-item-title">24/7 Support</span>
                  <span className="feature-item-sub">Get Support Faster</span>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="feature-item-icon">
                  <BarChartIcon size={16} />
                </div>
                <div className="feature-item-meta">
                  <span className="feature-item-title">Real-Time</span>
                  <span className="feature-item-sub">Live Monitoring</span>
                </div>
              </div>

              <div className="hero-feature-item">
                <div className="feature-item-icon">
                  <ShieldCheckIcon size={16} />
                </div>
                <div className="feature-item-meta">
                  <span className="feature-item-title">Trusted Platform</span>
                  <span className="feature-item-sub">Build Trust Together</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="login-card-container">
          <div className="login-floating-card">
            {/* Top Right Theme Mode Toggle Pill */}
            <div className="card-top-controls">
              <div className="card-theme-pill" role="group" aria-label="Theme mode switcher">
                <button
                  type="button"
                  className={`theme-pill-btn ${resolvedTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setThemeMode('light')}
                  title="Switch to Light appearance"
                  aria-label="Light mode"
                >
                  <SunIcon size={13} />
                </button>
                <button
                  type="button"
                  className={`theme-pill-btn ${resolvedTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                  title="Switch to Dark appearance"
                  aria-label="Dark mode"
                >
                  <MoonIcon size={13} />
                </button>
              </div>
            </div>

            {/* Card Header Title & Subtitle */}
            <div className="login-card-header">
              <h2 className="login-card-title">Welcome back!</h2>
              <p className="login-card-subtitle">Sign in to your workspace</p>
            </div>

            {/* Error Notification Alert */}
            {errorInfo && (
              <Alert
                variant="error"
                message={errorInfo.message}
                details={errorInfo.details}
                onClose={() => setErrorInfo(null)}
                className="login-alert-spacing"
              />
            )}

            {/* Sign in Form */}
            <form onSubmit={handleSubmit} className="login-auth-form">
              {/* Username or Email Input with Left Mail Icon */}
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon-left">
                    <MailIcon size={16} />
                  </span>
                  <input
                    id="username-or-email"
                    type="text"
                    className="auth-input-field with-icon"
                    placeholder="Username or Email"
                    value={usernameOrEmail}
                    onChange={(e) => handleInputChange(setUsernameOrEmail, e.target.value)}
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    aria-label="Username or Email"
                  />
                </div>
              </div>

              {/* Password Input with Left Lock Icon & Right Eye Toggle */}
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon-left">
                    <LockIcon size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-field with-icon with-right-btn"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => handleInputChange(setPassword, e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="auth-input-btn-right"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox & Forgot Password Link */}
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
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
                  className="auth-forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorInfo({
                      message: 'Password reset request: Please contact your system administrator to reset your credentials.',
                    });
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Sign in Button */}
              <button
                type="submit"
                className="btn-auth-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <ArrowRightIcon size={15} className="btn-arrow-icon" />
                    <span>Sign in securely</span>
                  </>
                )}
              </button>
            </form>

            {/* Security Assurance Footer */}
            <div className="auth-card-security-footer">
              <ShieldCheckIcon size={14} className="security-shield-icon" />
              <span>Protected by DAF. Your data is always secure.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
