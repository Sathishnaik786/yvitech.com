# YVI Soft Solutions - Modern Business Website

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-brightgreen.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, responsive business website for YVI Soft Solutions - delivering innovative technology solutions across AI, Web Development, Mobile Apps, Oracle, RPA, and UI/UX design.

## 🏢 About YVI Soft Solutions

YVI Soft Solutions is a technology consulting firm specializing in providing cutting-edge solutions to businesses worldwide. Our expertise spans across multiple domains including Artificial Intelligence, Web Development, Mobile Applications, Oracle Financials, Robotic Process Automation, and UI/UX Design.

## 🚀 Project Overview

This repository contains the complete YVI Soft website, architecturally separated into frontend and backend components for optimal maintainability and scalability.

### 📁 Project Structure

```
yvi-soft/
├── frontend/           # React frontend application
├── backend/            # Node.js backend server
├── Database/           # SQL scripts for database setup
└── README.md           # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **React** 19.1.0 - Modern UI library
- **Vite** 7.0.0 - Next-generation frontend tooling
- **React Router DOM** 7.6.3 - Declarative routing
- **Bootstrap** 5.3.7 - Responsive CSS framework
- **React Bootstrap** 2.10.10 - Bootstrap components for React
- **Swiper** 11.2.10 - Modern touch slider
- **AOS** 2.3.4 - Animate on scroll library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Nodemailer** - Email sending library
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database management

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- Supabase account (for database functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yvi-soft
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### Development

To run the complete application in development mode:

```bash
# Start both frontend and backend simultaneously
npm run dev
```

Or start each component separately:

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **In a separate terminal, start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📁 Component Details

### Frontend ([frontend/](file://c:\Users\sathi\OneDrive\Desktop\NextGen_AI\YviSoft\YviSoft\frontend))
The frontend is a React application built with Vite, providing a modern, responsive user interface with:
- 6 customizable color themes
- Interactive components and animations
- Responsive design for all device sizes
- Contact form with real-time validation

### Backend ([backend/](file://c:\Users\sathi\OneDrive\Desktop\NextGen_AI\YviSoft\YviSoft\backend))
The backend is a Node.js/Express server that handles:
- Email notifications via GoDaddy SMTP
- Contact form data processing
- AI chat functionality with Google Gemini API integration
- API endpoints for frontend communication

### Database ([Database/](file://c:\Users\sathi\OneDrive\Desktop\NextGen_AI\YviSoft\YviSoft\Database))
Contains SQL scripts for setting up the Supabase PostgreSQL database:
- Table creation scripts
- Row Level Security policies
- Database schema updates

The chat functionality uses two existing tables:
- `chatbot_knowledge`: Stores categorized knowledge base information
- `chatbot_logs`: Records chat conversations for analysis

## 🎨 Features

- **Responsive Design**: Works on all device sizes
- **Multi-theme Support**: 6 color themes available
- **Contact Form**: With validation and database storage
- **Email Notifications**: Automated email responses
- **AI Chat Assistant**: Intelligent chatbot powered by Google Gemini with knowledge base integration for customer support
- **Modern UI**: Smooth animations and transitions
- **SEO Optimized**: Semantic HTML structure
- **Performance Focused**: Vite-powered fast development

## 📤 Deployment

This project includes automated deployment scripts for deploying to GoDaddy hosting with VPS and cPanel.

### Automated Deployment

1. **Build and prepare for deployment**
   ```bash
   # Build frontend and prepare backend deployment package
   npm run deploy
   ```

2. **Deploy components separately**
   - Frontend: Upload contents of `frontend/dist/` to GoDaddy cPanel
   - Backend: Upload contents of `yvi-soft-backend-deploy/` to GoDaddy VPS
   - Database: Supabase (already configured)

### Manual Deployment Steps

#### Frontend Deployment (cPanel)

1. **Build the frontend**
   ```bash
   npm run build:frontend
   ```

2. **Upload files to cPanel**
   - Connect to cPanel File Manager or use FTP
   - Upload all contents from `frontend/dist/` to your website root directory

#### Backend Deployment (VPS)

1. **Prepare backend deployment package**
   ```bash
   npm run deploy:backend
   ```

2. **Upload to VPS and configure**
   - Upload contents of `yvi-soft-backend-deploy/` to your VPS
   - Install dependencies and configure PM2
   - Set up reverse proxy and SSL

### Environment Configuration

Set up environment variables in each component's `.env` file:
- Frontend: Supabase credentials and backend URL
- Backend: Email SMTP credentials

#### Supabase Setup

To enable the contact form functionality, you need to set up a Supabase project:

1. Create a free account at [supabase.com](https://supabase.com/)
2. Create a new project
3. Get your Project URL and anon key from the API settings
4. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env`
5. Run the SQL scripts in the [Database/](Database/) directory to create the contact form table

For detailed instructions, see [SUPABASE_SETUP_GUIDE.md](documentation/SUPABASE_SETUP_GUIDE.md)

### GoDaddy Deployment

For complete deployment instructions to GoDaddy hosting with VPS and cPanel, see:
- [DEPLOYMENT_README.md](DEPLOYMENT_README.md) - Complete deployment guide
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [YVI_SOFT_GODADDY_DEPLOYMENT_PLAN.md](YVI_SOFT_GODADDY_DEPLOYMENT_PLAN.md) - Detailed deployment plan
- [GODADDY_DEPLOYMENT_GUIDE.md](documentation/GODADDY_DEPLOYMENT_GUIDE.md) - Original GoDaddy deployment guide

## 📚 Documentation

Project documentation has been organized into a central [documentation/](documentation) directory:
- [Documentation Directory](documentation)

Each component also has its own README:
- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/README.md)
- [Database Setup](Database/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

### Environment Variables

**Never commit `.env` files to version control!**

Environment files contain sensitive information such as:
- API keys
- Database credentials
- Email passwords
- Service tokens

Always use `.env.example` files to document required variables without exposing actual values.

### Git Hooks

This repository includes a `.gitignore` file that prevents sensitive files from being committed. Always verify that sensitive files are not tracked before pushing changes.

## 📞 Support

For support, contact:
- Email: info@yvisoft.com
- Phone: +91-8317622417