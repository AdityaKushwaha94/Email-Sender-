import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaShieldAlt, 
  FaUser, 
  FaSignOutAlt, 
  FaBell, 
  FaSearch 
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const styles = {
    navbar: {
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #2d2d2d',
      padding: '0 2rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '72px',
      maxWidth: '1440px',
      margin: '0 auto'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logo: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '-0.025em',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    centerSection: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      maxWidth: '400px',
      margin: '0 2rem'
    },
    searchContainer: {
      position: 'relative',
      width: '100%'
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.5rem',
      border: '2px solid #374151',
      borderRadius: '12px',
      fontSize: '0.875rem',
      backgroundColor: '#111827',
      color: '#ffffff',
      transition: 'all 0.2s ease-in-out',
      outline: 'none'
    },
    searchIcon: {
      position: 'absolute',
      left: '0.875rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      fontSize: '0.875rem'
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    notificationButton: {
      position: 'relative',
      padding: '0.75rem',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      color: '#9ca3af'
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '0.5rem 1rem',
      backgroundColor: '#111827',
      borderRadius: '12px',
      border: '2px solid #374151'
    },
    userAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#000000',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    userName: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#ffffff',
      lineHeight: '1.2'
    },
    userRole: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      lineHeight: '1.2'
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.75rem 1rem',
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '2px solid #374151',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <div style={styles.logo}>
            <FaShieldAlt color="#ffffff" size={24} />
            Email Sender Pro
          </div>
        </div>

        <div style={styles.centerSection}>
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search campaigns, templates, contacts..."
              style={styles.searchInput}
              onFocus={(e) => {
                e.target.style.borderColor = '#ffffff';
                e.target.style.backgroundColor = '#1a1a1a';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#374151';
                e.target.style.backgroundColor = '#111827';
              }}
            />
          </div>
        </div>

        <div style={styles.rightSection}>
          <button
            style={styles.notificationButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#374151';
              e.target.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#9ca3af';
            }}
          >
            <FaBell size={18} />
            <div style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: '#dc2626',
              borderRadius: '50%'
            }}></div>
          </button>

          <div style={styles.userSection}>
            <div style={styles.userAvatar}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>
                {user?.name || 'User'}
              </span>
              <span style={styles.userRole}>
                Campaign Manager
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.color = '#ffffff';
              e.target.style.borderColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#ffffff';
              e.target.style.borderColor = '#374151';
            }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;