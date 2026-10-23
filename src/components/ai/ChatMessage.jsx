import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  User,
  Copy,
  Check,
  ExternalLink,
  Briefcase,
  MapPin,
  Building2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

// Simple robust markdown formatter without external dependencies
function renderMarkdown(content) {
  if (!content || typeof content !== 'string') return null

  const lines = content.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeBuffer = []
  let listBuffer = []

  const flushList = (key) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="my-2 space-y-1 pl-5 list-disc text-ink-800">
          {listBuffer.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>,
      )
      listBuffer = []
    }
  }

  const flushCode = (key) => {
    if (codeBuffer.length > 0) {
      elements.push(
        <pre
          key={`code-${key}`}
          className="my-2.5 overflow-x-auto rounded-lg bg-ink-900 p-3 text-xs text-ink-100 font-mono"
        >
          <code>{codeBuffer.join('\n')}</code>
        </pre>,
      )
      codeBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode(i)
        inCodeBlock = false
      } else {
        flushList(i)
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList(i)
      elements.push(
        <h4 key={i} className="mt-3 mb-1.5 text-sm font-bold text-ink-900">
          {line.replace('### ', '')}
        </h4>,
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList(i)
      elements.push(
        <h3 key={i} className="mt-3.5 mb-2 text-base font-bold text-ink-900">
          {line.replace('## ', '')}
        </h3>,
      )
      continue
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const formatted = formatInline(line.trim().replace(/^[-*]\s+/, ''))
      listBuffer.push(formatted)
      continue
    }

    // Ordered lists
    if (/^\d+\.\s+/.test(line.trim())) {
      flushList(i)
      const formatted = formatInline(line.trim().replace(/^\d+\.\s+/, ''))
      elements.push(
        <p key={i} className="my-1 pl-4 text-xs sm:text-sm text-ink-800" dangerouslySetInnerHTML={{ __html: formatted }} />,
      )
      continue
    }

    // Empty line
    if (!line.trim()) {
      flushList(i)
      continue
    }

    // Normal paragraph
    flushList(i)
    elements.push(
      <p
        key={i}
        className="my-1.5 text-xs sm:text-sm leading-relaxed text-ink-800"
        dangerouslySetInnerHTML={{ __html: formatInline(line) }}
      />,
    )
  }

  flushList('final')
  flushCode('final')

  return elements
}

function formatInline(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-mono text-brand-700">$1</code>')
}

export default function ChatMessage({ message = {}, onRetry }) {
  const [copied, setCopied] = useState(false)
  const isUser = message?.role === 'user'
  const isError = Boolean(message?.isError)
  const content = typeof message?.content === 'string' ? message.content : ''

  const handleCopy = () => {
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 text-xs sm:text-sm ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser
            ? 'bg-brand-600 text-white'
            : isError
            ? 'bg-danger-600 text-white'
            : 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-none'
            : isError
            ? 'bg-danger-50 border border-danger-200 text-danger-900 rounded-tl-none'
            : 'bg-white border border-ink-200 text-ink-900 rounded-tl-none'
        }`}
      >
        {/* Offline / Fallback Notice */}
        {!isUser && message?.offlineNotice && (
          <div className="mb-2 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
            {message.offlineNotice}
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="prose-xs space-y-1">{renderMarkdown(content)}</div>
        )}

        {/* Retry Button on Error */}
        {isError && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-danger-200">
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-700 transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry Request
            </button>
            <span className="text-[11px] text-danger-600">Click to resend to Ollama</span>
          </div>
        )}

        {/* Verified Job Cards inside Chat */}
        {!isUser && message?.recommendedJobs && message.recommendedJobs.length > 0 && (
          <div className="mt-3.5 space-y-2 border-t border-ink-100 pt-3">
            <p className="font-semibold text-xs text-ink-900 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-brand-600" />
              Verified JobKhoj Matches:
            </p>
            <div className="grid gap-2">
              {message.recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-ink-200 bg-ink-50/70 p-3 hover:border-brand-300 hover:bg-white transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-brand-700 hover:underline flex items-center gap-1 text-xs sm:text-sm truncate"
                      >
                        {job.title}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </Link>
                      <p className="text-[11px] text-ink-600 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-ink-400" />
                        {job.companyName} • <MapPin className="h-3 w-3 text-ink-400" /> {job.location}
                      </p>
                    </div>
                    {job.matchScore && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        {job.matchScore}% Match
                      </span>
                    )}
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.skills.slice(0, 4).map((s) => (
                        <span key={s} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-ink-700 border border-ink-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar */}
        {!isUser && !isError && content && (
          <div className="mt-2 flex items-center justify-between pt-1 text-[11px] text-ink-400 border-t border-ink-50">
            <span>JobKhoj AI</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-ink-700 flex items-center gap-1 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
