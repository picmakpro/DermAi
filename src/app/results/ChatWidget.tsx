'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, X, MessageCircle, Sparkles } from 'lucide-react'
import type { SkinAnalysis } from '@/types'

export default function ChatWidget({ analysis, onClose }: { analysis: SkinAnalysis; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant DermAI. Posez vos questions sur votre diagnostic et vos recommandations.' },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || isSending) return
    const userMsg = { role: 'user' as const, content: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setIsSending(true)
    try {
      const questionnaireRaw = sessionStorage.getItem('dermai_questionnaire')
      const questionnaire = questionnaireRaw ? JSON.parse(questionnaireRaw) : null
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], analysis, questionnaire }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || 'Désolé, je n\'ai pas pu formuler une réponse.' }])
    } catch (e) {
      console.error('Erreur chat:', e)
      setMessages((m) => [...m, { role: 'assistant', content: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer." }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:inset-auto md:bottom-6 md:right-6 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl border border-dermai-ai-100 overflow-hidden z-50 max-h-[80vh] md:max-h-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Assistant DermAI</h4>
            <p className="text-xs opacity-90 hidden md:block">Votre expert beauté IA</p>
          </div>
        </div>
        <button 
          className="text-white/80 hover:text-white transition-colors p-1" 
          onClick={onClose}
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="p-3 md:p-4 h-64 md:h-80 overflow-y-auto space-y-3 md:space-y-4 bg-gradient-to-br from-dermai-ai-50/30 to-dermai-nude-50/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[80%] ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
              {m.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-1 md:mb-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-dermai-ai-700">DermAI</span>
                </div>
              )}
              <div className={`px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white shadow-md' 
                  : 'bg-white text-gray-800 shadow-sm border border-dermai-ai-100'
              }`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] md:max-w-[80%]">
              <div className="flex items-center space-x-2 mb-1 md:mb-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-dermai-ai-400 to-dermai-ai-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-dermai-ai-700">DermAI</span>
              </div>
              <div className="bg-white text-gray-800 shadow-sm border border-dermai-ai-100 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-dermai-ai-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-dermai-ai-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-dermai-ai-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-dermai-ai-100 bg-white">
        <div className="flex gap-2 md:gap-3">
          <input
            className="flex-1 border-2 border-dermai-ai-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dermai-ai-400 focus:border-dermai-ai-400 transition-all"
            placeholder="Posez votre question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button 
            onClick={send} 
            disabled={isSending || !input.trim()} 
            className="bg-gradient-to-r from-dermai-ai-500 to-dermai-ai-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-dermai-ai-600 hover:to-dermai-ai-700 transition-all shadow-sm hover:shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}


