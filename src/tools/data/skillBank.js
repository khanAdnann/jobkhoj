/**
 * Shared skill vocabulary for the Career Tools analysis engines.
 *
 * Matching is alias-aware: "spring" and "springboot" both resolve to
 * "Spring Boot", so a resume and a JD written with different spellings still
 * count as a match. Every entry is data, never a status literal.
 */

/** @type {Array<{name:string,group:string,aliases?:string[]}>} */
export const SKILL_VOCABULARY = [
  /* languages */
  { name: 'Java', group: 'language', aliases: ['java se', 'jdk', 'j2ee'] },
  { name: 'Python', group: 'language', aliases: ['python3'] },
  { name: 'JavaScript', group: 'language', aliases: ['js', 'es6', 'ecmascript'] },
  { name: 'TypeScript', group: 'language', aliases: ['ts'] },
  { name: 'Kotlin', group: 'language' },
  { name: 'Scala', group: 'language' },
  { name: 'Go', group: 'language', aliases: ['golang'] },
  { name: 'C++', group: 'language', aliases: ['cpp', 'c plus plus'] },
  { name: 'C#', group: 'language', aliases: ['c sharp', '.net', 'dotnet'] },
  { name: 'PHP', group: 'language' },
  { name: 'Ruby', group: 'language' },
  { name: 'Swift', group: 'language' },
  { name: 'SQL', group: 'language', aliases: ['plsql', 'pl/sql', 't-sql'] },
  { name: 'R', group: 'language' },
  { name: 'Shell Scripting', group: 'language', aliases: ['bash', 'shell'] },

  /* frameworks */
  { name: 'Spring Boot', group: 'framework', aliases: ['spring', 'springboot', 'spring mvc'] },
  { name: 'Spring Security', group: 'framework', aliases: ['oauth2', 'jwt'] },
  { name: 'Hibernate', group: 'framework', aliases: ['jpa'] },
  { name: 'React', group: 'framework', aliases: ['reactjs', 'react.js'] },
  { name: 'Angular', group: 'framework', aliases: ['angularjs'] },
  { name: 'Vue.js', group: 'framework', aliases: ['vue', 'vuejs'] },
  { name: 'Next.js', group: 'framework', aliases: ['nextjs'] },
  { name: 'Node.js', group: 'framework', aliases: ['node', 'nodejs', 'express', 'expressjs'] },
  { name: 'Django', group: 'framework' },
  { name: 'Flask', group: 'framework' },
  { name: 'Laravel', group: 'framework' },
  { name: 'ASP.NET', group: 'framework' },
  { name: 'GraphQL', group: 'framework' },
  { name: 'REST API', group: 'framework', aliases: ['restful', 'rest apis', 'rest services'] },
  { name: 'Microservices', group: 'framework', aliases: ['microservices architecture', 'micro service'] },
  { name: 'JUnit', group: 'framework', aliases: ['mockito', 'testng'] },

  /* data & messaging */
  { name: 'Kafka', group: 'data', aliases: ['apache kafka'] },
  { name: 'RabbitMQ', group: 'data', aliases: ['rabbit mq', 'amqp'] },
  { name: 'Redis', group: 'data', aliases: ['redis cache'] },
  { name: 'Elasticsearch', group: 'data', aliases: ['elastic search', 'elk'] },
  { name: 'Spark', group: 'data', aliases: ['pyspark', 'apache spark'] },
  { name: 'Hadoop', group: 'data' },
  { name: 'Airflow', group: 'data', aliases: ['apache airflow'] },
  { name: 'Power BI', group: 'data', aliases: ['powerbi'] },
  { name: 'Tableau', group: 'data' },
  { name: 'Excel', group: 'data' },

  /* databases */
  { name: 'MySQL', group: 'database', aliases: ['my sql'] },
  { name: 'PostgreSQL', group: 'database', aliases: ['postgres', 'postgre sql'] },
  { name: 'MongoDB', group: 'database', aliases: ['mongo'] },
  { name: 'Oracle', group: 'database', aliases: ['oracle db'] },
  { name: 'SQL Server', group: 'database', aliases: ['mssql', 'ms sql'] },
  { name: 'Cassandra', group: 'database' },
  { name: 'DynamoDB', group: 'database' },

  /* cloud & devops */
  { name: 'AWS', group: 'cloud', aliases: ['amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', group: 'cloud', aliases: ['microsoft azure', 'azure devops'] },
  { name: 'GCP', group: 'cloud', aliases: ['google cloud', 'google cloud platform'] },
  { name: 'Docker', group: 'devops', aliases: ['docker compose'] },
  { name: 'Kubernetes', group: 'devops', aliases: ['k8s'] },
  { name: 'Terraform', group: 'devops', aliases: ['terraform cloud'] },
  { name: 'Jenkins', group: 'devops' },
  { name: 'GitHub Actions', group: 'devops', aliases: ['ci cd', 'cicd', 'gitlab ci'] },
  { name: 'Ansible', group: 'devops' },
  { name: 'Prometheus', group: 'devops', aliases: ['grafana'] },
  { name: 'Nginx', group: 'devops' },
  { name: 'Git', group: 'devops', aliases: ['github', 'gitlab', 'bitbucket'] },

  /* frontend & design */
  { name: 'HTML', group: 'frontend', aliases: ['html5'] },
  { name: 'CSS', group: 'frontend', aliases: ['css3', 'sass', 'scss', 'tailwind', 'tailwind css'] },
  { name: 'Redux', group: 'frontend', aliases: ['redux toolkit', 'zustand'] },
  { name: 'Webpack', group: 'frontend', aliases: ['vite', 'babel'] },
  { name: 'jQuery', group: 'frontend' },
  { name: 'Tailwind CSS', group: 'frontend' },
  { name: 'Figma', group: 'frontend' },

  /* testing & practices */
  { name: 'Unit Testing', group: 'practice', aliases: ['tdd', 'jest', 'junit 5'] },
  { name: 'CI/CD Pipelines', group: 'practice' },
  { name: 'Agile', group: 'practice', aliases: ['scrum', 'sprint planning'] },
  { name: 'Kanban', group: 'practice' },
  { name: 'System Design', group: 'practice', aliases: ['distributed systems', 'system architecture'] },
  { name: 'Design Patterns', group: 'practice', aliases: ['solid principles', 'oop'] },
  { name: 'Data Structures', group: 'practice', aliases: ['algorithms', 'dsa'] },
  { name: 'Performance Optimization', group: 'practice', aliases: ['profiling', 'tuning'] },

  /* soft skills */
  { name: 'Communication', group: 'soft', aliases: ['verbal communication'] },
  { name: 'Leadership', group: 'soft', aliases: ['team lead', 'led team'] },
  { name: 'Problem Solving', group: 'soft', aliases: ['analytical thinking'] },
  { name: 'Team Collaboration', group: 'soft', aliases: ['collaboration', 'cross functional'] },
  { name: 'Time Management', group: 'soft' },
  { name: 'Mentoring', group: 'soft', aliases: ['mentor'] },
  { name: 'Stakeholder Management', group: 'soft', aliases: ['client handling'] },
]

/** Strong opening verbs recruiters look for in experience bullets. */
export const ACTION_VERBS = [
  'achieved', 'architected', 'automated', 'built', 'launched', 'led', 'migrated',
  'optimized', 'optimised', 'reduced', 'increased', 'designed', 'delivered',
  'improved', 'implemented', 'integrated', 'mentored', 'negotiated', 'owned',
  'refactored', 'scaled', 'shipped', 'streamlined', 'spearheaded', 'simplified',
  'accelerated', 'consolidated', 'coordinated', 'developed', 'engineered',
]

/** Certification strings recognised in resumes and JDs. */
export const CERTIFICATION_VOCABULARY = [
  'AWS Certified Solutions Architect', 'AWS Certified Developer', 'Azure Fundamentals',
  'Azure Administrator', 'Google Cloud Associate', 'Certified Kubernetes Administrator',
  'Certified Scrum Master', 'PMP', 'ITIL', 'Oracle Certified Professional',
  'Salesforce Certified', 'Meta Front-End Developer', 'Google Data Analytics',
  'CompTIA', 'Six Sigma',
]

/** Job titles recognised when classifying seniority. */
export const JOB_TITLE_VOCABULARY = [
  'Software Engineer', 'Software Developer', 'Java Developer', 'Backend Developer',
  'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Cloud Engineer',
  'Data Engineer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
  'QA Engineer', 'SDET', 'Mobile Developer', 'Android Developer', 'iOS Developer',
  'Product Manager', 'Project Manager', 'Business Analyst', 'UI UX Designer',
  'System Architect', 'Technical Lead', 'Engineering Manager', 'Site Reliability Engineer',
]

export const SENIORITY_LEVELS = [
  { key: 'intern', label: 'Intern', markers: ['intern', 'internship', 'trainee'] },
  { key: 'junior', label: 'Junior', markers: ['junior', 'entry level', 'fresher', '0-2 years', '0–2 years'] },
  { key: 'mid', label: 'Mid Level', markers: ['2-5 years', '2–5 years', '3-6 years', '3–6 years', 'associate'] },
  { key: 'senior', label: 'Senior', markers: ['senior', '5-8 years', '5–8 years', 'sr.', 'staff'] },
  { key: 'lead', label: 'Lead / Principal', markers: ['lead', 'principal', 'architect', 'head of', '8+ years', '8+ yrs'] },
  { key: 'manager', label: 'Manager', markers: ['manager', 'director', 'head', 'vp', 'vice president'] },
]

/** Common metros used to pull a location out of a job description. */
export const KNOWN_LOCATIONS = [
  'Bengaluru', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai', 'Gurugram',
  'Gurgaon', 'Noida', 'Delhi', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi',
  'Coimbatore', 'Indore', 'Chandigarh', 'Trivandrum', 'Remote', 'Anywhere in India',
  'United States', 'New York', 'London', 'Singapore', 'Dubai',
]

/** Degree patterns recognised in education requirements. */
export const DEGREE_PATTERNS = [
  /b\.?tech/i, /b\.?e\b/i, /bachelor/i, /b\.?sc\b/i, /b\.?ca\b/i, /b\.?com/i,
  /m\.?tech/i, /master/i, /m\.?sc\b/i, /m\.?ba\b/i, /mba\b/i, /ph\.?d\b/i,
  /diploma/i, /graduate/i,
]

/** Blanket resume keyword bank used for keyword-density scoring. */
export const RESUME_KEYWORD_BANK = [
  ...SKILL_VOCABULARY.map((skill) => skill.name),
  ...ACTION_VERBS,
  'impact', 'outcome', 'result', 'metric', 'stakeholder', 'roadmap', 'ownership',
  'production', 'scalable', 'reliable', 'maintainable', 'cross-functional',
  'achievements', 'awards', 'certification', 'portfolio', 'linkedin',
]

export function vocabularyIndex() {
  return SKILL_VOCABULARY.map((skill) => ({
    name: skill.name,
    group: skill.group,
    needles: [skill.name, ...(skill.aliases ?? [])],
  }))
}

export default SKILL_VOCABULARY
