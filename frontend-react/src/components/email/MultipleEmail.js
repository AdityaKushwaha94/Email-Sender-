import React, { useState } from 'react';
import axios from 'axios';

const MultipleEmail = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [recipients, setRecipients] = useState([{ name: '', email: '' }]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRecipientChange = (index, field, value) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const addRecipient = () => {
    if (recipients.length < 10) {
      setRecipients([...recipients, { name: '', email: '' }]);
    }
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    // Filter out empty recipients
    const validRecipients = recipients.filter(r => r.name && r.email);
    
    if (validRecipients.length === 0) {
      setAlert({ type: 'error', message: 'Please add at least one valid recipient' });
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/emails/send-multiple', {
        ...formData,
        recipients: validRecipients
      });
      setAlert({ type: 'success', message: `Emails sent successfully to ${validRecipients.length} recipients!` });
      setFormData({ subject: '', message: '' });
      setRecipients([{ name: '', email: '' }]);
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to send emails' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#F1F5F9' }}>Send Email to Up to 10 People</h2>
      
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="form-label mb-0">Recipients ({recipients.length}/10)</label>
            <button
              type="button"
              onClick={addRecipient}
              disabled={recipients.length >= 10}
              className="btn btn-primary text-sm"
            >
              Add Recipient
            </button>
          </div>

          {recipients.map((recipient, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Name"
                value={recipient.name}
                onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                className="form-input flex-1"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={recipient.email}
                onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                className="form-input flex-1"
                required
              />
              {recipients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  className="btn btn-danger"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
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
            'Send Emails'
          )}
        </button>
      </form>
    </div>
  );
};

export default MultipleEmail;