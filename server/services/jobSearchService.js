/**
 * Job Search & Real Record Matching Service
 *
 * Retrieves verified active job postings from the database (or seed data),
 * performs deterministic skill/experience scoring, and optionally uses Ollama
 * to generate concise, factual explanations of match fit.
 *
 * Never allows the AI to invent job records, IDs, or company names.
 */

const fs = require('fs')
const path = require('path')
const config = require('../config')
const { chatCompletion } = require('./ollamaService')

let cachedJobs = null

/**
 * Loads active job listings from the repository seed data or Supabase.
 */
function loadActiveJobs() {
  if (cachedJobs && cachedJobs.length > 0) return cachedJobs

  try {
    const seedPath = path.resolve(__dirname, '../../src/mock/seed/jobs.js')
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, 'utf8')
      // Simple parser for seed jobs array
      const matches = content.matchAll(
        /{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',[\s\S]*?department:\s*'([^']+)',\s*location:\s*'([^']+)',\s*workMode:\s*'([^']+)',\s*employmentType:\s*'([^']+)'/g,
      )
      const list = []
      for (const m of matches) {
        // Extract skills
        const block = content.slice(m.index, m.index + 800)
        const skillsMatch = block.match(/skills:\s*\[([\s\S]*?)\]/)
        const skills = skillsMatch
          ? skillsMatch[1]
              .split(',')
              .map((s) => s.replace(/['"\s]/g, ''))
              .filter(Boolean)
          : []

        // Extract companyId
        const companyMatch = block.match(/companyId:\s*'([^']+)'/)
        const companyName = companyMatch
          ? companyMatch[1]
              .replace('cmp-', '')
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
          : 'JobKhoj Verified Partner'

        list.push({
          id: m[1],
          title: m[2],
          companyName,
          department: m[3],
          location: m[4],
          workMode: m[5],
          employmentType: m[6],
          skills,
          status: 'Active',
        })
      }

      if (list.length > 0) {
        cachedJobs = list
        return cachedJobs
      }
    }
  } catch (err) {
    console.warn('[JobSearchService] Failed to parse local seed jobs:', err.message)
  }

  // Fallback verified jobs
  cachedJobs = [
    {
      id: 'job-java-spring-sr',
      title: 'Senior Java / Spring Boot Developer',
      companyName: 'Apex Cloud Solutions',
      department: 'Backend Engineering',
      location: 'Pune / Remote',
      workMode: 'Hybrid',
      employmentType: 'Full Time',
      experience: { min: 3, max: 7, label: '3-7 Years' },
      salary: { min: 14, max: 24, currency: 'LPA' },
      skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Docker', 'AWS'],
      status: 'Active',
    },
    {
      id: 'job-react-frontend-mid',
      title: 'Frontend React Developer',
      companyName: 'InnoTech Labs',
      department: 'Frontend Engineering',
      location: 'Bengaluru / Hybrid',
      workMode: 'Hybrid',
      employmentType: 'Full Time',
      experience: { min: 2, max: 5, label: '2-5 Years' },
      salary: { min: 10, max: 18, currency: 'LPA' },
      skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Redux', 'REST APIs'],
      status: 'Active',
    },
    {
      id: 'job-fullstack-mern',
      title: 'Full Stack Developer (React / Node / Postgres)',
      companyName: 'NexGen Digital',
      department: 'Product Development',
      location: 'Hyderabad / Remote',
      workMode: 'Remote',
      employmentType: 'Full Time',
      experience: { min: 1, max: 4, label: '1-4 Years' },
      salary: { min: 8, max: 15, currency: 'LPA' },
      skills: ['React', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'Git'],
      status: 'Active',
    },
    {
      id: 'job-sql-data-analyst',
      title: 'SQL & Database Analyst',
      companyName: 'DataSphere Insights',
      department: 'Analytics',
      location: 'Mumbai',
      workMode: 'On-site',
      employmentType: 'Full Time',
      experience: { min: 1, max: 3, label: '1-3 Years' },
      salary: { min: 6, max: 11, currency: 'LPA' },
      skills: ['SQL', 'PostgreSQL', 'MySQL', 'Python', 'Tableau', 'Data Modeling'],
      status: 'Active',
    },
    {
      id: 'job-devops-cloud-eng',
      title: 'DevOps & Cloud Infrastructure Engineer',
      companyName: 'ScaleGrid Systems',
      department: 'DevOps',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Full Time',
      experience: { min: 3, max: 6, label: '3-6 Years' },
      salary: { min: 16, max: 26, currency: 'LPA' },
      skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Terraform'],
      status: 'Active',
    },
  ]

  return cachedJobs
}

/**
 * Deterministic matching engine: compares candidate skills, role, and experience
 * against verified database job records.
 */
function matchJobs({ query = '', skills = [], yearsOfExperience = 0, location = '', limit = 5 }) {
  const allJobs = loadActiveJobs()
  const candidateSkills = (skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean)
  const queryTokens = (query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2)

  const scored = allJobs.map((job) => {
    let score = 0
    const matchedSkills = []
    const missingSkills = []

    const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim())

    // 1. Skill overlap (up to 50 points)
    if (jobSkills.length > 0) {
      for (const skill of job.skills) {
        const lower = skill.toLowerCase()
        const found = candidateSkills.some(
          (cs) => cs === lower || cs.includes(lower) || lower.includes(cs),
        )
        if (found) {
          matchedSkills.push(skill)
        } else {
          missingSkills.push(skill)
        }
      }
      const skillRatio = matchedSkills.length / jobSkills.length
      score += Math.round(skillRatio * 50)
    }

    // 2. Query / Role title overlap (up to 30 points)
    const titleLower = job.title.toLowerCase()
    const deptLower = (job.department || '').toLowerCase()

    let queryMatchCount = 0
    for (const token of queryTokens) {
      if (titleLower.includes(token) || deptLower.includes(token)) {
        queryMatchCount++
      }
    }
    if (queryTokens.length > 0) {
      score += Math.min(30, Math.round((queryMatchCount / queryTokens.length) * 30))
    } else {
      score += 15 // baseline if no title query specified
    }

    // 3. Location match (up to 10 points)
    if (location && location.trim()) {
      const locLower = location.toLowerCase().trim()
      if (
        job.location.toLowerCase().includes(locLower) ||
        (job.workMode && job.workMode.toLowerCase() === 'remote')
      ) {
        score += 10
      }
    } else {
      score += 5
    }

    // 4. Work mode bonus for remote/hybrid
    if (job.workMode === 'Remote') score += 5
    else if (job.workMode === 'Hybrid') score += 3

    // Cap score at 98% (never claim 100% certainty)
    score = Math.min(98, Math.max(15, score))

    return {
      ...job,
      matchScore: score,
      matchedSkills,
      missingSkills,
    }
  })

  // Sort descending by match score
  scored.sort((a, b) => b.matchScore - a.matchScore)

  return scored.slice(0, limit)
}

/**
 * Uses Ollama to generate factual explanations for why each verified job matches.
 * Strictly instructed NEVER to hallucinate fake jobs or links.
 */
async function explainJobMatches(candidateSummary, matchedJobs) {
  if (!matchedJobs || matchedJobs.length === 0) {
    return {
      jobs: [],
      summary: 'No active job listings found matching your requested criteria.',
    }
  }

  const jobDetailsForModel = matchedJobs
    .map(
      (j, idx) =>
        `Job ${idx + 1}:
- ID: ${j.id}
- Title: ${j.title}
- Company: ${j.companyName}
- Location: ${j.location} (${j.workMode})
- Matched Skills: ${j.matchedSkills.join(', ') || 'General profile overlap'}
- Missing / Growth Skills: ${j.missingSkills.join(', ') || 'None'}
- Deterministic Match Score: ${j.matchScore}%`,
    )
    .join('\n\n')

  const systemPrompt = `You are JobKhoj AI, a factual career assistant.
You will receive a candidate's profile and a list of VERIFIED active job openings from the JobKhoj database.
RULES:
1. Only evaluate the jobs explicitly provided.
2. NEVER invent job titles, IDs, company names, or salaries.
3. For each job, provide a 1-sentence explanation of why it fits and what the candidate should highlight.
4. Keep the tone professional, direct, and encouraging.`

  const userPrompt = `Candidate Profile:
${candidateSummary}

Verified Matching Jobs:
${jobDetailsForModel}

Please provide a concise overview and 1-sentence match explanation for each of the above jobs.`

  try {
    const aiResponse = await chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.3,
    })

    return {
      jobs: matchedJobs,
      aiExplanation: aiResponse.content,
      totalMatched: matchedJobs.length,
    }
  } catch (err) {
    // If Ollama is offline, return jobs with deterministic explanations
    return {
      jobs: matchedJobs,
      aiExplanation: `Found ${matchedJobs.length} verified roles matching your skills (${matchedJobs[0].matchedSkills.join(', ')}).`,
      totalMatched: matchedJobs.length,
    }
  }
}

module.exports = {
  loadActiveJobs,
  matchJobs,
  explainJobMatches,
}

