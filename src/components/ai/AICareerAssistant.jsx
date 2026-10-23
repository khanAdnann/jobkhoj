import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Trash2, Bot, Minimize2, Maximize2, RefreshCw } from 'lucide-react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import AISettingsStatus from './AISettingsStatus'
import { sendAiChat } from '@/services/aiService'
import { useAuth } from '@/hooks/useAuth'

const DEFAULT_QUICK_PROMPTS = [
  'Help me prepare for a Java & Spring Boot interview',
  'Review my resume and suggest Google XYZ bullet points',
  'Find verified software jobs matching my skills',
  'How do I answer "What is your greatest technical challenge?"',
]

export default function AICareerAssistant() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I am **JobKhoj AI**, your intelligent career and interview coach.\n\n` +
        `How can I help you today? You can ask me for:\n` +
        `- 🎯 **Technical interview practice** (Java, Spring Boot, React, SQL, Full Stack)\n` +
        `- 📝 **Resume review & keyword optimization**\n` +
        `- 💼 **Verified Job recommendations from JobKhoj**\n` +
        `- ✉️ **Custom cover letter guidance**`,
    },
  ])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) return
    const trimmed = text.trim()
    const userMsg = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const response = await sendAiChat({
        messages: updatedMessages,
        message: trimmed,
        userSkills: user?.skills || [],
      })

      const replyContent =
        response && typeof response.content === 'string'
          ? response.content.trim()
          : 'I am here to help, but no response text was returned.'

      const assistantMsg = {
        role: 'assistant',
        content: replyContent,
        recommendedJobs: response?.recommendedJobs || null,
        offlineNotice: response?.offlineNotice || null,
        fallback: Boolean(response?.fallback),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Connection Error: ${err.message || 'Unable to get response from AI.'}`,
          isError: true,
          failedPrompt: trimmed,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = (failedMsg) => {
    const promptToRetry =
      failedMsg?.failedPrompt ||
      [...messages].reverse().find((m) => m?.role === 'user')?.content
    if (promptToRetry) {
      setMessages((prev) => prev.filter((m) => m !== failedMsg))
      handleSend(promptToRetry)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared! How else can I assist your career search today?',
      },
    ])
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 px-4 py-3.5 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group"
          aria-label="Open JobKhoj AI Career Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <Sparkles className="h-5 w-5 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold text-sm tracking-wide">JobKhoj AI</span>
        </button>
      )}

      {/* Slide-in Chat Drawer / Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 sm:bottom-6 sm:right-6 sm:rounded-2xl border border-ink-200 overflow-hidden ${
            isExpanded
              ? 'h-full w-full sm:h-[85vh] sm:w-[650px]'
              : 'h-full w-full sm:h-[600px] sm:w-[420px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-100 bg-gradient-to-r from-brand-600 to-indigo-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-xs">
                <Bot className="h-5 w-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm truncate">JobKhoj AI</h3>
                </div>
                <p className="text-[11px] text-brand-100 truncate">Career & Interview Coach</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <AISettingsStatus />

              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title={isExpanded ? 'Restore size' : 'Expand panel'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                title="Close AI Assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ink-50/30">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} onRetry={handleRetry} />
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-ink-500 bg-white border border-ink-200 rounded-2xl px-4 py-3 w-fit shadow-xs animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                <span>JobKhoj AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Component */}
          <ChatInput
            onSend={handleSend}
            loading={loading}
            onStop={() => setLoading(false)}
            quickPrompts={DEFAULT_QUICK_PROMPTS}
          />
        </div>
      )}
    </>
  )
}

