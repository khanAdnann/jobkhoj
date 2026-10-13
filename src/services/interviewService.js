import { api, request } from './api'
import * as tools from './toolsService'

/**
 * Interview Question Generator.
 *
 * `INTERVIEW_ENDPOINT` is the future LLM hook; the local bank below produces
 * a complete, role-aware set today and is also the offline fallback.
 */
export const INTERVIEW_ENDPOINT = '/api/tools/interview/generate'

export const DIFFICULTIES = [
  { id: 'Easy', label: 'Easy', hint: 'Fundamentals and syntax' },
  { id: 'Medium', label: 'Medium', hint: 'Applied, day-to-day depth' },
  { id: 'Hard', label: 'Hard', hint: 'Trade-offs and failure modes' },
  { id: 'Expert', label: 'Expert', hint: 'Architecture and mentoring' },
]

/** @type {Record<string,{label:string,match:string[],questions:Array<{q:string,d:string,why:string}>}>} */
export const QUESTION_BANK = {
  java: {
    label: 'Core Java',
    match: ['java', 'jdk', 'j2ee'],
    questions: [
      { q: 'Explain the difference between HashMap and ConcurrentHashMap, and when each is appropriate.', d: 'Medium', why: 'Everyday collection choice plus concurrency awareness.' },
      { q: 'How does the JVM garbage collector decide what to collect, and what problem do full GC pauses cause?', d: 'Hard', why: 'Shows depth beyond syntax.' },
      { q: 'What are the differences between abstract classes and interfaces in modern Java?', d: 'Easy', why: 'Baseline language knowledge.' },
      { q: 'Walk through how a lambda is implemented under the hood (invokedynamic).', d: 'Expert', why: 'Separates users from language-level understanding.' },
      { q: 'How do you handle immutable objects and thread safety in a shared service?', d: 'Medium', why: 'Practical concurrency judgement.' },
      { q: 'When would you choose CompletableFuture over reactive streams?', d: 'Hard', why: 'Trade-off reasoning.' },
    ],
  },
  spring: {
    label: 'Spring Boot',
    match: ['spring', 'springboot', 'spring boot'],
    questions: [
      { q: 'Explain the Spring bean lifecycle and where custom initialisation belongs.', d: 'Medium', why: 'Core framework model.' },
      { q: 'How does dependency injection differ from constructor wiring in practice, and what are the pitfalls of field injection?', d: 'Easy', why: 'Design hygiene.' },
      { q: 'How would you secure an endpoint with Spring Security and JWT?', d: 'Medium', why: 'Common production requirement.' },
      { q: 'What happens inside @Transactional when a method calls another method on the same class?', d: 'Hard', why: 'Classic proxy trap.' },
      { q: 'How do you structure a Spring Boot app so it stays testable as it grows?', d: 'Expert', why: 'Architecture judgement.' },
      { q: 'How do you tune connection pools and timeouts for a service under load?', d: 'Hard', why: 'Operations readiness.' },
    ],
  },
  microservices: {
    label: 'Microservices',
    match: ['microservices', 'microservice', 'distributed'],
    questions: [
      { q: 'How do you keep data consistent across two services without distributed transactions?', d: 'Hard', why: 'Saga/event-driven knowledge.' },
      { q: 'Explain idempotency and why retries without it are dangerous.', d: 'Medium', why: 'Reliability fundamentals.' },
      { q: 'How would you handle a partial failure in a chain of three service calls?', d: 'Hard', why: 'Failure-mode thinking.' },
      { q: 'What belongs in a shared library versus each service?', d: 'Medium', why: 'Boundaries and coupling.' },
      { q: 'How do you decide the service decomposition boundary for a new domain?', d: 'Expert', why: 'Domain design.' },
      { q: 'How would you roll out a breaking API change across dependent services?', d: 'Medium', why: 'Change management.' },
    ],
  },
  kafka: {
    label: 'Kafka',
    match: ['kafka', 'event streaming', 'message queue', 'rabbitmq'],
    questions: [
      { q: 'What is the difference between a partition and a topic, and how does it affect ordering?', d: 'Easy', why: 'Core model.' },
      { q: 'How do you choose the number of partitions for a topic?', d: 'Medium', why: 'Sizing judgement.' },
      { q: 'What happens when a consumer group rebalances mid-processing?', d: 'Hard', why: 'Operational reality.' },
      { q: 'How do you guarantee exactly-once processing with Kafka?', d: 'Expert', why: 'Semantics depth.' },
      { q: 'How would you replay a day of events after a bug in production?', d: 'Medium', why: 'Recovery thinking.' },
      { q: 'How do you handle schema evolution for event payloads?', d: 'Hard', why: 'Long-term compatibility.' },
    ],
  },
  sql: {
    label: 'SQL & Databases',
    match: ['sql', 'mysql', 'postgres', 'postgresql', 'oracle', 'database'],
    questions: [
      { q: 'When does a database index make queries slower, and how do you verify with EXPLAIN?', d: 'Medium', why: 'Practical tuning.' },
      { q: 'Explain isolation levels and the anomaly each one prevents.', d: 'Hard', why: 'Correctness under concurrency.' },
      { q: 'How do you find and fix a N+1 query in an application?', d: 'Medium', why: 'Common performance bug.' },
      { q: 'What is the difference between a clustered and a non-clustered index?', d: 'Easy', why: 'Baseline knowledge.' },
      { q: 'How would you migrate a 500-million-row table with zero downtime?', d: 'Expert', why: 'Real-world operations.' },
      { q: 'When would you denormalise, and what does it cost you?', d: 'Hard', why: 'Trade-off judgement.' },
    ],
  },
  systemDesign: {
    label: 'System Design',
    match: ['system design', 'architecture', 'scalability'],
    questions: [
      { q: 'Design a job-matching service that returns relevant roles in under 200 ms.', d: 'Hard', why: 'End-to-end architecture.' },
      { q: 'How would you design a URL shortener that handles 100k writes per second?', d: 'Medium', why: 'Classic capacity exercise.' },
      { q: 'How do you approach caching: what to cache, invalidation strategy, and stampede protection?', d: 'Medium', why: 'Everyday design decision.' },
      { q: 'Design a rate limiter for a public API and justify the algorithm.', d: 'Hard', why: 'Concrete component design.' },
      { q: 'How would you evolve a monolith into services without a big-bang rewrite?', d: 'Expert', why: 'Migration strategy.' },
      { q: 'What metrics would you watch to know a service is healthy?', d: 'Easy', why: 'Operational baseline.' },
    ],
  },
  scenario: {
    label: 'Scenario Based',
    match: ['behavioural', 'scenario'],
    questions: [
      { q: 'Tell me about a production incident you owned. What did you do in the first 10 minutes?', d: 'Medium', why: 'Incident response and ownership.' },
      { q: 'Describe a time you disagreed with a technical decision. What did you do?', d: 'Medium', why: 'Conflict and influence.' },
      { q: 'You are asked to ship a feature with a deadline you know is unrealistic. How do you handle it?', d: 'Hard', why: 'Expectation management.' },
      { q: 'Give an example of something you reduced or automated measurably.', d: 'Easy', why: 'Impact orientation.' },
      { q: 'How have you mentored a junior engineer?', d: 'Medium', why: 'Leadership signal.' },
      { q: 'Tell me about a decision you regret technically and what it taught you.', d: 'Hard', why: 'Self-awareness.' },
    ],
  },
  frontend: {
    label: 'Frontend',
    match: ['react', 'javascript', 'frontend', 'angular', 'vue', 'typescript'],
    questions: [
      { q: 'Explain the virtual DOM and when reconciliation actually re-renders.', d: 'Medium', why: 'Framework fundamentals.' },
      { q: 'How do you prevent unnecessary re-renders in a large React app?', d: 'Medium', why: 'Performance practice.' },
      { q: 'What is the difference between debounce and throttling, with use cases?', d: 'Easy', why: 'Baseline utility knowledge.' },
      { q: 'How would you structure state: local, shared, server, and URL?', d: 'Hard', why: 'Architecture judgement.' },
      { q: 'How do you make a complex form accessible from day one?', d: 'Medium', why: 'Accessibility awareness.' },
      { q: 'How would you lazy-load routes without breaking deep links?', d: 'Hard', why: 'Delivery concerns.' },
    ],
  },
  devops: {
    label: 'DevOps & Cloud',
    match: ['docker', 'kubernetes', 'aws', 'devops', 'terraform', 'ci'],
    questions: [
      { q: 'What is the difference between a Docker image layer cache and a Kubernetes readiness probe?', d: 'Easy', why: 'Daily-tooling basics.' },
      { q: 'How do you roll back a bad deployment without downtime?', d: 'Medium', why: 'Release safety.' },
      { q: 'Explain how you would secret-manage credentials across environments.', d: 'Hard', why: 'Security practice.' },
      { q: 'When is Kubernetes the wrong answer?', d: 'Expert', why: 'Tooling judgement.' },
      { q: 'How do you make infrastructure changes reviewable before apply?', d: 'Medium', why: 'IaC discipline.' },
      { q: 'How would you size a cluster for a workload with a spiky traffic pattern?', d: 'Hard', why: 'Cost and capacity.' },
    ],
  },
}

const norm = (value = '') => String(value).toLowerCase()

function resolveCategories(skills, jobTitle) {
  const haystack = [...skills, jobTitle].map(norm)
  const chosen = []

  Object.entries(QUESTION_BANK).forEach(([key, entry]) => {
    const matched = haystack.some((text) => entry.match.some((needle) => text.includes(needle)))
    if (matched) chosen.push(key)
  })

  // Always include behavioural + design so no set feels incomplete.
  if (!chosen.includes('scenario')) chosen.push('scenario')
  if (!chosen.includes('systemDesign') && chosen.length < 4) chosen.push('systemDesign')

  return chosen.slice(0, 7)
}

function pickForDifficulty(questions, difficulty, count) {
  if (difficulty) {
    const exact = questions.filter((question) => question.d === difficulty)
    if (exact.length) return exact.slice(0, count)
  }
  // Even spread across the difficulty ladder otherwise.
  const buckets = { Easy: [], Medium: [], Hard: [], Expert: [] }
  questions.forEach((question) => buckets[question.d]?.push(question))
  const picked = []
  let round = 0
  while (picked.length < count && Object.values(buckets).some((bucket) => bucket[round])) {
    Object.values(buckets).forEach((bucket) => {
      if (bucket[round] && picked.length < count) picked.push(bucket[round])
    })
    round += 1
  }
  return picked
}

/**
 * @param {{jobTitle:string,experience:string|number,skills:string[]|string,
 *          difficulty?:string,count?:number}} input
 */
export function generateQuestionSet(input = {}) {
  const {
    jobTitle = '',
    experience = 0,
    skills = [],
    difficulty = '',
    count = 5,
  } = input

  const skillList = Array.isArray(skills)
    ? skills.filter(Boolean)
    : String(skills)
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)

  const years = Number(experience) || 0
  const keys = resolveCategories(skillList, jobTitle)

  const categories = keys.map((key) => {
    const entry = QUESTION_BANK[key]
    const picked = pickForDifficulty(entry.questions, difficulty, count)
    return {
      key,
      name: entry.label,
      questions: picked.map((question, index) => ({
        id: `${key}-${index}`,
        question: question.q,
        difficulty: question.d,
        focus: question.why,
      })),
    }
  })

  const result = {
    categories,
    total: categories.reduce((sum, category) => sum + category.questions.length, 0),
    seniority: years >= 8 ? 'Lead' : years >= 5 ? 'Senior' : years >= 2 ? 'Mid Level' : 'Junior',
    meta: {
      mode: 'mock',
      aiReady: true,
      endpoint: INTERVIEW_ENDPOINT,
      note: 'Generated from the local question bank. Connect an LLM endpoint for unlimited, custom sets.',
    },
  }

  tools.recordHistory({
    toolId: 'interview-questions',
    tool: 'Interview Question Generator',
    fileName: jobTitle || 'Interview prep',
    summary: `${result.total} questions · ${categories.length} categories`,
  })

  return result
}

/** Future LLM call shape. */
export function aiRequest(input = {}) {
  return { endpoint: INTERVIEW_ENDPOINT, payload: { ...input, kind: 'interview-questions' } }
}

/** Live wrapper — identical result shape, backend-ready when connected. */
export function generateQuestionSetAsync(input = {}) {
  return request(
    () => api.post(INTERVIEW_ENDPOINT, input),
    async () => generateQuestionSet(input),
  )
}

export default generateQuestionSet
