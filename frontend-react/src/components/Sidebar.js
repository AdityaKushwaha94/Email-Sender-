import React from 'react';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'single-email', label: '📧 Send to 1 Person', icon: '👤' },
    { id: 'multiple-email', label: '📧 Send to Up to 10', icon: '👥' },
    { id: 'bulk-email', label: '📊 Bulk Email (File)', icon: '📄' },
    { id: 'campaigns', label: '📈 My Campaigns', icon: '📈' },
  ];

  return (
    <aside className="sidebar">
      <ul className="menu">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setActiveSection(item.id)}
              className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;