import React from 'react';
import {
  FiMail,
  FiUsers,
  FiUpload,
  FiBarChart2,
  FiSettings,
  FiLogOut
} from "react-icons/fi";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    {
      id: "single-email",
      label: "Single Email",
      icon: FiMail,
      color: "#4f46e5",
      description: "Send one email"
    },
    {
      id: "multiple-email",
      label: "Multiple Emails",
      icon: FiUsers,
      color: "#059669",
      description: "Send to ≤10 recipients"
    },
    {
      id: "bulk-email",
      label: "Bulk Campaign",
      icon: FiUpload,
      color: "#dc2626",
      description: "Upload email lists"
    },
    {
      id: "campaigns",
      label: "Campaign Analytics",
      icon: FiBarChart2,
      color: "#7c3aed",
      description: "View statistics"
    }
  ];

  const styles = {
    sidebar: {
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)',
      borderRight: '1px solid #2d2d2d',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      padding: '2rem 1.5rem 1.5rem',
      borderBottom: '1px solid #2d2d2d'
    },
    title: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#ffffff',
      margin: '0',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      margin: '0.25rem 0 0',
      fontWeight: '500'
    },
    menu: {
      flex: 1,
      padding: '1.5rem 0',
      listStyle: 'none',
      margin: 0
    },
    menuItem: {
      margin: '0.25rem 1rem',
      position: 'relative'
    },
    button: {
      width: '100%',
      padding: '1rem 1.25rem',
      background: 'transparent',
      border: 'none',
      borderRadius: '12px',
      color: '#d1d5db',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s ease-in-out',
      textAlign: 'left',
      position: 'relative',
      overflow: 'hidden'
    },
    activeButton: {
      background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
      color: '#000000',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
    },
    iconWrapper: {
      width: '20px',
      height: '20px',
      marginRight: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    textContent: {
      flex: 1
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    description: {
      display: 'block',
      fontSize: '0.75rem',
      opacity: '0.8',
      lineHeight: '1.2',
      marginTop: '2px'
    },
    footer: {
      padding: '1.5rem',
      borderTop: '1px solid #2d2d2d'
    },
    footerButton: {
      width: '100%',
      padding: '0.75rem 1rem',
      background: 'transparent',
      border: '1px solid #374151',
      borderRadius: '8px',
      color: '#d1d5db',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease-in-out',
      marginBottom: '0.5rem'
    }
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h2 style={styles.title}>Email Campaign</h2>
        <p style={styles.subtitle}>Management Dashboard</p>
      </div>
      
      <ul style={styles.menu}>
        {menuItems.map((item) => (
          <li key={item.id} style={styles.menuItem}>
            <button
              onClick={() => setActiveSection(item.id)}
              style={{
                ...styles.button,
                ...(activeSection === item.id ? styles.activeButton : {})
              }}
              onMouseOver={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = '#374151';
                  e.target.style.color = '#ffffff';
                }
              }}
              onMouseOut={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#d1d5db';
                }
              }}
            >
              <div style={styles.iconWrapper}>
                <item.icon 
                  size={18} 
                  color={activeSection === item.id ? '#000000' : item.color}
                />
              </div>
              <div style={styles.textContent}>
                <span style={styles.label}>{item.label}</span>
                <span style={styles.description}>{item.description}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div style={styles.footer}>
        <button
          style={styles.footerButton}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#374151';
            e.target.style.borderColor = '#6b7280';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.borderColor = '#374151';
          }}
        >
          <FiSettings style={{ marginRight: '8px' }} size={16} />
          Settings
        </button>
        <button
          style={{
            ...styles.footerButton,
            marginBottom: '0',
            color: '#ffffff',
            borderColor: '#374151'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#dc2626';
            e.target.style.color = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#f87171';
          }}
        >
          <FiLogOut style={{ marginRight: '8px' }} size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;