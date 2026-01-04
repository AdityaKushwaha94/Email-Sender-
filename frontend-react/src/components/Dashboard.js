import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SingleEmail from './email/SingleEmail';
import MultipleEmail from './email/MultipleEmail';
import BulkEmail from './email/BulkEmail';
import Campaigns from './Campaigns';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('single-email');

  const renderContent = () => {
    switch (activeSection) {
      case 'single-email':
        return <SingleEmail />;
      case 'multiple-email':
        return <MultipleEmail />;
      case 'bulk-email':
        return <BulkEmail />;
      case 'campaigns':
        return <Campaigns />;
      default:
        return <SingleEmail />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'single-email':
        return 'Send Single Email';
      case 'multiple-email':
        return 'Send Multiple Emails';
      case 'bulk-email':
        return 'Bulk Email Campaign';
      case 'campaigns':
        return 'Campaign Analytics';
      default:
        return 'Email Dashboard';
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
      backgroundColor: '#0f0f0f',
      overflow: 'auto'
    },
    contentHeader: {
      backgroundColor: '#1a1a1a',
      padding: '2rem 2.5rem',
      borderBottom: '1px solid #2d2d2d',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    breadcrumb: {
      fontSize: '0.875rem',
      color: '#9ca3af',
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