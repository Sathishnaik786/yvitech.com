import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Supabase client for backend
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT, AI_CONFIG } from '../config/ai-config.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

const router = express.Router();

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(AI_CONFIG.gemini.apiKey || 'your-gemini-api-key-here');
const geminiModel = genAI.getGenerativeModel({ 
  model: AI_CONFIG.gemini.model || 'gemini-2.5-flash',
  generationConfig: {
    temperature: AI_CONFIG.gemini.temperature || 0.7,
    maxOutputTokens: AI_CONFIG.gemini.maxTokens || 1000
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Mock response for testing when MOCK_CHAT is enabled
    if (process.env.MOCK_CHAT === 'true') {
      return res.json({ 
        success: true, 
        response: "This is a mock response for testing purposes. In a production environment, this would be a response from our AI assistant.",
        sessionId: sessionId || generateSessionId()
      });
    }

    // Query knowledge base for relevant information
    let knowledgeBaseInfo = '';
    try {
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('chatbot_knowledge')
        .select('category, title, description')
        .limit(3);

      if (!knowledgeError && knowledgeData && knowledgeData.length > 0) {
        knowledgeBaseInfo = '\n\nRelevant information from our knowledge base:\n';
        knowledgeData.forEach(item => {
          knowledgeBaseInfo += `- ${item.title}: ${item.description}\n`;
        });
      }
    } catch (kbError) {
      console.log('Knowledge base query error (non-fatal):', kbError.message);
    }

    // Generate AI response with system prompt and knowledge base info using Gemini
    const fullPrompt = SYSTEM_PROMPT + knowledgeBaseInfo + '\n\nUser question: ' + message;
    
    const result = await geminiModel.generateContent(fullPrompt);
    const aiResponse = result.response.text();

    // Save chat to Supabase using chatbot_logs table
    const { data, error } = await supabase
      .from('chatbot_logs')
      .insert([
        {
          user_query: message,
          bot_response: aiResponse,
          matched_category: 'general',
          source: 'web_widget',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error saving chat to Supabase:', error);
    }

    // Return AI response
    res.json({ 
      success: true, 
      response: aiResponse,
      sessionId: sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to process chat message';
    if (error.status === 403) {
      errorMessage = 'AI service is temporarily unavailable. Please contact support.';
    } else if (error.message && error.message.includes('API key')) {
      errorMessage = 'AI service configuration error. Please contact support.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate a simple session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export default router;