# YVI Soft Frontend

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-brightgreen.svg)](https://vitejs.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.7-purple.svg)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, responsive business website for YVI Soft Solutions - delivering innovative technology solutions across AI, Web Development, Mobile Apps, Oracle, RPA, and UI/UX design.

## 🚀 Features

- **Modern UI/UX**: Responsive design with Bootstrap 5
- **Smooth Animations**: AOS scroll animations
- **Interactive Components**: Swiper carousel, mobile menu
- **Contact Form**: Real-time validation with Supabase backend
- **Email Integration**: Automated notifications
- **Theme Customization**: 6 color themes
- **Performance Optimized**: Vite build tool
- **SEO Friendly**: Semantic HTML structure

## 🛠️ Technology Stack

### Frontend
- **React** 19.1.0 - UI framework
- **Vite** 7.0.0 - Build tool and development server
- **Bootstrap** 5.3.7 - CSS framework
- **React Bootstrap** 2.10.10 - Bootstrap components for React
- **React Router DOM** 7.6.3 - Client-side routing
- **Swiper** 11.2.10 - Touch slider components
- **AOS** 2.3.4 - Scroll animations
- **Sass** - CSS preprocessor

### Backend Integration
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database management
- **Node.js/Express** - Email notification server
- **Nodemailer** - Email sending library

### Development Tools
- **ESLint** - Code linting and quality
- **Axios** 1.11.0 - HTTP client
- **Vite Plugin React** - React integration

## 📁 Project Structure

```
frontend/
├── public/                   # Static assets
│   ├── images/              # Image assets
│   └── videos/              # Video assets
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── About/
│   │   ├── Banner/
│   │   ├── Contact Info & Form/
│   │   ├── Footer/
│   │   ├── Header/
│   │   ├── Services/
│   │   └── ...
│   ├── config/              # Configuration files
│   ├── services/            # Service files (email service)
│   ├── styles/              # CSS and Sass files
│   ├── assets/              # Frontend assets
│   ├── App.jsx              # Main App component
│   └── main.jsx             # Entry point
├── index.html               # Main HTML file
├── package.json             # Frontend dependencies
├── vite.config.js           # Vite configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **Supabase** account (for backend functionality)

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install missing dependencies** (if needed)
   ```bash
   npm install aos
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 🗄️ Database Setup

### Contact Form Database

The contact form uses Supabase with PostgreSQL to store submissions. First, you'll need to set up a Supabase project and create the required table:

1. Create a Supabase account at [supabase.com](https://supabase.com/)
2. Create a new project
3. Get your project URL and anon key from the project settings
4. Create the contact_messages table using the SQL scripts in the Database folder

5. Set up environment variables in your `.env` file:

Create a `.env` file in the frontend directory with your actual credentials:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
# Update this to your deployed backend URL in production
VITE_BACKEND_URL=http://localhost:3001
```

You can use the `.env.example` file as a template:

```bash
cp .env.example .env
```

Then replace the placeholder values with your actual Supabase project URL and anon key.

### Configuration

Update Supabase credentials in `src/config/supabase.js` or use environment variables:

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
```

## 📧 Email Configuration

### Backend Email Server

The contact form sends email notifications in addition to storing data in the database. The frontend communicates with the backend email server via HTTP requests.

### Email Service Integration

The frontend sends contact form submissions to the backend email service via HTTP requests to the `/api/send-email` endpoint.

#### API Endpoint
- **URL**: `/api/send-email`
- **Method**: POST
- **Base URL**: Configurable via `VITE_BACKEND_URL` environment variable (defaults to `http://localhost:3001`)

For detailed setup instructions, see the backend documentation.

## 🎨 Theme Customization

The project supports 6 built-in color themes:

- **Blue** (default)
- **Green**
- **Red**
- **Orange**
- **Purple**
- **Pink**

Themes are managed via CSS variables in the styles directory.

## 🚀 Deployment

### Production Build

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Set up Supabase**
   - Create Supabase project
   - Create contact_messages table using scripts in Database folder
   - Configure environment variables

3. **Deploy to hosting platform**
   - Upload the `dist/` folder to your preferred static hosting service
   - Configure environment variables in your hosting platform

### GoDaddy Deployment

For GoDaddy hosting deployment:

1. **Prepare deployment files**
   ```bash
   npm run deploy:frontend
   ```
   This creates deployment files in the `deployment/httpdocs` directory.

2. **Upload files to GoDaddy**
   - Use FTP/SFTP or cPanel File Manager to upload contents of `deployment/httpdocs` to your GoDaddy `httpdocs` directory

3. **Verify deployment**
   - Visit your domain to ensure website loads correctly
   - Test contact form functionality

For detailed instructions, see `GODADDY_DEPLOYMENT_GUIDE.md` in the project root.

### Hosting Options

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **GoDaddy**
- **Any static hosting provider**

## 🔒 Security

### Critical: Never Commit Sensitive Files!

**Never commit `.env` files to version control!** They contain sensitive credentials that can compromise your systems.

### Environment Variables Security

All sensitive information should be stored in environment variables:

1. Copy `.env.example` to `.env`
2. Update `.env` with actual values
3. **Never commit `.env` to version control**
4. Add `.env` to `.gitignore` (already done)

The `.gitignore` file prevents `.env` files from being committed, but always double-check before pushing.

## 📚 Additional Documentation

- Refer to the main project README for overall architecture
- See the backend documentation for email server setup
- Check the Database folder for SQL setup scripts
- Refer to `GODADDY_DEPLOYMENT_GUIDE.md` for GoDaddy-specific deployment instructions
