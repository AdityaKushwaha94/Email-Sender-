import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EmailVerification from './EmailVerification';
import SingleEmail from './email/SingleEmail';
import MultipleEmail from './email/MultipleEmail';
import BulkEmail from './email/BulkEmail';
import Campaigns from './Campaigns';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('single-email');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check email verification status on component mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://email-sender-gefj.onrender.com';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/email-verification/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVerificationStatus(response.data);
      
      // Don't force redirect to verification unless explicitly needed
      // User can manually navigate to email verification if needed
      
    } catch (error) {
      // Silently handle error - don't force redirect
      setVerificationStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#94A3B8'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    switch (activeSection) {
      case 'email-verification':
        return <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('single-email');
        }} />;
      case 'single-email':
        return verificationStatus?.isVerified ? <SingleEmail /> : <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('single-email');
        }} />;
      case 'multiple-email':
        return verificationStatus?.isVerified ? <MultipleEmail /> : <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('multiple-email');
        }} />;
      case 'bulk-email':
        return verificationStatus?.isVerified ? <BulkEmail /> : <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('bulk-email');
        }} />;
      case 'campaigns':
        return verificationStatus?.isVerified ? <Campaigns /> : <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('campaigns');
        }} />;
      default:
        return <EmailVerification onVerificationComplete={() => {
          checkVerificationStatus();
          setActiveSection('single-email');
        }} />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'email-verification':
        return 'Email Verification';
      case 'single-email':
        return 'Send Single Email';
      case 'multiple-email':
        return 'Send Multiple Emails';
      case 'bulk-email':
        return 'Bulk Email Campaign';
      case 'campaigns':
        return 'Campaign Analytics';
      default:
        return 'Email Verification';
    }
  };

  const styles = {
    dashboard: {
      display: 'flex',
      minHeight: 'calc(100vh - 72px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    mainContent: {
      flex: 1,
      backgroundColor: '#0F172A',
      overflow: 'auto'
    },
    contentHeader: {
      backgroundColor: '#1E293B',
      padding: '2rem 2.5rem',
      borderBottom: '1px solid #334155',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#F1F5F9',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    breadcrumb: {
      fontSize: '0.875rem',
      color: '#94A3B8',
      fontWeight: '500'
    },
    contentContainer: {
      padding: '0 2.5rem 2.5rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.dashboard}>
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div style={styles.mainContent}>
          <div style={styles.contentHeader}>
            <h1 style={styles.sectionTitle}>
              {getSectionTitle()}
            </h1>
            <p style={styles.breadcrumb}>
              Dashboard / Email Management / {getSectionTitle()}
            </p>
          </div>
          
          <div style={styles.contentContainer}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;