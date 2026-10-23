import { useState, useRef, useEffect } from 'react'
import { Send, Square, Sparkles } from 'lucide-react'

export default function ChatInput({ onSend, loading, onStop, quickPrompts = [] }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!text.trim() || loading) return
    onSend(text.trim())
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="space-y-2 border-t border-ink-100 bg-white p-3">
      {/* Quick Prompts */}
      {quickPrompts.length > 0 && !loading && (
        <div className="flex flex-wrap gap-1.5 pb-1 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSend(prompt)}
              className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors whitespace-nowrap"
            >
              <Sparkles className="h-2.5 w-2.5 text-brand-500" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="relative flex items-end gap-2 rounded-xl border border-ink-200 bg-ink-50/50 p-2 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask JobKhoj AI (e.g., 'Java interview prep', 'Suggest jobs for me')..."
          rows={1}
          disabled={loading}
          className="max-h-28 w-full resize-none bg-transparent text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />

        <div className="flex shrink-0 items-center gap-1">
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg bg-ink-200 p-2 text-ink-700 hover:bg-ink-300 transition-colors"
              title="Stop response"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="rounded-lg bg-brand-600 p-2 text-white shadow-xs hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center text-[10px] text-ink-400 px-1">
        <span>Enter to send, Shift+Enter for newline</span>
        <span>Powered by Ollama</span>
      </div>
    </div>
  )
}

