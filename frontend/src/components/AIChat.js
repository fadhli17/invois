import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FiSend, 
  FiMessageCircle, 
  FiX, 
  FiZap, 
  FiUser, 
  FiCpu,
  FiLoader,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const AIChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new message is added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggestions on component mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ai/suggestions`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const sendMessage = async (message = input) => {
    if (!message.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/process`, {
        message: message,
        userId: user?._id || user?.id
      });

      if (response.data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.result.content,
          resultType: response.data.result.type,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Maaf, berlaku ralat semasa memproses permintaan anda. Sila cuba lagi.',
        isError: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatMessage = (content) => {
    // Simple formatting for better display
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
          title="AI Assistant"
        >
          <FiZap className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FiZap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-blue-100">Powered by Groq</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto h-[400px] space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiMessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Assistant</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Saya boleh bantu anda dengan invois dan pelanggan
                    </p>
                    
                    {/* Quick Suggestions */}
                    <div className="space-y-2">
                      {suggestions.slice(0, 2).map((suggestion, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => sendMessage(suggestion)}
                          className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            <div>
                              <div className="font-medium text-gray-900">{suggestion}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'ai' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiCpu className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(message.content)
                          }}
                        />
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('ms-MY', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiUser className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiCpu className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <FiLoader className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">AI sedang memproses...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tanya tentang invois anda..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Actions */}
                {messages.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      {suggestions.slice(0, 2).map((suggestion, index) => (
                        <button
                          key={`quick-action-${index}`}
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          💡 {suggestion.substring(0, 20)}...
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={clearChat}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChat;
