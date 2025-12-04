# YVI Soft Backend

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Node.js/Express backend server for the YVI Soft Solutions website, handling email notifications and API services.

## 🚀 Features

- **Email Notifications**: Automated email responses via GoDaddy SMTP
- **RESTful API**: Clean API endpoints for frontend communication
- **Environment Configuration**: Secure environment variable management
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Comprehensive error handling and logging
- **Development Tools**: Nodemon for auto-restart during development

## 🛠️ Technology Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Nodemailer** - Email sending library
- **Cors** - Cross-origin resource sharing middleware
- **Dotenv** - Environment variable management
- **Nodemon** - Development server with auto-restart

## 📁 Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Backend dependencies
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore file
├── README.md              # Backend documentation
└── INTEGRATION.md         # Integration guide
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- GoDaddy email account (for SMTP)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit the `.env` file with your actual credentials:
   ```env
   # ========================================
   # YVI Soft Backend Environment Variables
   # ========================================

   # Email Configuration
   # GoDaddy email credentials for sending contact form notifications
   EMAIL_USER=your-email@yvisoft.com
   EMAIL_PASS=your-email-password

   # Recipient email address for contact form submissions
   EMAIL_TO=sanjeevirr@yvisoft.com

   # Server Configuration
   PORT=3001

   # ========================================
   # Instructions
   # ========================================
   # 1. Replace placeholder values with actual credentials
   # 2. Never commit .env file to version control
   # 3. For production, set these as environment variables in your hosting platform
   ```

5. **Start the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 API Endpoints

### POST /api/send-email

Sends an email using the provided data.

**Request Body:**
```json
{
  "from": "sender@example.com",
  "to": "sanjeevirr@yvisoft.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>",
  "template": "contact-form",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Company Name",
    "phone": "123-456-7890",
    "subject": "Contact Subject",
    "message": "Message content",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "<email-message-id>",
  "message": "Email sent successfully"
}
```

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_USER` | SMTP username for sending emails | Required |
| `EMAIL_PASS` | SMTP password for sending emails | Required |
| `EMAIL_TO` | Default recipient email address | sanjeevirr@yvisoft.com |
| `PORT` | Port for the server to listen on | 3001 |

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start the development server with nodemon |

## 📧 Email Configuration

### GoDaddy SMTP Settings

The backend is configured to work with GoDaddy's SMTP service:

- **Host**: smtpout.secureserver.net
- **Port**: 465 (SSL)
- **Security**: SSL/TLS

### Other SMTP Providers

To use other email providers, update the transporter configuration in `server.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'your-smtp-host',
  port: your-port,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 🔒 Security

### Critical: Never Commit Sensitive Files!

**Never commit `.env` files to version control!** They contain sensitive credentials that can compromise your systems.

- Environment variables are used for sensitive data
- CORS is configured to allow frontend requests
- Input validation is performed on all API endpoints
- Error messages are sanitized to prevent information leakage

### Environment Variables Security

All sensitive information should be stored in environment variables:

1. Copy `.env.example` to `.env`
2. Update `.env` with actual values
3. **Never commit `.env` to version control**
4. Add `.env` to `.gitignore` (already done)

The `.gitignore` file prevents `.env` files from being committed, but always double-check before pushing.

## 🚀 Deployment

### Production Deployment

1. **Set environment variables**
   Configure environment variables in your hosting platform:
   - EMAIL_USER
   - EMAIL_PASS
   - EMAIL_TO
   - PORT (if different from default)

2. **Deploy to hosting platform**
   - **Render** (recommended)
   - **Heroku**
   - **DigitalOcean App Platform**
   - **Any Node.js hosting provider**

3. **Update frontend configuration**
   Update the `VITE_BACKEND_URL` environment variable in the frontend to point to your deployed backend.

### Health Check

The server includes a health check endpoint that can be used by hosting platforms:

```
GET /
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## 📚 Additional Documentation

- Refer to the main project README for overall architecture
- See the frontend documentation for integration details
- Check the Database folder for SQL setup scripts
- Refer to [INTEGRATION.md](INTEGRATION.md) for detailed integration guide