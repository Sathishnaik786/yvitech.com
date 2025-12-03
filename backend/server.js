// Simple Express server for handling email sending
// This server provides an API endpoint for sending emails from the contact form

import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';

// Configure dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend is live 🚀" });
});

// Health route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Middleware with production-ready CORS configuration
// Allow requests only from your frontend domain
const corsOptions = {
  origin: [
    'https://yvisoft.com',        // Production frontend domain
    'http://localhost:5173',      // Local development frontend
    'http://localhost:3000',      // Alternative local development port
    'http://127.0.0.1:5173',      // Alternative localhost format
    'http://127.0.0.1:3000'       // Alternative localhost format
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// If FRONTEND_URL is set in environment variables, add it to allowed origins
if (process.env.FRONTEND_URL) {
  corsOptions.origin.push(process.env.FRONTEND_URL);
}
 
// For development, be more permissive to avoid CORS issues
if (process.env.NODE_ENV !== 'production') {
  corsOptions.origin = true; // Allow all origins in development
}

app.use(cors(corsOptions));

// Enhanced middleware to parse JSON and handle errors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Chat routes
app.use('/api/chat', chatRoutes);

// Serve frontend build if it exists
try {
  const frontendBuildPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendBuildPath));
  
  // Serve index.html for all other routes (SPA fallback)
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} catch (error) {
  console.log("Frontend build not found, skipping static file serving");
}

// Create email transporter with retry mechanism for SMTP (ports 587/465)
let transporter;

// Initialize transporter with retry mechanism
const initializeTransporter = async () => {
  // Try port 587 with STARTTLS first
  const primaryConfig = {
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  };

  transporter = nodemailer.createTransport(primaryConfig);

  try {
    await transporter.verify();
    console.log('✅ Email transporter is ready with port 587');
  } catch (error) {
    console.error('❌ Email transporter error with port 587:', error);
    // Fallback to port 465
    console.log('🔄 Trying fallback configuration with port 465...');
    const fallbackConfig = {
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    };
    
    transporter = nodemailer.createTransport(fallbackConfig);
    
    try {
      await transporter.verify();
      console.log('✅ Email transporter fallback is ready with port 465');
    } catch (fallbackError) {
      console.error('❌ Email transporter fallback error with port 465:', fallbackError);
    }
  }
};

// Initialize transporter on server start
initializeTransporter();

// Email sending endpoint with comprehensive error handling
app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📧 Received email request:', req.body);
    
    // Ensure we always return JSON
    res.setHeader('Content-Type', 'application/json');
    
    const { to, from, subject, html, template, data } = req.body;
    
    // Validate required fields
    if (!from || !subject) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: from, subject' 
      });
    }
    
    // Use EMAIL_TO environment variable or default to sanjeevirr@yvisoft.com
    const recipientEmail = to || process.env.EMAIL_TO || 'sanjeevirr@yvisoft.com';
    
    // Use EMAIL_USER as the sender (from) address to ensure emails come from company email
    const senderEmail = process.env.EMAIL_USER || 'sanjeevirr@yvisoft.com';
    
    // Generate HTML content if using template
    let emailHtml = html;
    if (template === 'contact-form' && data) {
      emailHtml = generateContactFormEmail(data);
    }
    
    // Email options
    const mailOptions = {
      from: `"YVI Soft" <${senderEmail}>`, // Always send from company email with name
      to: recipientEmail,
      subject: subject,
      html: emailHtml,
      replyTo: from // Set user's email as reply-to address
    };
    
    // Send email with retry mechanism
    let info;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        break;
      } catch (sendError) {
        attempts++;
        console.log(`Attempt ${attempts} failed:`, sendError.message);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to send email after ${maxAttempts} attempts: ${sendError.message}`);
        }
        
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Always return proper JSON for success with messageId
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Always return proper JSON for error with details
    res.status(500).json({ 
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Generate HTML email for contact form submissions
function generateContactFormEmail(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">New Contact Form Submission</h2>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Contact Information</h3>
          <p><strong>Name:</strong> ${data.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${data.email || 'N/A'}</p>
          <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
          <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Message Details</h3>
          <p><strong>Subject:</strong> ${data.subject || 'N/A'}</p>
          <div>
            <strong>Message:</strong>
            <p style="background-color: white; padding: 10px; border-left: 4px solid #3498db; margin: 10px 0;">
              ${data.message || 'N/A'}
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
          <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 404 handler for API routes
// This should only catch undefined API routes, placed at the end
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ 
      success: false,
      error: 'Endpoint not found'
    });
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;