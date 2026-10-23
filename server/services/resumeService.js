/**
 * Resume Analysis & Processing Service
 *
 * Extracts text from PDF, DOCX, or raw text input.
 * Redacts personal identifiers, runs deterministic checks, and uses Ollama
 * to generate actionable recommendations without predicting hiring success.
 */

const { redactPii, sanitizeInput } = require('../middleware/security')
const { chatCompletion } = require('./ollamaService')

// Common tech skills dictionary for deterministic extraction
const TECH_SKILLS = [
  'java',
  'spring',
  'spring boot',
  'hibernate',
  'microservices',
  'react',
  'react.js',
  'javascript',
  'typescript',
  'node.js',
  'express',
  'next.js',
  'html',
  'css',
  'tailwind',
  'tailwind css',
  'python',
  'django',
  'fastapi',
  'flask',
  'sql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'ci/cd',
  'git',
  'github',
  'kafka',
  'graphql',
  'rest api',
  'junit',
  'jest',
  'c++',
  'c#',
  '.net',
  'linux',
]

/**
 * Extracts plain text from DOCX base64 buffer using mammoth if available.
 */
async function extractDocxText(base64Data) {
  try {
    const mammoth = require('mammoth')
    const buffer = Buffer.from(base64Data, 'base64')
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (err) {
    console.warn('[ResumeService] Mammoth DOCX parsing fallback:', err.message)
    // Fallback: extract printable strings from buffer
    const buffer = Buffer.from(base64Data, 'base64')
    return buffer.toString('utf8').replace(/[^\x20-\x7E\n\t]/g, ' ')
  }
}

/**
 * Basic text extraction from PDF base64 buffer.
 */
function extractPdfText(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, 'base64')
    const raw = buffer.toString('latin1')
    // Extract stream content between BT (Begin Text) and ET (End Text)
    const textChunks = []
    const regex = /\((.*?)\)\s*Tj/g
    let match
    while ((match = regex.exec(raw)) !== null) {
      if (match[1]) textChunks.push(match[1])
    }

    if (textChunks.length > 20) {
      return textChunks.join(' ')
    }

    // Fallback printable ASCII extraction
    return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ')
  } catch (err) {
    console.warn('[ResumeService] PDF parsing fallback:', err.message)
    return ''
  }
}

/**
 * Deterministic skill and section extractor.
 */
function detectSkillsAndSections(text) {
  const lower = text.toLowerCase()
  const foundSkills = []

  for (const skill of TECH_SKILLS) {
    // Word boundary check
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(lower)) {
      foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1))
    }
  }

  // Detect experience years (e.g., "5+ years", "3 years of experience")
  const expMatch = lower.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/)
  const detectedYears = expMatch ? parseInt(expMatch[1], 10) : null

  // Section checks
  const hasExperienceSection = /experience|work history|employment/i.test(lower)
  const hasEducationSection = /education|degree|university|b\.tech|bachelor|master/i.test(lower)
  const hasProjectsSection = /projects|portfolio/i.test(lower)
  const hasSkillsSection = /skills|technologies|technical proficiencies/i.test(lower)

  return {
    detectedSkills: [...new Set(foundSkills)],
    detectedYears,
    sections: {
      experience: hasExperienceSection,
      education: hasEducationSection,
      projects: hasProjectsSection,
      skills: hasSkillsSection,
    },
  }
}

/**
 * Analyzes resume content using deterministic rules + Ollama for qualitative insights.
 */
async function analyzeResume({ text = '', fileBase64 = null, fileType = null, targetJob = null }) {
  let rawText = text

  // If a file is uploaded as base64
  if (fileBase64) {
    if (fileType === 'docx' || fileType?.includes('word')) {
      rawText = await extractDocxText(fileBase64)
    } else if (fileType === 'pdf' || fileType?.includes('pdf')) {
      rawText = extractPdfText(fileBase64)
    }
  }

  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Please provide at least 50 characters of readable resume text.')
  }

  // Sanitize and redact personal contact information before AI inspection
  const sanitized = sanitizeInput(rawText, 12000)
  const redacted = redactPii(sanitized)

  // Deterministic checks
  const deterministic = detectSkillsAndSections(redacted)

  // Construct Ollama Prompt
  const systemPrompt = `You are JobKhoj's Expert Career and Resume Reviewer.
Analyze the provided resume text objectively.
RULES:
1. Provide constructive, actionable feedback.
2. Highlight specific strengths and key technical keywords found.
3. Identify missing qualifications, weak descriptions, or formatting issues.
4. Suggest high-impact rewrites using Google's XYZ formula: "Accomplished [X], as measured by [Y], by doing [Z]".
5. Never claim that any score or analysis guarantees hiring success.
6. Return structured markdown with headings:
   - ### Summary Overview
   - ### Key Strengths
   - ### Detected Technical Skills
   - ### Areas for Improvement & Missing Keywords
   - ### Actionable Bullet Point Enhancements (STAR/XYZ)`

  const targetContext = targetJob
    ? `Target Job Description: ${targetJob.title} (${targetJob.skills?.join(', ') || ''})\n\n`
    : ''

  const userPrompt = `${targetContext}Resume Text:
${redacted.slice(0, 5000)}

Please provide your comprehensive analysis.`

  try {
    const aiResponse = await chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.4,
    })

    return {
      success: true,
      deterministic: {
        detectedSkills: deterministic.detectedSkills,
        detectedYears: deterministic.detectedYears,
        sections: deterministic.sections,
      },
      analysisReport: aiResponse.content,
      disclaimer:
        'This analysis is designed for guidance and optimization. It does not predict or guarantee interview or hiring outcomes.',
    }
  } catch (err) {
    // If Ollama is offline, return comprehensive deterministic report
    const fallbackReport = `### Summary Overview
Detected ${deterministic.detectedSkills.length} key technical skills across your resume.
${deterministic.detectedYears ? `Identified approximately **${deterministic.detectedYears} years** of experience.` : ''}

### Detected Technical Skills
${deterministic.detectedSkills.map((s) => `- ${s}`).join('\n') || '- None identified from standard dictionary.'}

### Section Checklist
- **Work Experience Section:** ${deterministic.sections.experience ? 'Found' : 'Missing or unlabelled'}
- **Education Section:** ${deterministic.sections.education ? 'Found' : 'Missing or unlabelled'}
- **Projects Section:** ${deterministic.sections.projects ? 'Found' : 'Missing or unlabelled'}
- **Skills Section:** ${deterministic.sections.skills ? 'Found' : 'Missing or unlabelled'}

### Actionable Enhancement Recommendations
1. **Apply Google's XYZ Formula:** Transform bullet points from duties into measurable achievements: *"Accomplished [X], as measured by [Y], by doing [Z]"*.
2. **Align with Active Roles:** Add specific keywords from target job listings to pass recruiter ATS filters.
3. **Quantify Metrics:** Wherever possible, mention percentages, latency reductions, user counts, or project delivery timelines.`

    return {
      success: true,
      deterministic: {
        detectedSkills: deterministic.detectedSkills,
        detectedYears: deterministic.detectedYears,
        sections: deterministic.sections,
      },
      analysisReport: fallbackReport,
      offlineNotice: 'AI qualitative review is in offline mode. Standard criteria report generated.',
      disclaimer:
        'This analysis is designed for guidance and optimization. It does not predict or guarantee interview or hiring outcomes.',
    }
  }
}

/**
 * Generates a tailored cover letter from user profile/resume and target JobKhoj job.
 * Strictly avoids hallucinating degrees or companies.
 */
async function generateCoverLetter({
  candidateName = 'Applicant',
  skills = [],
  experienceYears = 0,
  currentTitle = 'Software Engineer',
  highlights = '',
  jobTitle = '',
  companyName = '',
  jobDescription = '',
  tone = 'professional',
}) {
  const sanitizedHighlights = sanitizeInput(highlights, 1000)
  const sanitizedJd = sanitizeInput(jobDescription, 3000)

  const systemPrompt = `You are JobKhoj AI Cover Letter Generator.
Draft a tailored, compelling cover letter for the candidate applying to a real job opening.
CRITICAL RULES:
1. ONLY reference skills, experience, and background explicitly provided by the user.
2. NEVER invent past employers, fake universities, degrees, or false metrics.
3. Tone: ${tone} (Options: professional, confident, friendly, concise).
4. Structure:
   - Greeting
   - Hook: Position applied for and why candidate is interested in ${companyName || 'the company'}
   - Core value: Connect the candidate's actual skills (${skills.join(', ')}) to the job requirements
   - Call to action & professional closing
5. Return ONLY the letter text with placeholders only if user details were absent.`

  const userPrompt = `Candidate Information:
- Name: ${candidateName}
- Current/Target Role: ${currentTitle}
- Years of Experience: ${experienceYears} yrs
- Key Skills: ${skills.join(', ')}
- Personal Highlights: ${sanitizedHighlights || 'Demonstrated track record of delivering reliable software solutions.'}

Target Role:
- Job Title: ${jobTitle}
- Company: ${companyName || 'Hiring Team'}
- Job Details: ${sanitizedJd || 'Seeking a skilled developer to build scalable systems.'}

Please compose the customized cover letter now.`

  try {
    const aiResponse = await chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.6,
    })

    return {
      success: true,
      coverLetter: aiResponse.content,
      tone,
    }
  } catch (err) {
    // Fallback template letter
    const fallbackLetter = `Dear Hiring Team at ${companyName || 'your company'},

I am writing to express my strong interest in the ${jobTitle || 'Developer'} role. With over ${experienceYears || 2} years of professional experience in software development and expertise in ${skills.slice(0, 4).join(', ') || 'modern software technologies'}, I am excited about the opportunity to contribute to your team.

Throughout my career, I have focused on building maintainable, high-quality applications. My background in ${skills[0] || 'core engineering'} has enabled me to deliver reliable solutions that align with business objectives. I am drawn to ${companyName || 'your organization'} because of your commitment to technical excellence and impact.

Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience and skills align with your current goals.

Sincerely,
${candidateName}
`

    return {
      success: true,
      coverLetter: fallbackLetter,
      tone,
      offlineNotice: 'Generated using JobKhoj verified template (Ollama offline).',
    }
  }
}

module.exports = {
  analyzeResume,
  generateCoverLetter,
  detectSkillsAndSections,
}

