# Email Sender React Frontend

A modern React frontend for the Email Sender application with support for:
- Single email sending
- Multiple email sending (up to 10 recipients)  
- Bulk email campaigns with file upload support
- Google OAuth authentication

## Features

### Email Sending Options
1. **Single Email**: Send personalized emails to one recipient
2. **Multiple Emails**: Send to up to 10 recipients at once
3. **Bulk Email**: Upload Excel/CSV/Word files for mass email campaigns

### File Upload Support
- **Excel (.xlsx, .xls)**: Must have "Name" and "Email" columns
- **CSV (.csv)**: Must have "Name" and "Email" columns  
- **Word (.docx, .doc)**: Email addresses are automatically extracted

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. The frontend will be available at `http://localhost:3000`

## Backend Integration

Make sure the backend server is running on `http://localhost:5000`. The React app is configured to proxy API requests to the backend.

## Authentication

The app uses Google OAuth for authentication. After login, you'll be redirected to the dashboard where you can:
- Send single emails
- Send multiple emails  
- Create bulk email campaigns
- View campaign history

## File Format Examples

### Excel/CSV Format
```
Name        | Email
John Doe    | john@example.com
Jane Smith  | jane@example.com
```

### Word Document
Just include email addresses anywhere in the document, and they'll be automatically extracted.

## Environment Variables

The frontend uses the backend proxy, so no additional environment variables are needed.