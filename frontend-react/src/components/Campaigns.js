import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await axios.get('/api/emails/campaigns');
      setCampaigns(response.data);
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: 'Failed to load campaigns' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { color: '#065f46', backgroundColor: '#d1fae5' };
      case 'processing': return { color: '#92400e', backgroundColor: '#fef3c7' };
      case 'failed': return { color: '#991b1b', backgroundColor: '#fee2e2' };
      case 'pending': return { color: '#1e40af', backgroundColor: '#dbeafe' };
      default: return { color: '#374151', backgroundColor: '#f3f4f6' };
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading campaigns...
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>My Email Campaigns</h2>
      
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>No campaigns yet</h3>
          <p style={{ color: '#6b7280' }}>Create your first email campaign to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{campaign.name}</h3>
                  <p style={{ color: '#6b7280' }}>{campaign.subject}</p>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  ...getStatusColor(campaign.status)
                }}>
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '1rem', 
                fontSize: '0.875rem' 
              }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Total Recipients:</span>
                  <div style={{ fontWeight: '600' }}>{campaign.totalRecipients || 0}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Sent:</span>
                  <div style={{ fontWeight: '600', color: '#16a34a' }}>{campaign.sentCount || 0}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Failed:</span>
                  <div style={{ fontWeight: '600', color: '#dc2626' }}>{campaign.failedCount || 0}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Created:</span>
                  <div style={{ fontWeight: '600' }}>
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {campaign.message && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '0.375rem' 
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    {campaign.message.substring(0, 150)}
                    {campaign.message.length > 150 && '...'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns;