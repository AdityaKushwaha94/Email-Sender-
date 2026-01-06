import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import EmailVerification from './EmailVerification';
import SingleEmail from './email/SingleEmail';
import MultipleEmail from './email/MultipleEmail';
import BulkEmail from './email/BulkEmail';
import Campaigns from './Campaigns';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('email-verification');

  const renderContent = () => {
    switch (activeSection) {
      case 'email-verification':
        return <EmailVerification />;
      case 'single-email':
        return <SingleEmail />;
      case 'multiple-email':
        return <MultipleEmail />;
      case 'bulk-email':
        return <BulkEmail />;
      case 'campaigns':
        return <Campaigns />;
      default:
        return <EmailVerification />;
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