import TextMatchAnalyzer from '@/components/tools/TextMatchAnalyzer'
import { matchResume } from '@/services/jobAnalysisService'
import { consumeUsage } from '@/services/toolsService'

export default function JobMatch() {
  async function run(resumeText, jdText) {
    consumeUsage('aiAnalysis')
    return matchResume(resumeText, jdText)
  }

  return (
    <TextMatchAnalyzer
      toolId="job-match"
      title="Job Match Checker"
      blurb="Paste a resume and any job posting for an instant fit score across skills, keywords, experience and title."
      icon="BadgeCheck"
      bucket="aiAnalysis"
      resumeLabel="Your resume text"
      jdLabel="Job posting"
      run={run}
      related={[
        { to: '/tools/resume-optimizer', label: 'Resume Optimizer' },
        { to: '/tools/jd-analyzer', label: 'Job Description Analyzer' },
        { to: '/tools/skill-gap', label: 'Skill Gap Analyzer' },
      ]}
    />
  )
}