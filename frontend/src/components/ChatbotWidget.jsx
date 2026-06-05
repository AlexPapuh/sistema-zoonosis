import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta a tu contexto

const ChatbotWidget = () => {
  const { user, token } = useAuth(); // Necesitamos el token para enviarlo al backend
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy el asistente virtual multiespecie de Zoonosis. 🤖🐶🐱🐹 ¿En qué te puedo ayudar hoy sobre el cuidado y nutrición de tu mascota?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    
    // 1. Agregamos el mensaje del usuario a la pantalla
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('https://zoonosispotosi.site/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ text: userMessage })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { text: data.respuesta, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: "Hubo un problemita de conexión. Intenta de nuevo.", sender: 'bot', error: true }]);
      }
    } catch (error) {
      console.error("Error en chat:", error);
      setMessages(prev => [...prev, { text: "No pude conectarme al servidor.", sender: 'bot', error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (text) => {
    if (!text) return null;
    return text.split('**').map((part, index) => {
      const cleanPart = part.replace(/\*\s?/g, '• ');
      
      return index % 2 === 1 ? <strong key={index} className="font-bold text-gray-900">{cleanPart}</strong> : cleanPart;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 h-[500px] flex flex-col mb-4 overflow-hidden transition-all duration-300 transform origin-bottom-right">
          
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-100" />
              <div>
                <h3 className="font-bold text-sm">Asistente Zoonosis 🤖</h3>
                <p className="text-xs text-blue-100 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 inline-block animate-pulse"></span> En línea
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4 text-sm">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : msg.error 
                      ? 'bg-red-100 text-red-700 border border-red-200 rounded-bl-none'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none leading-relaxed'
                }`}>
                  {formatMessage(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-500 p-3 rounded-2xl rounded-bl-none animate-pulse flex space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-2.5 pl-4 pr-10 text-sm transition-all"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || isLoading}
                className="absolute right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          <Bot className="w-8 h-8" />
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;