# Email Sender Web Application

A full-stack web application for sending bulk emails with personalization, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

- **Google OAuth Integration**: Secure login with Google
- **Email/Password Authentication**: Traditional signup and login
- **Bulk Email Sending**: Send up to 1000 emails simultaneously
- **Excel Import**: Import recipient lists from Excel files
- **Email Personalization**: Customize emails with variables like {{name}}
- **Campaign Management**: Create, track, and manage email campaigns
- **User Blacklisting**: Block users from accessing the platform
- **Email Tracking**: Monitor sent/failed email counts
- **Custom SMTP**: Use your own email service credentials

## 📦 Project Structure

```
Email-Sender/
├── frontend/
│   ├── pages/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── signup.html
│   │   └── dashboard.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       └── dashboard.js
│
└── backend/
    ├── src/
    │   ├── server.js
    │   ├── models/
    │   │   ├── User.js
    │   │   └── EmailCampaign.js
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── emailRoutes.js
    │   │   └── userRoutes.js
    │   ├── controllers/
    │   │   └── emailController.js
    │   ├── middleware/
    │   │   └── auth.js
    │   └── utils/
    ├── config/
    │   └── passport.js
    ├── package.json
    └── .env.example
```

## 🛠️ Installation & Setup

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```
MONGODB_URI=mongodb://localhost:27017/email-sender
JWT_SECRET=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
PORT=5000
SESSION_SECRET=your_session_secret
```

5. Start MongoDB locally (or use MongoDB Atlas)

6. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Open `index.html` in your browser or use a local server:
```bash
# Using Python 3
python -m http.server 3000

# Or using Node.js
npx http-server -p 3000
```

## 🔑 Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web Application)
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## 📧 Gmail SMTP Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `.env` as `EMAIL_PASSWORD`

## 💾 Database Models

### User Schema
- `googleId`: Google OAuth ID
- `email`: User email (unique)
- `name`: Full name
- `password`: Hashed password (for email/password auth)
- `profilePhoto`: User's profile picture
- `isBlacklisted`: Blacklist flag
- `emailCredentials`: SMTP settings for user's email service

### EmailCampaign Schema
- `userId`: Reference to User
- `name`: Campaign name
- `subject`: Email subject
- `body`: Email HTML content
- `recipients`: Array of recipient objects with email, name, status
- `status`: draft, scheduled, running, completed, failed
- `isPersonalized`: Whether emails are personalized
- `sentCount`: Number of emails sent
- `failedCount`: Number of failed emails

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Emails
- `POST /api/emails/campaigns` - Create campaign
- `POST /api/emails/upload-excel` - Upload Excel file
- `POST /api/emails/campaigns/:id/send` - Send campaign
- `GET /api/emails/campaigns` - Get all campaigns
- `GET /api/emails/campaigns/:id` - Get campaign details

### Users
- `PUT /api/users/email-credentials` - Update email settings
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/:userId/blacklist` - Blacklist user

## 🎨 Frontend Features

### Pages
- **Home** (`index.html`): Landing page with features overview
- **Login** (`pages/login.html`): Email/password and Google login
- **Signup** (`pages/signup.html`): User registration
- **Dashboard** (`pages/dashboard.html`): Main application interface

### Dashboard Sections
1. **My Campaigns**: View all email campaigns with status and stats
2. **Create Campaign**: Create new campaigns with Excel import
3. **Settings**: Configure email SMTP credentials

## 🚀 Sending Emails at Scale

The application handles bulk email sending with:
- **Batch Processing**: Sends emails in batches of 100
- **Personalization**: Supports variable replacement using {{fieldName}}
- **Status Tracking**: Tracks sent/failed status for each recipient
- **Queue System**: Can be extended with Bull/Redis for better queue management

## 🔒 Security Features

- JWT authentication tokens
- Password hashing with bcrypt
- Google OAuth integration
- User blacklisting
- CORS protection
- Session management
- Secure password storage

## 📝 Excel File Format

Your Excel file should have the following columns:
```
| email              | name          | other_fields |
|--------------------|---------------|--------------|
| john@example.com   | John Doe      | ...          |
| jane@example.com   | Jane Smith    | ...          |
```

Use column names in templates: `Hello {{name}}, your email is {{email}}`

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### Gmail SMTP Error
- Use App Password, not regular password
- Enable "Less secure app access" if using regular Gmail password

### CORS Error
- Check FRONTEND_URL in backend .env
- Ensure credentials: true in fetch requests

### Google OAuth Not Working
- Verify Client ID and Secret
- Check redirect URI matches in Google Cloud Console

## 📚 Future Enhancements

- Email scheduling
- Template library
- Advanced analytics
- A/B testing
- Attachment support
- Email automation workflows
- Webhook support
- API rate limiting
- Email delivery webhooks

## 📄 License

MIT License

---

**Happy Email Sending! 📧**
