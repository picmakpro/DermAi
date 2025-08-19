'use client'

import { useEffect, useRef, useState } from 'react'

export default function ChatWidget({ analysis, onClose }: { analysis: any; onClose: () => void }) {
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
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '...' }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: "Désolé, une erreur est survenue." }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="font-semibold">Assistant Derma AI</h4>
        <button className="text-gray-500 hover:text-gray-900" onClick={onClose}>✕</button>
      </div>
      <div ref={containerRef} className="p-4 h-80 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-xl ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Posez votre question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button onClick={send} disabled={isSending} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          Envoyer
        </button>
      </div>
    </div>
  )
}


