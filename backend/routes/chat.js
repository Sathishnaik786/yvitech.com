import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
// Supabase client for backend
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_PROMPT, AI_CONFIG } from '../config/ai-config.js';

// Load environment variables
dotenv.config();

// Initialize Supabase client with better error handling
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️  WARNING: Supabase configuration missing!');
    console.error('SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  }

  supabase = createClient(supabaseUrl || 'https://your-project.supabase.co', supabaseKey || 'your-service-role-key');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error);
  supabase = null;
}

const router = express.Router();

// Initialize Groq client with error handling
const MODEL_NAME = AI_CONFIG.groq.model || 'llama3-8b-8192'; // Using config model or fallback
const FALLBACK_MODEL_NAME = AI_CONFIG.groq.fallbackModel || 'mixtral-8x7b-32768'; // Fallback model

// In-memory cache for chatbot responses
// In-memory cache for chatbot responses
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Rate limiting tracking per session
const sessionUsage = new Map(); // Track Groq calls per session
const userLastCall = new Map(); // Track last call time per user/session

let groq;
try {
  const groqApiKey = process.env.GROQ_API_KEY || AI_CONFIG.groq.apiKey;
  if (!groqApiKey) {
    console.error('⚠️  WARNING: Groq API key not configured!');
  }

  groq = new Groq({
    apiKey: groqApiKey || 'your-groq-api-key-here'
  });
  console.log(`✅ Groq AI client initialized successfully with model: ${MODEL_NAME}`);
} catch (error) {
  console.error('❌ Failed to initialize Groq AI client:', error);
  groq = null;
}

// Groq doesn't require separate embedding model initialization

// Function to validate AI response
function isValidAIResponse(response) {
  // Check if response exists and is not empty
  if (!response || response.trim().length === 0) {
    return false;
  }
  
  // Check if response contains error indicators
  const errorIndicators = [
    'technical difficulties',
    'unable to process',
    'try again later',
    'quota',
    'error',
    'service unavailable'
  ];
  
  const lowerResponse = response.toLowerCase();
  for (const indicator of errorIndicators) {
    if (lowerResponse.includes(indicator)) {
      return false;
    }
  }
  
  // Check if response is meaningful (more than 10 characters)
  if (response.trim().length < 10) {
    return false;
  }
  
  // Response seems valid
  return true;
}

// Function to generate AI response with retry logic and exponential backoff
async function generateAIResponseWithRetry(prompt, maxRetries = 1) {
  const delays = [500]; // Single retry with delay

  // Try primary model first
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: MODEL_NAME,
        temperature: AI_CONFIG.groq.temperature || 0.3,
        max_tokens: AI_CONFIG.groq.maxTokens || 600,
        top_p: 1,
        stream: false
      });
      
      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error(`Attempt ${attempt + 1} with primary model failed:`, error.message);

      // If this was the last attempt with primary model, try fallback
      if (attempt === maxRetries) {
        break;
      }

      // Check if it's a retryable error
      const isRetryable = error.status === 429 || error.status === 500 ||
        error.message.includes('429') || error.message.includes('500') ||
        error.message.includes('network') || error.message.includes('Network');

      if (!isRetryable) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = delays[attempt] || delays[delays.length - 1];
      console.log(`Waiting ${delay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Try fallback model
  try {
    console.log(`Trying fallback model: ${FALLBACK_MODEL_NAME}`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: FALLBACK_MODEL_NAME,
      temperature: AI_CONFIG.groq.temperature || 0.3,
      max_tokens: AI_CONFIG.groq.maxTokens || 600,
      top_p: 1,
      stream: false
    });
    
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (fallbackError) {
    console.error('Fallback model also failed:', fallbackError.message);
    throw fallbackError;
  }
}

// Function to get dynamic suggestions from database based on response content
async function getDynamicSuggestions(responseText) {
  try {
    const lowerText = responseText.toLowerCase();

    // Determine the most relevant category based on keywords in the response
    let category = 'general';

    if (lowerText.includes('oracle') || lowerText.includes('hcm') || lowerText.includes('scm') || lowerText.includes('financials')) {
      category = 'oracle';
    } else if (lowerText.includes('sap') || lowerText.includes('salesforce')) {
      category = 'sap';
    } else if (lowerText.includes('managed') || lowerText.includes('support') || lowerText.includes('sla')) {
      category = 'managed';
    } else if (lowerText.includes('ai') || lowerText.includes('data') || lowerText.includes('machine learning') || lowerText.includes('analytics') || lowerText.includes('artificial intelligence')) {
      category = 'ai';
    } else if (lowerText.includes('web') || lowerText.includes('mobile') || lowerText.includes('app') || lowerText.includes('development') || lowerText.includes('website')) {
      category = 'web';
    } else if (lowerText.includes('marketing') || lowerText.includes('seo') || lowerText.includes('social') || lowerText.includes('digital')) {
      category = 'marketing';
    }

    // Query the database for suggestions in the determined category
    // Get more suggestions than needed so we can randomize selection
    const { data: categorySuggestions, error: categoryError } = await supabase
      .from('chat_suggestions')
      .select('display_text, full_question')
      .eq('category', category)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(10); // Get more suggestions to allow for randomization

    if (!categoryError && categorySuggestions && categorySuggestions.length > 0) {
      // Randomize the selection of suggestions
      const shuffled = categorySuggestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);

      // Transform to the format expected by the frontend
      return selected.map(suggestion => ({
        display: suggestion.display_text,
        full: suggestion.full_question
      }));
    }

    // Fallback to general suggestions if category-specific ones aren't found
    const { data: generalSuggestions, error: generalError } = await supabase
      .from('chat_suggestions')
      .select('display_text, full_question')
      .eq('category', 'general')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(10); // Get more suggestions to allow for randomization

    if (!generalError && generalSuggestions && generalSuggestions.length > 0) {
      // Randomize the selection of suggestions
      const shuffled = generalSuggestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);

      return selected.map(suggestion => ({
        display: suggestion.display_text,
        full: suggestion.full_question
      }));
    }

    // Final fallback to hardcoded suggestions
    return [
      { "display": "Services", "full": "What services do you offer?" },
      { "display": "Pricing", "full": "Can you provide pricing information?" },
      { "display": "Contact", "full": "How can I get in touch with your team?" },
      { "display": "More", "full": "Tell me more about your company" }
    ];
  } catch (error) {
    console.error('Error fetching dynamic suggestions:', error);
    // Fallback to hardcoded suggestions in case of error
    return [
      { "display": "Services", "full": "What services do you offer?" },
      { "display": "Pricing", "full": "Can you provide pricing information?" },
      { "display": "Contact", "full": "How can I get in touch with your team?" },
      { "display": "More", "full": "Tell me more about your company" }
    ];
  }
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  console.log('=== CHAT REQUEST RECEIVED ===');
  console.log('Request body:', req.body);
  console.log('Environment variables check:');
  console.log('- GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
  console.log('- SUPABASE URL exists:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
  console.log('- SUPABASE SERVICE KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Log the actual values (masked for security)
  if (process.env.GROQ_API_KEY) {
    console.log('- GROQ_API_KEY length:', process.env.GROQ_API_KEY.length);
  }
  if (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) {
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  }

  try {
    const { message, sessionId, userId } = req.body;
    console.log('Processing message:', message);

    // Validate input
    if (!message) {
      console.log('Validation failed: Message is required');
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return res.status(500).json({
        success: false,
        error: 'Database service unavailable'
      });
    }

    // Check if AI service is configured
    console.log('=== AI CONFIGURATION CHECK ===');
    console.log('process.env.GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
    console.log('AI_CONFIG.groq.apiKey exists:', !!AI_CONFIG.groq.apiKey);
    console.log('GROQ_API_KEY value (first 10 chars):', process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    if (!(process.env.GROQ_API_KEY || AI_CONFIG.groq.apiKey)) {
      console.error('❌ AI service not configured');
      return res.status(500).json({
        success: false,
        error: 'AI service not configured'
      });
    }
    console.log('✅ AI service is configured');

    // Mock response for testing when MOCK_CHAT is enabled
    if (process.env.MOCK_CHAT === 'true') {
      // Get dynamic suggestions even for mock responses
      const mockSuggestions = await getDynamicSuggestions("This is a mock response about our services.");

      return res.json({
        success: true,
        response: "This is a mock response for testing purposes. In a production environment, this would be a response from our AI assistant.",
        suggestions: mockSuggestions,
        responseSource: "groq", // Default to groq for mock
        sessionId: sessionId || generateSessionId()
      });
    }

    // --- STEP 1: QUERY NORMALIZATION ---
    // Normalize query: lowercase, trim, remove punctuation, generate hash
    const normalizedMessage = message.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    // Generate simple hash for the normalized message
    let hash = 0;
    for (let i = 0; i < normalizedMessage.length; i++) {
      const char = normalizedMessage.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const normalizedHash = Math.abs(hash).toString(36);
    
    console.log('Normalized message:', normalizedMessage);
    console.log('Normalized hash:', normalizedHash);
    
    // --- STEP 2: CHECK RATE LIMITS ---
    
    // Hardcoded responses for common queries to minimize API usage
    const msgNormalized = message.toLowerCase().trim();
    
    // Greetings
    if (msgNormalized.includes('hello') || msgNormalized.includes('hi') || msgNormalized.includes('hey') || 
        msgNormalized === 'greetings' || msgNormalized.startsWith('good morning') || 
        msgNormalized.startsWith('good afternoon') || msgNormalized.startsWith('good evening')) {
      
      const greetingResponses = [
        "Hello! I'm the YVI Tech Assistant. How can I help you today?",
        "Hi there! I'm here to help you learn about YVI Technologies. What would you like to know?",
        "Greetings! I'm your AI assistant for YVI Tech. How can I assist you?"
      ];
      
      const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      
      return res.json({
        success: true,
        response: `${randomGreeting}`,
        suggestions: [
          { display: "Services", full: "What services do you offer?" },
          { display: "About", full: "Tell me about YVI Tech" },
          { display: "Contact", full: "How can I contact you?" },
          { display: "Pricing", full: "Do you have pricing information?" }
        ],
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }
    
    // Thanks
    if (msgNormalized.includes('thank') || msgNormalized.includes('thanks') || msgNormalized === 'ty') {
      return res.json({
        success: true,
        response: "You're welcome! Is there anything else I can help you with?",
        suggestions: [
          { display: "Services", full: "What services do you offer?" },
          { display: "Contact", full: "How can I contact you?" },
          { display: "Website", full: "Visit your website" },
          { display: "More", full: "Tell me more" }
        ],
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }
    
    // Help
    if (msgNormalized.includes('help') || msgNormalized === 'help me' || msgNormalized.includes('assist')) {
      return res.json({
        success: true,
        response: "I'm here to help you learn about YVI Technologies. You can ask me about our services, company information, or anything else related to YVI Tech.",
        suggestions: [
          { display: "Services", full: "What services do you offer?" },
          { display: "About", full: "Tell me about YVI Tech" },
          { display: "Contact", full: "How can I contact you?" },
          { display: "Pricing", full: "Do you have pricing information?" }
        ],
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }
    
    // Contact info
    if (msgNormalized.includes('contact') || msgNormalized.includes('email') || msgNormalized.includes('phone') || 
        msgNormalized.includes('address') || msgNormalized.includes('reach')) {
      return res.json({
        success: true,
        response: "You can reach us at:\n\nEmail: contact@yvisoft.com\nPhone: +91-XXX-XXXX-XXXX\n\nWe're located in India and UAE.",
        suggestions: [
          { display: "Email", full: "Send an email" },
          { display: "Services", full: "What services do you offer?" },
          { display: "About", full: "Tell me about YVI Tech" },
          { display: "Location", full: "Where are you located?" }
        ],
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }
    // Check if we've exceeded Groq call limits for this session
    if (sessionId) {
      const sessionData = sessionUsage.get(sessionId) || { count: 0, lastReset: Date.now() };
      
      // Reset counter if it's been more than 24 hours
      if (Date.now() - sessionData.lastReset > 24 * 60 * 60 * 1000) {
        sessionData.count = 0;
        sessionData.lastReset = Date.now();
      }
      
      // Max 5 Groq calls per session
      if (sessionData.count >= 5) {
        console.log('Session limit reached for session:', sessionId);
        
        // Suggest relevant page based on intent
        let suggestionUrl = 'https://yvitech.com';
        const msgLower = message.toLowerCase();
        
        if (msgLower.includes('oracle')) {
          suggestionUrl = 'https://yvitech.com/services/oracle';
        } else if (msgLower.includes('sap') || msgLower.includes('salesforce')) {
          suggestionUrl = 'https://yvitech.com/services/erp';
        } else if (msgLower.includes('ai') || msgLower.includes('data')) {
          suggestionUrl = 'https://yvitech.com/services/ai-data';
        } else if (msgLower.includes('web') || msgLower.includes('mobile')) {
          suggestionUrl = 'https://yvitech.com/services/web-development';
        } else if (msgLower.includes('rpa')) {
          suggestionUrl = 'https://yvitech.com/services/rpa';
        } else if (msgLower.includes('cloud')) {
          suggestionUrl = 'https://yvitech.com/services/cloud';
        } else if (msgLower.includes('marketing')) {
          suggestionUrl = 'https://yvitech.com/services/digital-marketing';
        } else if (msgLower.includes('design') || msgLower.includes('ui') || msgLower.includes('ux')) {
          suggestionUrl = 'https://yvitech.com/services/ui-ux-design';
        }
        
        return res.json({
          success: true,
          response: `I've reached my limit for this session. For more detailed information, please visit our website: ${suggestionUrl}`,
          suggestions: [
            { display: "Website", full: `Visit ${suggestionUrl}` },
            { display: "Services", full: "What services do you offer?" },
            { display: "Contact", full: "How can I contact you?" },
            { display: "More Info", full: "Tell me more about YVI Tech" }
          ],
          responseSource: "limit-reached",
          sessionId: sessionId
        });
      }
      
      // Check per-user rate limiting (1 call per 10 seconds)
      const lastCallTime = userLastCall.get(sessionId) || 0;
      if (Date.now() - lastCallTime < 10000) { // 10 seconds
        console.log('Rate limit exceeded for session:', sessionId);
        
        // Still try to provide value without calling Groq
        const suggestions = await getDynamicSuggestions("Rate limit exceeded");
        return res.json({
          success: true,
          response: "I'm processing your request. Please wait a moment before sending another message.",
          suggestions: suggestions,
          responseSource: "rate-limit",
          sessionId: sessionId
        });
      }
    }
    
    // --- STEP 3: CHECK CACHED RESPONSES (In-memory and Database) ---

    // Check in-memory cache first
    const cachedResponse = responseCache.get(normalizedMessage);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      console.log('✅ Cache hit (in-memory):', normalizedMessage);
      
      // No source indicator needed
      let responseWithSource = cachedResponse.response;
      
      return res.json({
        success: true,
        response: responseWithSource,
        suggestions: cachedResponse.suggestions,
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }

    // Check database for exact match (persistent cache)
    try {
      const { data: dbCache, error: dbCacheError } = await supabase
        .from('chatbot_logs')
        .select('bot_response, match_score')
        .eq('user_query', message.trim())
        .not('bot_response', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!dbCacheError && dbCache && dbCache.length > 0 && dbCache[0].bot_response) {
        console.log('✅ Cache hit (database):', normalizedMessage);
        const dbResponse = dbCache[0].bot_response;
        const dbSuggestions = await getDynamicSuggestions(dbResponse);

        // Update in-memory cache
        responseCache.set(normalizedMessage, {
          response: dbResponse,
          suggestions: dbSuggestions,
          timestamp: Date.now()
        });

        // No source indicator needed
        const responseWithSource = dbResponse;

        return res.json({
          success: true,
          response: responseWithSource,
          suggestions: dbSuggestions,
          responseSource: "database",
          sessionId: sessionId || generateSessionId()
        });
      }
    } catch (cacheErr) {
      console.log('Database cache check skip:', cacheErr.message);
    }

    // Skipping embedding generation as Groq doesn't require it

    // --- STEP 2: ENHANCED DB RETRIEVAL (DB Knowledge) ---
    let responseSource = "groq";
    let aiResponse = "";
    let matchScore = 0;

    // Input normalization for better matching
    const normalizeQuery = (query) => {
      // Convert to lowercase
      let normalized = query.toLowerCase().trim();
      
      // Remove common question words that might interfere with matching
      const questionWords = ['how', 'does', 'what', 'where', 'when', 'why', 'which', 'who', 'can', 'do', 'is', 'are', 'will', 'would', 'could', 'should', 'implement', 'provide', 'offer', 'tell', 'me', 'about', 'the', 'a', 'an'];
      
      // Remove question words but keep the core meaning
      normalized = normalized.split(' ')
        .filter(word => !questionWords.includes(word))
        .join(' ');
      
      // Additional cleanup
      normalized = normalized.replace(/[?]/g, ''); // Remove question marks
      normalized = normalized.replace(/[.]/g, ''); // Remove periods
      normalized = normalized.replace(/[!]/g, ''); // Remove exclamation marks
      
      return normalized.trim();
    };
    
    // Log normalized query for debugging
    const normalizedQuery = normalizeQuery(message);
    console.log('Original query:', message);
    console.log('Normalized query:', normalizedQuery);
    
    // Perform enhanced keyword matching against chatbot_knowledge
    console.log('Starting DB knowledge lookup for:', message);
    try {
      // First, try to find an exact match in the knowledge base
      // Also try to find matches for the normalized query
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('chatbot_knowledge')
        .select('title, description, keywords')  // Include keywords in the selection
        .or(
          `title.ilike.%${message.trim()}%,title.ilike.%${normalizedQuery}%,description.ilike.%${message.trim()}%,description.ilike.%${normalizedQuery}%`  // Match original or normalized query against title and description
        )
        .limit(1) // Only get one exact match
        .single();
      
      console.log('Exact match query result - data:', exactMatch, 'error:', exactMatchError);

      if (!exactMatchError && exactMatch && exactMatch.description) {
        aiResponse = exactMatch.description;
        responseSource = "database";
        matchScore = 1.0;
        console.log('✅ Exact DB match found for:', exactMatch.title);
        
        // No source indicator needed
        aiResponse = aiResponse;
      } else {
        // If no exact match, try keyword-based matching with full-text search
        // First, extract keywords from the query to match against knowledge base keywords
        const queryWordsArray = normalizedQuery.split(' ').filter(w => w.length > 0);
        
        // Look for entries that have matching keywords
        let bestMatch = null;
        let bestScore = 0;
        
        // Use Supabase full-text search or keyword matching instead of client-side iteration
        if (queryWordsArray.length > 0) {
          // Build the ilike query for keywords
          let keywordCondition = '';
          queryWordsArray.forEach((word, index) => {
            if (index > 0) keywordCondition += ',';
            keywordCondition += `keywords.ilike.%${word}%`;
          });
          
          const { data: keywordMatches, error: keywordError } = await supabase
            .from('chatbot_knowledge')
            .select('title, description, keywords')
            .or(keywordCondition)
            .limit(10); // Limit to top 10 keyword matches
          
          if (!keywordError && keywordMatches && keywordMatches.length > 0) {
            // Process only the limited set of keyword matches
            for (const item of keywordMatches) {
              if (item.keywords && Array.isArray(item.keywords)) {
                const matchedKeywords = item.keywords.filter(keyword => 
                  normalizedQuery.includes(keyword.toLowerCase()) || 
                  keyword.toLowerCase().includes(normalizedQuery)
                );
                
                if (matchedKeywords.length > 0) {
                  // Calculate a simple score based on keyword matches
                  const keywordScore = Math.min(0.3 * matchedKeywords.length, 0.9);
                  
                  if (keywordScore > bestScore) {
                    bestScore = keywordScore;
                    bestMatch = item;
                    console.log('Keyword match found for', item.title, 'keywords:', matchedKeywords);
                  }
                }
              }
            }
          }
          
          // If no keyword matches found, try title/description search with ilike
          if (!bestMatch) {
            const searchTerms = queryWordsArray.slice(0, 3); // Use only first 3 terms to avoid complex queries
            if (searchTerms.length > 0) {
              let searchCondition = '';
              searchTerms.forEach((term, index) => {
                if (index > 0) searchCondition += ',';
                searchCondition += `title.ilike.%${term}%,description.ilike.%${term}%`;
              });
              
              const { data: textMatches, error: textError } = await supabase
                .from('chatbot_knowledge')
                .select('title, description')
                .or(searchCondition)
                .limit(5);
              
              if (!textError && textMatches && textMatches.length > 0) {
                bestMatch = textMatches[0]; // Take the first match
                bestScore = 0.5; // Medium confidence
              }
            }
          }
        }
        
        if (bestMatch && bestScore >= 0.3) {  // Higher threshold for quality matches
          aiResponse = bestMatch.description;
          responseSource = "database";
          matchScore = bestScore;
          console.log('✅ DB match found with score:', bestScore, 'for question:', bestMatch.title);
          
          // No source indicator needed
          aiResponse = aiResponse;
        } else {
          console.log('No DB match found, best score was:', bestScore);
        }
      }
    } catch (matchingError) {
      console.log('Database matching error (non-fatal):', matchingError.message);
    }
    
    // DB-FIRST GUARANTEE: If we found a database match, return it immediately
    if (responseSource === "database") {
      console.log('DB match found, returning immediately without calling AI');
      
      // Get dynamic suggestions from database based on the response
      const suggestions = await getDynamicSuggestions(aiResponse);
      
      // Return the database response immediately
      return res.json({
        success: true,
        response: aiResponse,
        suggestions: suggestions,
        responseSource: "database",
        sessionId: sessionId || generateSessionId()
      });
    }

    // If no database match was found, ensure we call the AI
    if (responseSource === "groq") {
      // Check if AI models are initialized
      if (!groq) {
        console.error('❌ Groq client not initialized');
        // Instead of returning fallback immediately, try to provide some basic response
        // This allows the frontend to handle the situation more gracefully
        aiResponse = "AI services are temporarily unavailable. Please visit https://yvitech.com for more information about our services, or try again later.";
        responseSource = "fallback";
      } else {
        // Query knowledge base for relevant context
        let knowledgeBaseInfo = '';
        try {
          const { data: knowledgeData, error: knowledgeError } = await supabase
            .from('chatbot_knowledge')
            .select('category, title, description')
            .limit(5); // Increased context

          if (!knowledgeError && knowledgeData && knowledgeData.length > 0) {
            knowledgeBaseInfo = '\n\nContext regarding YVI Tech services:\n';
            knowledgeData.forEach(item => {
              knowledgeBaseInfo += `- ${item.title}: ${item.description}\n`;
            });
          }
        } catch (kbError) {
          console.log('Knowledge base context fetch error:', kbError.message);
        }

        // Generate AI response with Groq
        const fullPrompt = message;

        try {
          // Check if we're about to exceed rate limits before making the call
          if (sessionId) {
            // Update rate limiting tracking
            const sessionData = sessionUsage.get(sessionId) || { count: 0, lastReset: Date.now() };
            sessionData.count++;
            sessionUsage.set(sessionId, sessionData);
            userLastCall.set(sessionId, Date.now());
          }
          
          aiResponse = await generateAIResponseWithRetry(fullPrompt);
          console.log('✅ Response generated from Groq');
          
          // Validate the AI response
          if (!isValidAIResponse(aiResponse)) {
            console.log('⚠️ AI response did not meet validation criteria, but returning it anyway to avoid fallback');
            // Add learn more link for non-database responses
            if (!aiResponse.includes('yvitech.com')) {
              aiResponse = `${aiResponse}\n\n🌐 Learn more: https://yvitech.com`;
            }
          } else {
            // No source indicator needed
            // Add learn more link for non-database responses
            if (!aiResponse.includes('yvitech.com')) {
              aiResponse = `${aiResponse}\n\n🌐 Learn more: https://yvitech.com`;
            }
          }
        } catch (aiError) {
          console.error('❌ Groq API error after retries:', aiError.message);
          
          // Handle specific error types
          if (aiError.status === 429 || aiError.message.includes('429') || aiError.message.includes('quota')) {
            // Quota exceeded - provide friendly fallback
            let suggestionUrl = 'https://yvitech.com';
            const msgLower = message.toLowerCase();
            
            if (msgLower.includes('oracle')) {
              suggestionUrl = 'https://yvitech.com/services/oracle';
            } else if (msgLower.includes('sap') || msgLower.includes('salesforce')) {
              suggestionUrl = 'https://yvitech.com/services/erp';
            } else if (msgLower.includes('ai') || msgLower.includes('data')) {
              suggestionUrl = 'https://yvitech.com/services/ai-data';
            } else if (msgLower.includes('web') || msgLower.includes('mobile')) {
              suggestionUrl = 'https://yvitech.com/services/web-development';
            } else if (msgLower.includes('rpa')) {
              suggestionUrl = 'https://yvitech.com/services/rpa';
            } else if (msgLower.includes('cloud')) {
              suggestionUrl = 'https://yvitech.com/services/cloud';
            } else if (msgLower.includes('marketing')) {
              suggestionUrl = 'https://yvitech.com/services/digital-marketing';
            } else if (msgLower.includes('design') || msgLower.includes('ui') || msgLower.includes('ux')) {
              suggestionUrl = 'https://yvitech.com/services/ui-ux-design';
            }
            
            aiResponse = `I'm currently experiencing high demand. For immediate assistance, please visit our website: ${suggestionUrl}`;
          } else {
            // For other errors, provide a more informative response
            console.log('Other Groq error - will try to return a more helpful message');
            // Try to generate a helpful response based on the query
            const msgLower = message.toLowerCase();
            
            if (msgLower.includes('contact') || msgLower.includes('email') || msgLower.includes('phone')) {
              aiResponse = "You can reach us at contact@yvisoft.com or +91-XXX-XXXX-XXXX. We're located in India and UAE.";
            } else if (msgLower.includes('service') || msgLower.includes('offer')) {
              aiResponse = "YVI Technologies offers a range of services including AI & Automation, ERP Solutions (Oracle, SAP), Web Development, Cloud & DevOps, Digital Marketing, and more. Visit https://yvitech.com/services for detailed information.";
            } else {
              // Other errors - provide general fallback but try to be helpful
              aiResponse = "I couldn't find the right answer right now. Please visit https://yvitech.com or ask about our services, AI, Oracle, SAP, or contact details.";
            }
            
            responseSource = "fallback";
          }
        }
      }
    }

    // --- STEP 4: POST-PROCESSING & CACHING ---
    // Log final response
    console.log(`Final Response Source: ${responseSource}`);

    // Log the full AI response for debugging
    console.log('Full AI Response:', aiResponse);

    // Remove any JSON suggestions that might be at the end of the response
    try {
      // Simple pattern to match the JSON suggestions format
      const suggestionsIndex = aiResponse.lastIndexOf('{"suggestions"');
      if (suggestionsIndex !== -1) {
        aiResponse = aiResponse.substring(0, suggestionsIndex).trim();
      }
    } catch (error) {
      console.log('Could not remove potential JSON suggestions from AI response');
    }

    // Get dynamic suggestions from database based on the AI response
    const suggestions = await getDynamicSuggestions(aiResponse);

    // Save to in-memory cache if it was a Groq or DB response (not fallback)
    // Only cache valid responses
    if ((responseSource === "groq" && isValidAIResponse(aiResponse)) || responseSource === "database") {
      responseCache.set(normalizedMessage, {
        response: aiResponse,
        suggestions: suggestions,
        timestamp: Date.now()
      });
    }

    // Log final response and suggestions
    console.log('Final suggestions count:', suggestions.length);

    // Save chat to Supabase using chatbot_logs table with usage tracking
    // Only log valid responses (not fallback/error responses)
    const isValidResponse = (responseSource === 'groq' && isValidAIResponse(aiResponse)) || responseSource === 'database';
    
    if (isValidResponse) {
      const { data, error } = await supabase
        .from('chatbot_logs')
        .insert([
          {
            user_query: message,
            bot_response: aiResponse,
            matched_category: 'general',
            source: 'web_widget',
            match_score: matchScore,
            response_source: responseSource,
            created_at: new Date().toISOString()
            // usage_count: 1 // Temporarily disabled due to schema issues
          }
        ]);

      if (error) {
        console.error('Error saving chat to Supabase:', error);
      } else {
        // Update usage count for cached responses
        // Temporarily disabled due to schema issues
        /*
        try {
          await supabase
            .from('chatbot_logs')
            .update({ usage_count: supabase.sql`usage_count + 1` })
            .eq('user_query', message);
        } catch (updateError) {
          console.log('Could not update usage count:', updateError.message);
        }
        */
      }
    }

    // Return AI response with suggestions and metadata
    res.json({
      success: true,
      response: aiResponse,
      suggestions: suggestions,
      responseSource: responseSource,
      sessionId: sessionId || generateSessionId()
    });
  } catch (error) {
    console.error('=== DETAILED ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error status:', error.status);

    // Check for specific error types
    if (error.message.includes('API key')) {
      console.error('This is likely an API key or Groq configuration issue');
    }

    if (error.message.includes('Supabase') || error.message.includes('supabase')) {
      console.error('This is likely a Supabase connection or query issue');
    }

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