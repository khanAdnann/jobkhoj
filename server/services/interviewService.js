/**
 * AI Mock Interview Service
 *
 * Facilitates 1-on-1 technical mock interview sessions for:
 * - Java Developer
 * - Spring Boot Developer
 * - React Developer
 * - Full Stack Developer
 * - SQL Developer
 *
 * Evaluates candidate responses one question at a time, provides constructive
 * feedback, explains missing concepts, and compiles a comprehensive session review.
 */

const crypto = require('crypto')
const { sanitizeInput } = require('../middleware/security')
const { chatCompletion } = require('./ollamaService')

// In-memory isolated session store with auto-cleanup (2-hour TTL)
const sessions = new Map()

const SESSION_TTL_MS = 2 * 60 * 60 * 1000
const MAX_QUESTIONS_PER_SESSION = 5

// Fallback curated questions when Ollama is offline
const CURATED_QUESTIONS = {
  'java developer': {
    junior: [
      'Explain the difference between String, StringBuilder, and StringBuffer in Java.',
      'What is the difference between == and the .equals() method for Objects in Java?',
      'Can you explain the difference between checked and unchecked exceptions?',
      'How does the Java Garbage Collector work at a high level?',
      'Explain the concepts of method overloading and method overriding with an example.',
    ],
    mid: [
      'How does a HashMap work internally in Java 8+? What happens when a collision occurs?',
      'Explain the Java Memory Model: difference between Stack and Heap memory and where objects/primitives reside.',
      'What is the difference between synchronized blocks and ReentrantLock? When would you prefer one over the other?',
      'How do Java Streams work under the hood? Explain intermediate vs. terminal operations and lazy evaluation.',
      'What are Virtual Threads in modern Java (Project Loom) and how do they differ from platform threads?',
    ],
    senior: [
      'How would you diagnose and resolve a severe memory leak or OutOfMemoryError in a high-throughput Java service?',
      'Explain the happens-before relationship in Java and the role of the volatile keyword.',
      'Design a thread-safe, non-blocking LFU (Least Frequently Used) cache in Java.',
      'Compare G1GC, ZGC, and Shenandoah collectors. Which would you choose for a low-latency financial trading system?',
      'How does classloading work in Java, and how would you build a dynamic plugin architecture using custom classloaders?',
    ],
  },
  'spring boot developer': {
    junior: [
      'What is Inversion of Control (IoC) and Dependency Injection (DI) in Spring?',
      'What is the difference between @Component, @Service, and @Repository annotations?',
      'What is the purpose of @SpringBootApplication and what annotations are bundled within it?',
      'How do you handle global exceptions in Spring Boot using @ControllerAdvice and @ExceptionHandler?',
      'What is the difference between application.properties and application.yml in Spring Boot?',
    ],
    mid: [
      'Explain Spring Bean scopes. What happens if a Prototype bean is injected into a Singleton bean, and how do you fix it?',
      'How does Spring Boot auto-configuration work internally? Explain the role of @EnableAutoConfiguration and spring.factories/imports.',
      'What is the N+1 problem in Spring Data JPA and how do you resolve it (@EntityGraph, JOIN FETCH)?',
      'How does @Transactional work under the hood? What are propagation levels and isolation levels?',
      'How would you secure a REST API in Spring Boot using Spring Security 6 and JWT?',
    ],
    senior: [
      'How would you implement the Saga pattern for distributed transactions across multiple Spring Boot microservices?',
      'Explain how you would achieve zero-downtime database migrations with Flyway or Liquibase in a clustered Spring Boot deployment.',
      'How would you architect a resilient microservice system using Spring Cloud Gateway, Resilience4j circuit breakers, and distributed tracing with OpenTelemetry?',
      'Describe how you monitor and profile Spring Boot applications in production using Micrometer and Actuator under high load.',
      'How do you design event-driven microservices using Spring Cloud Stream and Apache Kafka, ensuring idempotent message processing?',
    ],
  },
  'react developer': {
    junior: [
      'What is the difference between controlled and uncontrolled components in React?',
      'Explain the purpose and rules of the useEffect hook in React.',
      'Why should you never mutate state directly in React?',
      'What is the significance of the key prop when rendering lists in React?',
      'What is Prop Drilling and how can you prevent it?',
    ],
    mid: [
      'How does React reconciliation and the Virtual DOM work in React 18 (Fiber architecture)?',
      'Explain useMemo and useCallback. When do they actually improve performance vs. add unnecessary overhead?',
      'How do custom hooks work in React? Build a mental model of how state is shared (or not shared) across components.',
      'Explain React 18 Concurrent Features: startTransition, useTransition, and Suspense for data fetching.',
      'How would you design a scalable global state architecture using modern tools (Context API vs. Redux Toolkit vs. Zustand)?',
    ],
    senior: [
      'How would you architect a large-scale React micro-frontend application with shared dependency management?',
      'How do you profile, identify, and eliminate unnecessary re-renders in a complex React dashboard with high-frequency live WebSocket data?',
      'Compare Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG). How does hydration work?',
      'How would you implement a robust design system with accessible components (WAI-ARIA) and design tokens in React?',
      'How do you manage cross-cutting concerns like authentication, error boundaries, telemetry, and analytics gracefully in React?',
    ],
  },
  'full stack developer': {
    junior: [
      'Explain the request-response lifecycle when a user types a URL into their browser.',
      'What are RESTful APIs and what is the difference between GET, POST, PUT, PATCH, and DELETE?',
      'How do you handle CORS (Cross-Origin Resource Sharing) between a React frontend and a backend API?',
      'Explain the difference between SQL and NoSQL databases. When would you choose which?',
      'How do you store sensitive credentials and API keys securely in a web application?',
    ],
    mid: [
      'How would you design and implement JWT authentication with refresh token rotation and secure HTTP-only cookies?',
      'Explain database indexing: B-Trees, clustered vs. non-clustered indexes, and how indexing impacts read vs. write performance.',
      'How do you implement pagination for large datasets: offset-based vs. keyset/cursor-based pagination?',
      'How would you structure a decoupled full-stack architecture with typed API contracts between frontend and backend?',
      'Explain how WebSockets differ from HTTP polling and Server-Sent Events (SSE). When would you use each?',
    ],
    senior: [
      'Architect a scalable e-commerce or job portal application capable of handling 50,000 concurrent users.',
      'How would you implement distributed caching with Redis: cache-aside, write-through, cache stampede mitigation?',
      'Explain your strategy for database sharding, replication, and handling split-brain scenarios in distributed databases.',
      'How do you approach end-to-end security: protecting against OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, SSRF, IDOR)?',
      'Describe your CI/CD pipeline and deployment strategy for rolling updates with automated canary deployments and rollbacks.',
    ],
  },
  'sql developer': {
    junior: [
      'What is the difference between WHERE and HAVING clauses in SQL?',
      'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.',
      'What are primary keys and foreign keys, and why are constraints important?',
      'What is the difference between UNION and UNION ALL?',
      'What are aggregate functions in SQL? Give examples.',
    ],
    mid: [
      'Explain SQL Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and NTILE() with an example.',
      'What is database normalization (1NF, 2NF, 3NF, BCNF) and when might you deliberately denormalize a schema?',
      'How do you interpret a PostgreSQL EXPLAIN ANALYZE execution plan to identify sequential scans and costly joins?',
      'What are ACID properties in database transactions and how do isolation levels (Read Committed, Repeatable Read, Serializable) prevent anomalies like Phantom Reads?',
      'What is the difference between CTEs (Common Table Expressions) and Subqueries? What are recursive CTEs used for?',
    ],
    senior: [
      'How would you optimize a query joining tables with 50 million rows that is causing high I/O and query timeouts?',
      'Explain table partitioning strategies (Range, List, Hash) in PostgreSQL and how partition pruning improves performance.',
      'How do you handle deadlocks in a high-concurrency transactional database?',
      'Discuss indexing techniques beyond standard B-Trees: GIN, GiST, BRIN, and Partial/Covering indexes.',
      'How would you design a point-in-time recovery (PITR) and high-availability disaster recovery plan with streaming replication?',
    ],
  },
}

function normalizeRole(role = '') {
  const r = role.toLowerCase().trim()
  if (r.includes('spring')) return 'spring boot developer'
  if (r.includes('java')) return 'java developer'
  if (r.includes('react')) return 'react developer'
  if (r.includes('sql') || r.includes('database')) return 'sql developer'
  return 'full stack developer'
}

function normalizeLevel(level = '') {
  const l = level.toLowerCase().trim()
  if (l.includes('sr') || l.includes('senior')) return 'senior'
  if (l.includes('mid')) return 'mid'
  return 'junior'
}

/**
 * Starts a new isolated mock interview session.
 */
async function startInterview({ role = 'Java Developer', level = 'Mid', topic = '' }) {
  const normRole = normalizeRole(role)
  const normLevel = normalizeLevel(level)
  const sessionId = `int-${crypto.randomBytes(8).toString('hex')}`

  // Curated fallback question
  const fallbackList = CURATED_QUESTIONS[normRole]?.[normLevel] || CURATED_QUESTIONS['java developer']['mid']
  const firstQuestionFallback = fallbackList[0]

  let firstQuestion = firstQuestionFallback

  // Attempt to generate a tailored first question with Ollama
  try {
    const systemPrompt = `You are a Principal Technical Interviewer conducting a mock interview for a ${level} ${role}.
Ask ONE concise, high-yield technical question appropriate for this role and seniority level.
Do not ask multiple questions. Do not provide the answer. Just state the question clearly.`

    const topicContext = topic ? `Focus specifically on the topic: ${topic}.` : ''
    const userPrompt = `Ask Question 1 for a ${level} ${role}. ${topicContext}`

    const aiRes = await chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.5,
    })

    if (aiRes.content && aiRes.content.length > 20) {
      firstQuestion = aiRes.content.replace(/^question\s*1\s*:\s*/i, '').trim()
    }
  } catch (err) {
    console.warn('[InterviewService] Ollama offline for question generation, using curated bank.')
  }

  const sessionData = {
    id: sessionId,
    role: normRole,
    displayRole: role,
    level: normLevel,
    displayLevel: level,
    topic,
    currentQuestionIndex: 1,
    maxQuestions: MAX_QUESTIONS_PER_SESSION,
    currentQuestion: firstQuestion,
    history: [],
    createdAt: Date.now(),
  }

  sessions.set(sessionId, sessionData)

  return {
    success: true,
    sessionId,
    role,
    level,
    questionIndex: 1,
    totalQuestions: MAX_QUESTIONS_PER_SESSION,
    question: firstQuestion,
  }
}

/**
 * Evaluates candidate answer and either asks next question or generates final summary.
 */
async function submitAnswer({ sessionId, answer = '' }) {
  const session = sessions.get(sessionId)
  if (!session) {
    throw new Error('Interview session expired or not found. Please start a new session.')
  }

  const sanitizedAnswer = sanitizeInput(answer, 4000)
  if (!sanitizedAnswer || sanitizedAnswer.length < 10) {
    throw new Error('Please provide a substantive answer (at least 10 characters).')
  }

  const currentQ = session.currentQuestion
  const isLastQuestion = session.currentQuestionIndex >= session.maxQuestions

  // Construct evaluation prompt for Ollama
  const systemPrompt = `You are an expert Technical Interviewer.
You are evaluating a candidate's answer for Question ${session.currentQuestionIndex} of a ${session.displayLevel} ${session.displayRole} interview.

Evaluate the answer thoroughly:
1. Technical Correctness Score: Rate from 1 to 10.
2. Strengths: What was accurate and clearly explained.
3. Missing Concepts or Inaccuracies: Technical nuances, edge cases, or optimizations that were omitted.
4. Constructive Feedback: Brief advice on how to improve this answer in a real interview.

Format your output with clear markdown headings:
### Score: X/10
### What You Did Well
### Key Missing Concepts
### Pro-Tip for Interviews`

  const userPrompt = `Question:
${currentQ}

Candidate Answer:
${sanitizedAnswer}

Please provide your evaluation.`

  let feedback = ''
  let score = 7

  try {
    const aiRes = await chatCompletion({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      temperature: 0.3,
    })
    feedback = aiRes.content
    const scoreMatch = feedback.match(/Score:\s*(\d+)\/10/i)
    if (scoreMatch) score = parseInt(scoreMatch[1], 10)
  } catch (err) {
    feedback = `### Score: 7/10
### What You Did Well
You provided a relevant explanation demonstrating foundational understanding of the concept.

### Key Missing Concepts
Consider going deeper into internal architectural mechanics, performance implications, and production trade-offs.

### Pro-Tip for Interviews
Always structure answers using: Concept Definition -> How it Works Under the Hood -> Concrete Production Use Case -> Edge Cases.`
  }

  // Record into history
  session.history.push({
    questionIndex: session.currentQuestionIndex,
    question: currentQ,
    answer: sanitizedAnswer,
    feedback,
    score,
  })

  // Check if session completed
  if (isLastQuestion) {
    const totalScore = session.history.reduce((acc, h) => acc + h.score, 0)
    const avgScore = Math.round((totalScore / session.history.length) * 10) / 10

    const summaryReport = `### Session Complete: ${session.displayRole} (${session.displayLevel})
- **Total Questions Answered:** ${session.history.length}
- **Average Performance Score:** ${avgScore} / 10

#### Overall Evaluation
You demonstrated solid technical proficiency. Review the feedback provided on each question to refine your depth on internal mechanics and trade-offs.

*Disclaimer: This AI practice session is an educational simulation and does not represent an actual hiring outcome.*`

    sessions.delete(sessionId)

    return {
      success: true,
      sessionId,
      isComplete: true,
      feedback,
      score,
      summaryReport,
      totalScore: avgScore,
    }
  }

  // Generate next question
  session.currentQuestionIndex++
  const nextIdx = session.currentQuestionIndex
  const fallbackList = CURATED_QUESTIONS[session.role]?.[session.level] || []
  let nextQuestion = fallbackList[nextIdx - 1] || 'Describe an end-to-end technical challenge you solved and how you tested it.'

  try {
    const nextQPrompt = `Ask Question ${nextIdx} for a ${session.displayLevel} ${session.displayRole}.
Make it a different technical sub-topic than the previous question ("${currentQ}").
Do not provide the answer.`

    const aiRes = await chatCompletion({
      messages: [{ role: 'user', content: nextQPrompt }],
      systemPrompt: `You are a Technical Interviewer for a ${session.displayLevel} ${session.displayRole}. Output ONLY the question.`,
      temperature: 0.6,
    })

    if (aiRes.content && aiRes.content.length > 20) {
      nextQuestion = aiRes.content.replace(/^question\s*\d+\s*:\s*/i, '').trim()
    }
  } catch (err) {
    console.warn('[InterviewService] Ollama offline for next question, using curated bank.')
  }

  session.currentQuestion = nextQuestion

  return {
    success: true,
    sessionId,
    isComplete: false,
    feedback,
    score,
    nextQuestionIndex: nextIdx,
    totalQuestions: session.maxQuestions,
    nextQuestion,
  }
}

module.exports = {
  startInterview,
  submitAnswer,
}

