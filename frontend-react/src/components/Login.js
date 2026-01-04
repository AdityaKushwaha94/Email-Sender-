import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaGoogle, 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaEye, 
  FaEyeSlash,
  FaArrowLeft,
  FaShieldAlt
} from 'react-icons/fa';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileLogin, setShowMobileLogin] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for errors in URL
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    console.log('Login component mounted, checking for token...', { token, isAuthenticated, errorParam });
    
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
    
    if (token) {
      console.log('Token found in URL, logging in...');
      login(token);
      navigate('/dashboard');
    } else if (isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard...');
      navigate('/dashboard');
    }
  }, [location, login, navigate, isAuthenticated]);

  const handleGoogleLogin = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://email-sender-2qkj.onrender.com';
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
      const response = await axios.post(endpoint, formData);
      
      if (response.data.token) {
        login(response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    card: {
      maxWidth: '440px',
      width: '100%',
      backgroundColor: '#1E293B',
      padding: '3rem 2.5rem',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      border: '1px solid #334155',
      position: 'relative',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2.5rem'
    },
    logo: {
      fontSize: '2.5rem',
      marginBottom: '1rem'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#F1F5F9',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#94A3B8',
      fontSize: '0.95rem',
      lineHeight: '1.5'
    },
    errorAlert: {
      backgroundColor: '#0F172A',
      border: '1px solid #dc2626',
      color: '#fca5a5',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontSize: '0.875rem',
      textAlign: 'center',
      fontWeight: '500'
    },
    inputGroup: {
      marginBottom: '1.5rem'
    },
    inputContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#F1F5F9',
      fontWeight: '600',
      fontSize: '0.875rem'
    },
    input: {
      width: '100%',
      padding: '0.875rem 1rem',
      paddingLeft: '2.75rem',
      border: '2px solid #334155',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease-in-out',
      backgroundColor: '#0F172A',
      color: '#F1F5F9',
      boxSizing: 'border-box'
    },
    inputIcon: {
      position: 'absolute',
      left: '0.875rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#94A3B8',
      fontSize: '1rem',
      pointerEvents: 'none'
    },
    passwordToggle: {
      position: 'absolute',
      right: '0.875rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#94A3B8',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    primaryButton: {
      width: '100%',
      padding: '0.875rem 1.5rem',
      backgroundColor: '#64748B',
      color: '#F1F5F9',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      marginBottom: '1rem',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    googleButton: {
      width: '100%',
      padding: '0.875rem 1.5rem',
      backgroundColor: 'transparent',
      color: '#F1F5F9',
      border: '2px solid #334155',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '1rem'
    },
    divider: {
      textAlign: 'center',
      margin: '1.5rem 0',
      position: 'relative'
    },
    dividerLine: {
      borderTop: '1px solid #334155',
      margin: '0'
    },
    dividerText: {
      backgroundColor: '#1E293B',
      color: '#94A3B8',
      padding: '0 1rem',
      fontSize: '0.875rem',
      position: 'absolute',
      top: '-0.6rem',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    textButton: {
      color: '#94A3B8',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.875rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <FaShieldAlt color="#ffffff" />
          </div>
          <h2 style={styles.title}>
            Email Sender Pro
          </h2>
          <p style={styles.subtitle}>
            {isSignup ? 'Create your account to get started' : 'Welcome back! Please sign in to continue'}
          </p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSubmit}>
          {isSignup && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Full Name
              </label>
              <div style={styles.inputContainer}>
                <FaUser style={styles.inputIcon} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={isSignup}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#64748B'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Email Address
            </label>
            <div style={styles.inputContainer}>
              <FaEnvelope style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#64748B'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {isSignup && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mobile Number <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>(Optional)</span>
              </label>
              <div style={styles.inputContainer}>
                <span style={{
                  ...styles.inputIcon,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '16px',
                  height: '16px',
                  fontSize: '0.875rem'
                }}>📱</span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#64748B'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Password
            </label>
            <div style={styles.inputContainer}>
              <FaLock style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#64748B'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
                placeholder="Enter your password"
              />
              <div style={styles.passwordToggle} onClick={togglePasswordVisibility}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryButton,
              backgroundColor: loading ? '#334155' : '#64748B',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#475569')}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#64748B')}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Processing...
              </>
            ) : (
              isSignup ? 'Create Account' : 'Sign In'
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              style={styles.textButton}
            >
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>

        <div style={styles.divider}>
          <hr style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          style={styles.googleButton}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#111827';
            e.target.style.borderColor = '#6b7280';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#374151';
          }}
        >
          <FaGoogle style={{ marginRight: '12px', color: '#ffffff' }} />
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af', 
            margin: '0',
            lineHeight: '1.5'
          }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;