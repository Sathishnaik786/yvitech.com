import React, { useState, useRef, useEffect } from 'react';
import chatIcon from '../../assets/img/aiassistant.png';
import './ChatWidget.css';
import { CATEGORIES, MORE_CATEGORIES, getFullPrompt } from '../../data/promptCategories';
import PromptList from './PromptList'; // Add this import
import API_CONFIG, { API_BASE } from '../../config/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false); // New state for maximize/minimize
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // This will track if we're showing a prompt list
  const [showMore, setShowMore] = useState(false);
  const [isListening, setIsListening] = useState(false); // Voice typing state
  const recognitionRef = useRef(null); // Speech recognition reference
  const messagesEndRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    // Reset category selection when closing
    if (isOpen) {
      setSelectedCategory(null);
      setShowMore(false);
    }
  };

  // New function to toggle maximize/minimize
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const resetChat = () => {
    setMessages([]);
    setInputValue('');
    setSessionId(null);
    setSelectedCategory(null);
    setShowMore(false);
    setIsMaximized(false); // Reset to normal size on refresh
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple function to convert markdown bold to HTML bold
  const renderMarkdown = (text) => {
    // Convert **text** to <strong>text</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await fetch(`${API_BASE}/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          sessionId: sessionId
        })
      });

      // Check if the response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        // Set session ID if provided
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }

        // Add bot response immediately to avoid artificial delays
        const botResponse = {
          id: Date.now() + 1,
          text: data.response, // Show full response immediately
          isBot: true,
          suggestions: data.suggestions || [],
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Determine appropriate error message based on error type
      let errorText;
      if (error.message && error.message.includes('429')) {
        errorText = "I'm receiving too many requests right now. Please try again in a moment.";
      } else if (error.message && error.message.includes('JSON')) {
        errorText = "I'm having trouble connecting to the service. Please refresh the page and try again.";
      } else if (error.message && error.message.includes('HTTP')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : null;
        if (status === 500) {
          errorText = "The server is experiencing issues. Please try again later.";
        } else if (status === 404) {
          errorText = "The service is temporarily unavailable. Please try again later.";
        } else {
          errorText = `Connection error (status: ${status || 'unknown'}). Please try again.`;
        }
      } else {
        errorText = "Sorry, I encountered an error. Please try again.";
      }
      
      const errorResponse = {
        id: Date.now() + 1,
        text: errorText, // Show full error message immediately
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      setIsLoading(false);
    }
  };

  // Handler for when a prompt is selected from the list
  const handlePromptSelect = (prompt) => {
    // Use the full expanded prompt instead of the UI label
    const fullPrompt = getFullPrompt(prompt);
    setInputValue(fullPrompt);
    setSelectedCategory(null); // Hide the prompt list
    // Auto-focus the input and send the message
    setTimeout(() => {
      const sendButton = document.querySelector('.send-button');
      if (sendButton) {
        sendButton.click();
      }
    }, 100);
  };  // Toggle voice typing
  const toggleVoiceTyping = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Common suggestions based on YVI Tech services (shortened for horizontal display)
  const commonSuggestions = [
    { display: "Oracle", full: "Tell me about your Oracle services" },
    { display: "SAP", full: "What SAP solutions do you offer?" },
    { display: "AI", full: "What AI solutions do you provide?" },
    { display: "Web", full: "What web development services do you offer?" }
  ];

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.full);
    // Auto-focus the input and send the message
    setTimeout(() => {
      const sendButton = document.querySelector('.send-button');
      if (sendButton) {
        sendButton.click();
      }
    }, 100);
  };

  const getRelevantSuggestions = (lastMessage) => {
    // Use AI-generated suggestions if available
    if (lastMessage && lastMessage.isBot && lastMessage.suggestions && lastMessage.suggestions.length > 0) {
      return lastMessage.suggestions;
    }
    
    // Fallback to static suggestions if no AI suggestions
    return commonSuggestions;
  };

  const renderSuggestions = () => {
    // Only show suggestions when not loading and there are messages
    if (isLoading || messages.length === 0) return null;
    
    // Get the last message to determine context
    const lastMessage = messages[messages.length - 1];
    const suggestions = getRelevantSuggestions(lastMessage);
    
    return (
      <div className="suggestions-container">
        {suggestions.slice(0, 4).map((suggestion, index) => (
          <button
            key={index}
            className="suggestion-button"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
          >
            {suggestion.display}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div 
        className={`chat-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleChat();
          }
        }}
        tabIndex={0}
        aria-label="Toggle chat"
        aria-expanded={isOpen}
        role="button"
        style={{ cursor: 'pointer' }}
      >
        <img src={chatIcon} alt="Chat" className="chat-icon" />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`chat-window ${isMaximized ? 'maximized' : ''}`} 
          role="dialog" 
          aria-labelledby="chat-header"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="chat-header" id="chat-header">
            <h3>YVI Tech Assistant</h3>
            {/* Refresh, Maximize/Minimize and Close Buttons - COMPACT HEADER - SIDE BY SIDE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <button 
                className="refresh-button" 
                onClick={resetChat}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    resetChat();
                  }
                }}
                aria-label="Refresh chat"
                tabIndex={0}
              >
                <span aria-hidden="true">↻</span>
              </button>
              <button 
                className="maximize-button" 
                onClick={toggleMaximize}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMaximize();
                  }
                }}
                aria-label={isMaximized ? "Minimize chat" : "Maximize chat"}
                tabIndex={0}
              >
                <span aria-hidden="true">{isMaximized ? '−' : '+'}</span>
              </button>
              <button 
                className="close-button" 
                onClick={toggleChat}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChat();
                  }
                }}
                aria-label="Close chat"
                tabIndex={0}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </div>
          
          {/* Render InitialScreen when there are no messages and not loading, outside the scrolling container */}
          {messages.length === 0 && !isLoading ? (
            <div className="initial-screen-wrapper">
              {/* Show prompt list if a category is selected, otherwise show initial screen */}
              {selectedCategory ? (
                <PromptList 
                  category={selectedCategory}
                  onPromptSelect={handlePromptSelect}
                  onBack={() => setSelectedCategory(null)}
                />
              ) : (
                <>
                  {/* Radial background - COMPACT HEIGHT */}
                  <div className="initial-bg"></div>
                  
                  {/* Heading + Subtitle - COMPACT SPACING */}
                  <h1 className="initial-title">Welcome to YVI Assistant</h1>
                  
                  <p className="initial-subtitle">
                    I'm your intelligent assistant for everything about YVI Technologies.
                    Ask me anything.
                  </p>
                  
                  {/* Category grid - CHATGPT STYLE COMPACT GRID */}
                  <div className="initial-grid">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category)} // Changed from sending prompt directly
                        className="initial-btn"
                      >
                        <span>{category.icon}</span>
                        <span>{category.title}</span>
                      </button>
                    ))}
                    
                    {/* More button */}
                    <button
                      onClick={() => setShowMore(!showMore)}
                      className="initial-btn"
                    >
                      <span>➕</span>
                      <span>More</span>
                    </button>
                  </div>
                  
                  {/* More categories grid - CHATGPT STYLE EXPANSION */}
                  {showMore && (
                    <div className="initial-grid fade-up">
                      {MORE_CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category)} // Changed from sending prompt directly
                          className="initial-btn"
                        >
                          <span>{category.icon}</span>
                          <span>{category.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (            <>
              <div className="chat-messages">
                {/* Render messages when there are messages or loading */}
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message ${message.isBot ? 'bot' : 'user'}`}
                  >
                    <div className="message-content">
                      {message.isBot ? (
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} />
                      ) : (
                        message.text
                      )}
                    </div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {isLoading && !(messages.length > 0 && messages[messages.length - 1].isBot) && (
                  <div className="message bot">
                    <div className="message-content typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Suggestions Container */}
              {messages.length > 0 && renderSuggestions()}
            </>
          )}
          
          <div className="chat-input-container">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about YVI Tech"
              disabled={isLoading}
              rows="1"
              aria-label="Ask me anything about YVI Tech"
              // Mobile-friendly attributes
              inputMode="text"
              enterKeyHint="send"
            />
            <div className="input-buttons-container">
              <button 
                className={`voice-button ${isListening ? 'listening' : ''}`}
                onClick={toggleVoiceTyping}
                aria-label={isListening ? "Stop voice input" : "Voice input"}
                type="button"
              >
                <i className={`bi ${isListening ? 'bi-mic-fill' : 'bi-mic'}`}></i>
              </button>
              <button 
                onClick={sendMessage} 
                disabled={isLoading || !inputValue.trim()}
                className="send-button"
                aria-label="Send message"
                // Prevent form submission on Enter in button
                type="button"
              >
                <i className="bi bi-send"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;