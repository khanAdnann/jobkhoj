import { COMPANY_STATUS } from '@/utils/constants'

/**
 * Company seed data.
 * Plain data only — dates are hydrated to ISO strings by ./index.js so the
 * "posted 3 days ago" style values stay fresh on every fresh seed.
 *
 * `verification` uses COMPANY_STATUS rather than bare strings: the admin
 * verification queue filters on it, and COMPANY_STATUS_TONE keys off it, so a
 * hand-written 'VERIFIED' would render untoned and be unfilterable.
 */
export const companies = [
  {
    id: 'cmp-tcs',
    name: 'Tata Consultancy Services',
    slug: 'tata-consultancy-services',
    industry: 'Information Technology & Services',
    website: 'https://www.tcs.com',
    location: 'Mumbai, Maharashtra',
    size: '5000+ employees',
    founded: 1968,
    about:
      'Tata Consultancy Services is a global leader in information technology services and consulting, delivering digital transformation solutions to enterprises across 50+ countries.',
    benefits: [
      'Health insurance covering self, spouse and children',
      'Flexible hybrid work model',
      'Annual performance bonus',
      'Employee stock purchase plan',
      'Learning and certification reimbursement',
      'On-site childcare support',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/tata-consultancy-services' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-infosys',
    name: 'Infosys',
    slug: 'infosys',
    industry: 'Information Technology & Services',
    website: 'https://www.infosys.com',
    location: 'Bengaluru, Karnataka',
    size: '5000+ employees',
    founded: 1981,
    about:
      'Infosys is a global technology leader delivering next-generation digital solutions across industries, with deep expertise in cloud, AI and engineering excellence.',
    benefits: [
      'Comprehensive health and life insurance',
      'Provident fund and gratuity',
      'Work-from-home flexibility',
      'Tuition assistance for higher studies',
      'In-house wellness centres',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/infosys' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-accenture',
    name: 'Accenture',
    slug: 'accenture',
    industry: 'Information Technology & Services',
    website: 'https://www.accenture.com',
    location: 'Mumbai, Maharashtra',
    size: '5000+ employees',
    founded: 1989,
    about:
      'Accenture is a leading professional services company specialising in digital, cloud, security and consulting services for the world’s largest organisations.',
    benefits: [
      'Group health and accident insurance',
      'Generous paid leave policy',
      'Employee assistance programme',
      'Global mobility opportunities',
      'Corporate wellness and fitness',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/accenture' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-wipro',
    name: 'Wipro',
    slug: 'wipro',
    industry: 'Information Technology & Services',
    website: 'https://www.wipro.com',
    location: 'Bengaluru, Karnataka',
    size: '5000+ employees',
    founded: 1945,
    about:
      'Wipro is a global technology and consulting company recognised for its focus on sustainable IT, AI and industry-specific digital solutions.',
    benefits: [
      'Medical insurance for family',
      'Flexible work arrangements',
      'Paid sick leave and sabbatical options',
      'Learning and development budget',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/wipro' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-hcltech',
    name: 'HCLTech',
    slug: 'hcltech',
    industry: 'Information Technology & Services',
    website: 'https://www.hcltech.com',
    location: 'Noida, Uttar Pradesh',
    size: '5000+ employees',
    founded: 1976,
    about:
      'HCLTech is a global technology leader with strong capabilities across engineering, cloud, data and workplace technologies.',
    benefits: [
      'Health cover extended to parents',
      'Hybrid and remote friendly roles',
      'Quarterly incentive plan',
      'Certification support',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/hcl-technologies' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-techmahindra',
    name: 'Tech Mahindra',
    slug: 'tech-mahindra',
    industry: 'Telecommunications & IT',
    website: 'https://www.techmahindra.com',
    location: 'Pune, Maharashtra',
    size: '5000+ employees',
    founded: 1986,
    about:
      'Tech Mahindra is a leading provider of digital transformation services and solutions, focused on the communications industry and emerging technologies.',
    benefits: [
      'Health insurance with dependants',
      'Flexible work hours',
      'Performance-linked pay',
      'Internal mobility across business units',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/tech-mahindra' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-cognizant',
    name: 'Cognizant',
    slug: 'cognizant',
    industry: 'Information Technology & Services',
    website: 'https://www.cognizant.com',
    location: 'Chennai, Tamil Nadu',
    size: '5000+ employees',
    founded: 1994,
    about:
      'Cognizant is a leading technology services provider building intelligent digital solutions for healthcare, finance and manufacturing clients.',
    benefits: [
      'Comprehensive medical insurance',
      'Cognizant Academy learning programmes',
      'Work-life balance initiatives',
      'Volunteering and CSR programmes',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/cognizant' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-capgemini',
    name: 'Capgemini',
    slug: 'capgemini',
    industry: 'Information Technology & Services',
    website: 'https://www.capgemini.com',
    location: 'Mumbai, Maharashtra',
    size: '5000+ employees',
    founded: 1967,
    about:
      'Capgemini is a global business and technology transformation partner, blending consulting, industry and technology to create relevant solutions.',
    benefits: [
      'Group medical insurance',
      'Flexible work policy',
      'Learning credits',
      'Employee stock plan options',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/capgemini' },
    verification: COMPANY_STATUS.VERIFIED,
  },
  {
    id: 'cmp-persistent',
    name: 'Persistent Systems',
    slug: 'persistent-systems',
    industry: 'Information Technology & Services',
    website: 'https://www.persistent.com',
    location: 'Pune, Maharashtra',
    size: '1001-5000 employees',
    founded: 1990,
    about:
      'Persistent Systems is a global software product engineering partner specialising in cloud, data platforms and modern application development.',
    benefits: [
      'Health insurance for self and family',
      'Flexible and remote-first options',
      'Employee stock ownership plan',
      'Continuous learning culture',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/persistent-systems' },
    verification: COMPANY_STATUS.PENDING,
  },
  {
    id: 'cmp-ltimindtree',
    name: 'LTIMindtree',
    slug: 'ltimindtree',
    industry: 'Information Technology & Services',
    website: 'https://www.ltimindtree.com',
    location: 'Mumbai, Maharashtra',
    size: '5000+ employees',
    founded: 1999,
    about:
      'LTIMindtree is a global technology services company combining next-generation technologies with deep domain expertise across industries.',
    benefits: [
      'Comprehensive health insurance',
      'Hybrid-first work model',
      'Employee stock purchase plan',
      'Mentorship and career development',
    ],
    social: { linkedin: 'https://www.linkedin.com/company/ltimindtree' },
    verification: COMPANY_STATUS.PENDING,
  },
]

export default companies
