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

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="dashboard">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <div className="main-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;