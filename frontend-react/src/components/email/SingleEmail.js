import React, { useState } from 'react';
import axios from 'axios';

const SingleEmail = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await axios.post('/api/emails/send-single', formData);
      setAlert({ type: 'success', message: 'Email sent successfully!' });
      setFormData({ to: '', subject: '', message: '', name: '' });
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to send email' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#F1F5F9' }}>Send Email to 1 Person</h2>
      
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label">Recipient Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter recipient's name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter email address"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter email subject"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="form-input form-textarea"
            placeholder="Enter your message"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Sending...
            </div>
          ) : (
            'Send Email'
          )}
        </button>
      </form>
    </div>
  );
};

export default SingleEmail;