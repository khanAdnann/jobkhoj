import TextMatchAnalyzer from '@/components/tools/TextMatchAnalyzer'
import { matchResume } from '@/services/jobAnalysisService'
import { consumeUsage } from '@/services/toolsService'

export default function ResumeOptimizer() {
  async function run(resumeText, jdText) {
    consumeUsage('aiAnalysis')
    return matchResume(resumeText, jdText)
  }

  return (
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
  )
}