import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, HelpCircle } from 'lucide-react'
import { checkAiHealth } from '@/services/aiService'

export default function AISettingsStatus({ onRefresh, className = '' }) {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const data = await checkAiHealth()
      setHealth(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getStatusBadge = () => {
    if (loading) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
          <RefreshCw className="h-3 w-3 animate-spin text-ink-400" />
          Checking AI...
        </span>
      )
    }

    if (health?.status === 'ok') {
      return (
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          title="Ollama is connected and ready"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Ollama: {health.configuredModel}
        </button>
      )
    }

    if (health?.status === 'degraded') {
      return (
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          title="Ollama connected but model needs pulling"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          Model Missing
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600 hover:bg-ink-200 transition-colors"
        title="Ollama offline. Click for quick setup guide."
      >
        <span className="h-2 w-2 rounded-full bg-ink-400" />
        Local AI (Offline)
      </button>
    )
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {getStatusBadge()}

      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-ink-200 bg-white p-4 shadow-xl z-50 text-left text-xs text-ink-700">
          <div className="flex items-center justify-between border-b border-ink-100 pb-2 mb-3">
            <span className="font-semibold text-ink-900 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-brand-600" />
              Ollama Provider Status
            </span>
            <button
              type="button"
              onClick={() => {
                fetchHealth()
                onRefresh?.()
              }}
              className="text-brand-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between">
              <span className="text-ink-500">Endpoint:</span>
              <span className="font-mono text-[11px] text-ink-800">{health?.baseUrl || 'http://localhost:11434'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Target Model:</span>
              <span className="font-mono text-[11px] text-brand-600 font-semibold">{health?.configuredModel || 'llama3.1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Latency:</span>
              <span className="text-ink-800">{health?.latencyMs ? `${health.latencyMs}ms` : '—'}</span>
            </div>
          </div>

          {health?.status !== 'ok' && (
            <div className="rounded-lg bg-ink-50 p-2.5 text-[11px] border border-ink-200">
              <p className="font-semibold text-ink-900 mb-1 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-brand-500" />
                Quick Local Setup:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-ink-600 font-mono">
                <li>ollama serve</li>
                <li>ollama pull {health?.configuredModel || 'llama3.1'}</li>
              </ol>
              <p className="mt-2 text-ink-500 text-[10px]">
                Built-in smart career assistance is active even while Ollama is offline.
              </p>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-ink-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="px-2 py-1 text-xs text-ink-600 hover:text-ink-900 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

