'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestions?: ProductSuggestion[]
  timestamp: Date
}

interface ProductSuggestion {
  id: string
  name: string
  brand: string
  affiliate_link: string
  category: string
}

export function AICoachModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Bonjour ${session?.user?.name || ''} ! Je suis votre coach IA personnel. Comment puis-je vous aider avec votre routine de soins aujourd'hui ?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, session?.user?.name])
  
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            hasRecentAnalysis: true,
            currentProducts: [],
            routineStreak: 7
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Erreur réseau')
      }
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        suggestions: data.suggestions || [],
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erreur coach IA:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, je suis temporairement indisponible. Réessayez dans quelques instants.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Erreur de connexion au coach IA')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-40"
        aria-label="Ouvrir le coach IA"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      
      {/* Modal Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-500 to-blue-500 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Coach IA DermAI</h3>
                <p className="text-xs text-white/80">Toujours là pour vous</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Fermer le chat"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Suggestions produits */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs opacity-80 font-medium">Produits suggérés :</p>
                      {message.suggestions.map((product, i) => (
                        <a
                          key={i}
                          href={product.affiliate_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 bg-gray-100 rounded text-xs hover:bg-gray-200 transition-colors"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-gray-600">{product.brand} • {product.category}</div>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg p-3 shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    <span className="text-sm text-gray-600">Le coach réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                rows={1}
                disabled={isLoading}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Envoyer le message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
            </p>
          </div>
        </div>
      )}
    </>
  )
}





