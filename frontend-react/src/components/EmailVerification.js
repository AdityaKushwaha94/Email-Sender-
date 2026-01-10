import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios for this component
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://email-sender-gefj.onrender.com';
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  withCredentials: true
});

// Track ongoing requests to prevent duplicates
let ongoingSendOtpRequest = null;
let ongoingResendOtpRequest = null;

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const EmailVerification = ({ onVerificationComplete }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: OTP, 3: Verified
  const [formData, setFormData] = useState({
    email: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check verification status on component mount
  useEffect(() => {
    fetchVerificationStatus();
    
    // Cleanup function to cancel ongoing requests when component unmounts
    return () => {
      if (ongoingSendOtpRequest) {
        ongoingSendOtpRequest = null;
      }
      if (ongoingResendOtpRequest) {
        ongoingResendOtpRequest = null;
      }
    };
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/email-verification/status');
      setVerificationStatus(response.data);
      
      if (response.data.isVerified) {
        setStep(3);
        setFormData({ email: response.data.senderEmail || '' });
      } else {
        // Always start at step 1 for unverified users
        setStep(1);
        if (response.data.senderEmail) {
          setFormData({ email: response.data.senderEmail });
        }
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: 'Failed to load verification status' 
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      email: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate requests
    if (ongoingSendOtpRequest || loading) {
      return;
    }
    
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      // Create and track the request
      ongoingSendOtpRequest = axiosInstance.post('/api/email-verification/send-otp', formData);
      
      await ongoingSendOtpRequest;
      
      setAlert({ 
        type: 'success', 
        message: `OTP sent successfully to ${formData.email}! Check your inbox.` 
      });
      setStep(2);
    } catch (error) {
      // Handle cancelled requests gracefully
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setAlert({ 
          type: 'error', 
          message: 'Request timeout. Please check your connection and try again.' 
        });
      } else {
        setAlert({ 
          type: 'error', 
          message: error.response?.data?.error || 'Failed to send OTP' 
        });
      }
    } finally {
      ongoingSendOtpRequest = null;
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await axiosInstance.post('/api/email-verification/verify-otp', { otp });
      setAlert({ 
        type: 'success', 
        message: 'Email verified successfully! You can now send emails from your account.' 
      });
      setStep(3);
      fetchVerificationStatus(); // Refresh status
      
      // Call the completion callback if provided
      if (onVerificationComplete) {
        setTimeout(() => {
          onVerificationComplete();
        }, 2000); // Give user time to see success message
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Invalid OTP. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || ongoingResendOtpRequest || loading) return;
    
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      // Create and track the request
      ongoingResendOtpRequest = axiosInstance.post('/api/email-verification/resend-otp');
      
      const response = await ongoingResendOtpRequest;
      
      setAlert({ 
        type: 'success', 
        message: 'OTP resent successfully! Check your inbox.' 
      });
      setResendCooldown(60);
      
      // Start countdown
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      // Handle cancelled requests gracefully
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setAlert({ 
          type: 'error', 
          message: 'Request timeout. Please check your connection and try again.' 
        });
      } else {
        setAlert({ 
          type: 'error', 
          message: error.response?.data?.error || error.message || 'Failed to resend OTP'
        });
      }
    } finally {
      ongoingResendOtpRequest = null;
      setLoading(false);
    }
  };
  

  const handleEditEmail = () => {
    setStep(1);
    setOtp('');
    setAlert({ type: '', message: '' });
  };

  const testEmailConfig = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/email-verification/test-email');
      setAlert({
        type: 'success',
        message: `Email configuration is working! Using: ${response.data.emailUser}`
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: `Email configuration error: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    if (!window.confirm('Are you sure you want to remove your email credentials? You will need to verify again to send emails.')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete('/api/email-verification/remove');
      setAlert({ 
        type: 'success', 
        message: 'Email credentials removed successfully.' 
      });
      setStep(1);
      setFormData({ email: '' });
      setOtp('');
      fetchVerificationStatus();
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to remove credentials' 
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '2rem',
      gap: '1rem'
    },
    step: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      fontSize: '0.875rem',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    activeStep: {
      backgroundColor: '#3B82F6',
      color: '#FFFFFF'
    },
    completedStep: {
      backgroundColor: '#10B981',
      color: '#FFFFFF'
    },
    inactiveStep: {
      backgroundColor: '#374151',
      color: '#9CA3AF'
    },
    card: {
      backgroundColor: '#1E293B',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid #334155',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#F1F5F9',
      marginBottom: '1rem',
      textAlign: 'center'
    },
    subtitle: {
      color: '#94A3B8',
      textAlign: 'center',
      marginBottom: '2rem',
      fontSize: '0.875rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#F1F5F9',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #334155',
      borderRadius: '8px',
      backgroundColor: '#0F172A',
      color: '#F1F5F9',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box'
    },
    otpInput: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #334155',
      borderRadius: '8px',
      backgroundColor: '#0F172A',
      color: '#F1F5F9',
      fontSize: '1.5rem',
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: '0.25em',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#3B82F6',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      border: '1px solid #374151',
      color: '#94A3B8'
    },
    buttonDanger: {
      backgroundColor: '#EF4444',
      color: '#FFFFFF'
    },
    alert: {
      padding: '0.75rem 1rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    alertSuccess: {
      backgroundColor: '#065F46',
      color: '#10B981',
      border: '1px solid #10B981'
    },
    alertError: {
      backgroundColor: '#7F1D1D',
      color: '#F87171',
      border: '1px solid #F87171'
    },
    verifiedCard: {
      backgroundColor: '#065F46',
      border: '1px solid #10B981'
    },
    verifiedTitle: {
      color: '#10B981'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '2rem'
    },
    infoItem: {
      backgroundColor: '#0F172A',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #334155'
    },
    infoLabel: {
      fontSize: '0.75rem',
      color: '#94A3B8',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    infoValue: {
      fontSize: '0.875rem',
      color: '#F1F5F9',
      fontWeight: '500',
      marginTop: '0.25rem'
    },
    helpText: {
      fontSize: '0.75rem',
      color: '#64748B',
      marginTop: '0.5rem'
    }
  };

  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      <div style={{
        ...styles.step,
        ...(step >= 1 ? (step === 1 ? styles.activeStep : styles.completedStep) : styles.inactiveStep)
      }}>
        📧 Setup
      </div>
      <div style={{
        ...styles.step,
        ...(step >= 2 ? (step === 2 ? styles.activeStep : styles.completedStep) : styles.inactiveStep)
      }}>
        🔐 Verify OTP
      </div>
      <div style={{
        ...styles.step,
        ...(step >= 3 ? styles.activeStep : styles.inactiveStep)
      }}>
        ✅ Verified
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Verify Your Email</h2>
      <p style={styles.subtitle}>
        Enter your email address to receive a verification code
      </p>
      
      <form onSubmit={handleSendOTP}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Your Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            placeholder="your.email@example.com"
            required
          />
          <div style={styles.helpText}>
            We'll send a verification code to this email address
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Sending Code...' : '📨 Send Verification Code'}
        </button>
      </form>
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            onClick={testEmailConfig}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              fontSize: '0.75rem',
              padding: '0.5rem 1rem'
            }}
          >
            🔧 Test Email Configuration
          </button>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Enter Verification Code</h2>
      <p style={styles.subtitle}>
        We sent a 6-digit code to <strong>{formData.email}</strong>
      </p>
      
      <form onSubmit={handleVerifyOTP}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Verification Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={styles.otpInput}
            placeholder="123456"
            maxLength="6"
            required
          />
          <div style={styles.helpText}>
            Enter the 6-digit code sent to your email (expires in 5 minutes)
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || otp.length !== 6}
          style={{
            ...styles.button,
            opacity: (loading || otp.length !== 6) ? 0.7 : 1
          }}
        >
          {loading ? '🔄 Verifying...' : '✅ Verify Code'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={handleEditEmail}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            flex: '1',
            maxWidth: '200px'
          }}
        >
          ✏️ Edit Email
        </button>
        <button 
          onClick={handleResendOTP}
          disabled={resendCooldown > 0}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            opacity: resendCooldown > 0 ? 0.5 : 1,
            flex: '1',
            maxWidth: '200px'
          }}
        >
          {resendCooldown > 0 
            ? `🕐 Resend in ${resendCooldown}s` 
            : '📨 Resend Code'
          }
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ ...styles.card, ...styles.verifiedCard }}>
      <h2 style={{ ...styles.title, ...styles.verifiedTitle }}>✅ Email Verified!</h2>
      <p style={styles.subtitle}>
        Your email is now verified and ready to send emails
      </p>
      
      <div style={styles.infoGrid}>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Email Address</div>
          <div style={styles.infoValue}>{verificationStatus?.senderEmail}</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Status</div>
          <div style={styles.infoValue}>Verified ✅</div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Verified On</div>
          <div style={styles.infoValue}>
            {verificationStatus?.verifiedAt 
              ? new Date(verificationStatus.verifiedAt).toLocaleDateString()
              : 'Recently'
            }
          </div>
        </div>
        <div style={styles.infoItem}>
          <div style={styles.infoLabel}>Emails Sent From</div>
          <div style={styles.infoValue}>System Email</div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ ...styles.subtitle, marginBottom: '2rem' }}>
          🎉 Emails will be sent from our system with your email as reply-to!
        </p>
        
        <button 
          onClick={handleRemoveCredentials}
          disabled={loading}
          style={{
            ...styles.button,
            ...styles.buttonDanger,
            width: 'auto',
            padding: '0.5rem 1rem',
            fontSize: '0.75rem'
          }}
        >
          🗑️ Remove Credentials
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {renderStepIndicator()}
      
      {alert.message && (
        <div style={{
          ...styles.alert,
          ...(alert.type === 'success' ? styles.alertSuccess : styles.alertError)
        }}>
          {alert.message}
        </div>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};

export default EmailVerification;