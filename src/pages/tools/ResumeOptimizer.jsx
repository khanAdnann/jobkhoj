import { useState } from 'react'
import TextMatchAnalyzer from '@/components/tools/TextMatchAnalyzer'
import ResumeAnalyzer from '@/components/ai/ResumeAnalyzer'
import ToolShell from '@/components/tools/ToolShell'
import { matchResume } from '@/services/jobAnalysisService'
import { consumeUsage } from '@/services/toolsService'
import { Sparkles, GitCompare } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ResumeOptimizer() {
  const [activeTab, setActiveTab] = useState('ai')

  async function run(resumeText, jdText) {
    consumeUsage('aiAnalysis')
    return matchResume(resumeText, jdText)
  }

  return (
    <ToolShell
      toolId="resume-optimizer"
      title="Resume Optimizer & AI Reviewer"
      blurb="Analyze your resume with Ollama AI or compare your resume against a target job description."
      icon="Wand2"
      badge="AI-Powered"
      bucket="aiAnalysis"
    >
      <div className="mb-6 flex rounded-xl bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all',
            activeTab === 'ai'
              ? 'bg-white text-brand-700 shadow-xs'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          AI Document Analysis & STAR Rewriter
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compare')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all',
            activeTab === 'compare'
              ? 'bg-white text-brand-700 shadow-xs'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <GitCompare className="h-4 w-4 text-ink-500" />
          JD Keyword Matcher
        </button>
      </div>

      {activeTab === 'ai' ? (
        <ResumeAnalyzer />
      ) : (
        <TextMatchAnalyzer
          toolId="resume-optimizer"
          title="Resume Optimizer"
          blurb="Compare your resume against a target job description and get a fit score plus the exact wording and skills to add."
          icon="Wand2"
          badge="AI-ready"
          bucket="aiAnalysis"
          resumeLabel="Your resume text"
          jdLabel="Target job description"
          run={run}
          related={[
            { to: '/tools/ats-checker', label: 'ATS Resume Checker' },
            { to: '/tools/skill-gap', label: 'Skill Gap Analyzer' },
            { to: '/tools/job-match', label: 'Job Match Checker' },
          ]}
        />
      )}
    </ToolShell>
  )
}
