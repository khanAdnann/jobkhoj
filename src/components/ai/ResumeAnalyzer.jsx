import { useState } from 'react'
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'
import { analyzeResumeWithAi } from '@/services/aiService'
import { Card, CardHeader, Button, Badge } from '@/components/common'

export default function ResumeAnalyzer() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }

    setFileName(file.name)
    setError(null)

    // For plain text or reader
    const reader = new FileReader()
    if (file.name.endsWith('.txt')) {
      reader.onload = (event) => setText(event.target.result)
      reader.readAsText(file)
    } else {
      // For PDF/DOCX read as Base64
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1]
        runAnalysis({
          fileBase64: base64,
          fileType: file.name.endsWith('.docx') ? 'docx' : 'pdf',
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const runAnalysis = async (extraParams = {}) => {
    if (!text.trim() && !extraParams.fileBase64) {
      setError('Please enter your resume text or upload a document.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeResumeWithAi({
        text: text.trim(),
        ...extraParams,
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Resume analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReport = () => {
    if (!result?.analysisReport) return
    navigator.clipboard.writeText(result.analysisReport)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="AI Resume Analyzer & Optimizer"
          subtitle="Extract skills, detect missing qualifications, and optimize bullet points using Google's STAR/XYZ methodology."
        />
        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-danger-50 p-4 text-xs text-danger-700 border border-danger-200">
              {error}
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="rounded-2xl border-2 border-dashed border-ink-200 p-6 text-center hover:border-brand-400 hover:bg-brand-50/20 transition-all">
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="resume-file-input"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-ink-900">
                {fileName ? `Uploaded: ${fileName}` : 'Upload your resume (PDF, DOCX, or TXT)'}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                Max file size: 5MB • Safe & private • PII redacted before analysis
              </p>
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-ink-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-ink-400 font-medium">Or paste resume text</span>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              rows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume content, summary, skills, and work history here..."
              className="w-full rounded-2xl border border-ink-200 p-4 text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 font-mono"
            />
            <div className="flex justify-between items-center text-xs text-ink-400 mt-1">
              <span>Minimum 50 characters for comprehensive extraction.</span>
              <span>{text.length} chars</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={text.trim().length < 50 && !fileName}
              onClick={() => runAnalysis()}
            >
              <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
              Analyze Resume with AI
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis Results View */}
      {result && (
        <div className="space-y-6">
          {/* Deterministic Insights Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Detected Technical Skills
                </p>
                <p className="mt-1 text-2xl font-bold text-brand-600">
                  {result.deterministic?.detectedSkills?.length || 0}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {result.deterministic?.detectedSkills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 border border-brand-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Detected Experience
                </p>
                <p className="mt-1 text-2xl font-bold text-ink-900">
                  {result.deterministic?.detectedYears
                    ? `${result.deterministic.detectedYears}+ Yrs`
                    : 'Not Specified'}
                </p>
                <p className="mt-2 text-xs text-ink-500">
                  Extracted from employment headers and timeline tags.
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                  Section Checklist
                </p>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(result.deterministic?.sections || {}).map(([key, present]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize text-ink-700">{key}</span>
                      {present ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-ink-300" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Qualitative AI Report */}
          <Card>
            <CardHeader
              title="AI Analysis & Actionable Improvements"
              action={
                <Button variant="ghost" size="sm" onClick={handleCopyReport}>
                  {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Report'}
                </Button>
              }
            />
            <div className="p-6 prose-sm text-ink-800 whitespace-pre-line leading-relaxed border-t border-ink-100">
              {result.analysisReport}
            </div>

            {/* Disclaimer */}
            <div className="bg-ink-50 p-4 border-t border-ink-100 text-[11px] text-ink-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-ink-400" />
              <span>{result.disclaimer}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

