import React, { useState, useRef } from 'react';
import axios from 'axios';

const BulkEmail = () => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv', 'docx', 'doc'].includes(fileType)) {
        setFile(selectedFile);
        setAlert({ type: '', message: '' });
      } else {
        setAlert({ 
          type: 'error', 
          message: 'Please upload a valid Excel (.xlsx, .xls), CSV (.csv), or Word (.docx, .doc) file' 
        });
        setFile(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: '', message: '' });

    if (!file) {
      setAlert({ type: 'error', message: 'Please upload a file with recipient data' });
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);

      const response = await axios.post('/api/emails/send-bulk', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAlert({ 
        type: 'success', 
        message: `Bulk email campaign created successfully! Campaign ID: ${response.data.campaignId}` 
      });
      setFormData({ name: '', subject: '', message: '' });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to create bulk email campaign' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#F1F5F9' }}>Bulk Email Campaign</h2>
      
      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label className="form-label">Campaign Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter campaign name"
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
            placeholder="Enter your message (use {{name}} to personalize with recipient's name)"
            required
          />
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.5rem' }}>
            💡 Tip: Use {"{{name}}"} in your message to automatically insert each recipient's name
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Upload Recipients File</label>
          <div
            className={`file-upload ${dragOver ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.docx,.doc"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />
            {file ? (
              <div className="text-center">
                <div className="text-green-600 mb-2">✅ File selected:</div>
                <div className="font-semibold">{file.name}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Click to change file
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <div className="font-semibold mb-2">
                  Drop your file here or click to browse
                </div>
                <div className="text-sm text-gray-600">
                  Supports: Excel (.xlsx, .xls), CSV (.csv), Word (.docx, .doc)
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">File Format Requirements:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Excel/CSV:</strong> Must have columns "Name" and "Email"</li>
              <li>• <strong>Word:</strong> Should contain email addresses (will be extracted automatically)</li>
              <li>• First row should contain headers (for Excel/CSV)</li>
            </ul>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              Creating Campaign...
            </div>
          ) : (
            'Create Bulk Email Campaign'
          )}
        </button>
      </form>
    </div>
  );
};

export default BulkEmail;