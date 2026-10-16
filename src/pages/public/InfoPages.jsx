import { Link } from 'react-router-dom'
import { ArrowRight, Mail } from 'lucide-react'
import { CONTACT_EMAIL } from '@/utils/constants'
import { PATHS } from '@/routes/paths'
import PageMetadata from '@/components/seo/PageMetadata'

const PAGE_META = {
  about: {
    title: 'About JobKhoj',
    description: 'Learn about JobKhoj and the tools it provides for exploring job opportunities.',
    intro: 'Helping people discover career opportunities',
  },
  contact: {
    title: 'Contact JobKhoj',
    description: 'Contact JobKhoj about website issues, accounts, job listings, privacy, or feedback.',
    intro: "We're here to help",
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how JobKhoj handles account, profile, resume, application, and browser data.',
    intro: 'How information is handled on JobKhoj',
  },
  terms: {
    title: 'Terms of Service',
    description: 'Read the terms for using JobKhoj job discovery and career tools.',
    intro: 'Terms for using JobKhoj',
  },
  help: {
    title: 'JobKhoj Help Center',
    description: 'Answers to common questions about job search, accounts, applications, and recruiter tools.',
    intro: 'Find answers to common questions',
  },
}

function PageShell({ page, children }) {
  const { title, description, intro } = PAGE_META[page]

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageMetadata title={`${title} | JobKhoj`} description={description} />
      <header className="border-b border-ink-200 pb-8">
        <p className="text-sm font-semibold text-brand-700">JobKhoj</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">{intro}</p>
      </header>
      <div className="space-y-8 py-8 text-sm leading-7 text-ink-600 sm:text-base">
        {children}
      </div>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold leading-snug text-ink-900">{title}</h2>
      {children}
    </section>
  )
}

function InternalLink({ to, children }) {
  return (
    <Link to={to} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800">
      {children}
    </Link>
  )
}

function ContactEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="inline-flex items-center gap-2 font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {CONTACT_EMAIL}
    </a>
  )
}

function AboutPage() {
  return (
    <>
      <Section title="What JobKhoj is">
        <p>
          JobKhoj is a job-discovery and career-support application. It brings job search,
          candidate tools, and recruiter workflows together so people can explore opportunities
          and keep parts of their search organized.
        </p>
      </Section>
      <Section title="Our mission">
        <p>
          Our aim is to make exploring career opportunities and managing a job search easier.
          JobKhoj provides tools to help candidates prepare and keep track of their activity;
          employers remain responsible for their own listings and hiring decisions.
        </p>
      </Section>
      <Section title="What JobKhoj offers">
        <ul className="list-disc space-y-2 pl-6 marker:text-brand-600">
          <li>Job search with filters and company information.</li>
          <li>Candidate accounts, saved jobs, and application tracking.</li>
          <li>Recruiter accounts, job listing management, and applicant workflows.</li>
          <li>Career tools including resume building and analysis, interview preparation, and document utilities.</li>
        </ul>
      </Section>
      <Section title="Who can use JobKhoj?">
        <p>
          The platform is intended for people at different career stages, including new
          graduates, experienced professionals, and career changers. Recruiters and employers
          can use the recruiter features to manage company information and job listings.
        </p>
      </Section>
      <Section title="Our approach">
        <p>
          JobKhoj aims to make listing information useful and understandable. Listing details
          may be supplied by employers or shown as sample data in demo mode; availability and
          employer claims should be verified directly before taking action.
        </p>
      </Section>
      <Section title="Important disclaimer">
        <p>
          JobKhoj does not guarantee employment, an interview, a salary outcome, or selection by
          an employer. Employers control their recruitment processes and decisions. Be cautious
          of requests for money or sensitive information, and independently verify any
          opportunity that concerns you.
        </p>
      </Section>
      <section className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="text-lg font-semibold text-ink-900">Questions for our team?</h2>
        <p className="mt-1 text-sm text-ink-600">
          Get in touch through the <InternalLink to={PATHS.contact}>Contact page</InternalLink>.
        </p>
      </section>
    </>
  )
}

function ContactPage() {
  return (
    <>
      <Section title="Contact introduction">
        <p>
          Contact JobKhoj about website issues, account access, concerns about a job listing,
          recruiter questions, privacy requests, or general feedback.
        </p>
      </Section>
      <Section title="Email">
        <p>
          Email is the contact method currently published by JobKhoj. Selecting the address
          opens your device's email application; you will need to send the message there.
        </p>
        <ContactEmail />
      </Section>
      <Section title="Before you write">
        <p>
          Please do not include passwords, payment details, identity documents, or other
          sensitive information in an email. For a job listing concern, include the listing
          link and a brief description of the issue where possible.
        </p>
        <p>We do not promise a specific response time.</p>
      </Section>
    </>
  )
}

function PrivacyPage() {
  return (
    <>
      <p className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
        This notice describes the application implementation inspected in the project source.
        The live Vercel environment and any production backend configuration were not available
        for verification; the site owner should confirm those settings before publishing this policy.
      </p>
      <Section title="1. Introduction">
        <p>
          This page explains the information that JobKhoj features may process. Actual handling
          depends on whether the application is running in mock mode or connected to a live
          backend, and on the backend operator's configuration.
        </p>
      </Section>
      <Section title="2. Information the application may process">
        <p>
          Registration forms request a name, email address, phone number, password, and account
          type; recruiter registration also asks for company details. Profile fields include
          location, headline, bio, skills, experience, and education. Job applications, saved
          jobs, job alerts, and resume-related features can process information that users
          choose to provide.
        </p>
      </Section>
      <Section title="3. How information is used">
        <p>
          The application uses submitted information to provide account access, profiles,
          recruiter workflows, job search, saved jobs, applications, and career tools. This
          describes product functionality, not a claim about processing by an unverified
          production backend.
        </p>
      </Section>
      <Section title="4. Account registration and authentication">
        <p>
          The source includes login, registration, password-reset, and profile flows. The
          project's local environment is configured for mock mode: authentication is simulated,
          mock login does not check the password, and the mock registration handler does not
          store the submitted password. In live mode, credentials are sent to the configured
          API; its security and retention practices must be confirmed with that backend operator.
          Do not reuse a real password in a demo environment.
        </p>
      </Section>
      <Section title="5. Job search and applications">
        <p>
          Search filters are represented in the page URL. The application supports saved jobs,
          job alerts, and submitting and tracking applications. In mock mode, associated records
          are held in the browser's local storage; live-mode handling depends on the configured
          API and its backend.
        </p>
      </Section>
      <Section title="6. Resumes and uploaded documents">
        <p>
          The resume manager sends a selected file as multipart data to the configured API in
          live mode. In mock mode, the resume handler stores file metadata only; the selected
          resume file itself is not persisted by that mock handler. Document tools process files
          locally in mock mode, while live-mode endpoints may receive the file. Avoid uploading
          sensitive documents unless you have verified the environment and its data handling.
        </p>
      </Section>
      <Section title="7. Cookies and local storage">
        <p>
          The application source uses namespaced browser local storage for session information,
          mock records, theme preference, resume-builder state, and tool history or usage data.
          The inspected application code does not itself read or write browser cookies. Third-party
          scripts, hosting, or browser services may behave differently; users can manage local
          storage through their browser settings.
        </p>
      </Section>
      <Section title="8. Third-party services">
        <p>
          The application loads Google Fonts, includes Google's AdSense loader, and displays a
          third-party sidebar ad unit and social bar on public pages, and a banner ad on the job
          listing page. The project includes the Vercel Analytics React component to measure site
          usage. These providers may process technical or usage information under their own terms
          and privacy policies. The hosting provider may separately process technical data.
          Review the relevant providers' privacy information.
        </p>
        <ul className="list-disc space-y-2 pl-6 marker:text-brand-600">
          <li>
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
            >
              Vercel Privacy Policy
            </a>
          </li>
        </ul>
      </Section>
      <Section title="9. Advertising">
        <p>
          Public pages include third-party sidebar and social bar advertising placements, and the
          job listing page includes a banner placement. The ad providers may use cookies or
          similar technologies and process technical information under their respective policies.
          Google's AdSense loader is also included, but this does not establish that the site has
          been approved for AdSense or that AdSense ads are currently being served.
          See{' '}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
          >
            Google's advertising technology information
          </a>
          . The site owner should update this section when the live advertising configuration
          changes and provide any legally required consent controls.
        </p>
      </Section>
      <Section title="10. Data retention">
        <p>
          Mock records can remain in local storage until cleared by the user or browser. The
          source does not establish the retention periods of a live backend, hosting logs, or
          third-party services; those must be confirmed by the site operator.
        </p>
      </Section>
      <Section title="11. Data security">
        <p>
          The source code alone cannot establish the security of a deployed environment or
          backend. Do not send passwords, payment details, or other sensitive information in
          support email. Use a unique password if creating an account on a verified live service.
        </p>
      </Section>
      <Section title="12. User choices and requests">
        <p>
          Users can edit information through available account settings, remove some stored
          mock data through the app, or clear JobKhoj local storage in their browser. Contact us
          to ask about an access, correction, or deletion request; handling depends on which
          environment and data store was used.
        </p>
      </Section>
      <Section title="13. Children's privacy">
        <p>
          JobKhoj is designed as a job-search service, not as a service for children. The
          inspected application does not include a separate age-verification flow.
        </p>
      </Section>
      <Section title="14. Changes to this policy">
        <p>
          This page should be updated when application features, backend configuration,
          analytics, or advertising practices change. Users should review it periodically.
        </p>
      </Section>
      <Section title="15. Contact information">
        <p>For privacy questions or requests, contact JobKhoj at <ContactEmail />.</p>
      </Section>
    </>
  )
}

const TERMS = [
  ['1. Acceptance of terms', 'By using JobKhoj, you agree to use the service responsibly and follow these terms. If you do not agree, do not use the service.'],
  ['2. Description of the service', 'JobKhoj provides job discovery, candidate and recruiter account workflows, and career tools. Some information may be sample data when the app is running in demo mode.'],
  ['3. Eligibility and accounts', 'Use an account that belongs to you and provide information you are permitted to share. You are responsible for protecting your sign-in details.'],
  ['4. Accurate user information', 'Keep account, profile, company, and listing information accurate and up to date. Do not impersonate another person or organization.'],
  ['5. Job listings and employment information', 'Listings may be incomplete, change, expire, or be unavailable. Verify the role, employer, location, compensation, and application process directly with the employer before relying on a listing.'],
  ['6. Employer and recruiter responsibilities', 'Recruiters must be authorized to represent their organization, provide truthful listings, and handle candidate information responsibly. Fraudulent, discriminatory, or misleading listings are prohibited.'],
  ['7. Candidate responsibilities', 'Candidates should provide truthful application information, protect their account, and independently assess opportunities. Never pay money or disclose sensitive information in response to suspicious requests.'],
  ['8. Prohibited activities', 'Do not post fraudulent listings, misrepresent identities or qualifications, harass others, scrape or disrupt the service, bypass access controls, or use the service unlawfully.'],
  ['9. Intellectual property', 'The JobKhoj interface and branding are presented for use with the service. Users retain responsibility for content they submit and must have the rights needed to submit it.'],
  ['10. Third-party websites and links', 'Listings and links may direct you to third-party services. Those services have their own terms and privacy policies; JobKhoj does not control them.'],
  ['11. No employment guarantee', 'JobKhoj does not guarantee a job, interview, particular salary, listing accuracy, or employer selection. Employers control their recruitment processes and decisions.'],
  ['12. Availability and limitations', 'The service and its tools are provided as available and may be changed, interrupted, or contain errors. Verify important information independently.'],
  ['13. Account suspension or termination', 'Access may be limited or removed when necessary to address misuse, security concerns, or violations of these terms.'],
  ['14. Changes to the service and terms', 'Features and these terms may change. The published page should be reviewed after updates; continued use after an update indicates acceptance of the revised terms.'],
]

function TermsPage() {
  return (
    <>
      {TERMS.map(([title, text]) => (
        <Section key={title} title={title}>
          <p>{text}</p>
        </Section>
      ))}
      <Section title="15. Contact information">
        <p>Questions about these terms can be sent to <ContactEmail />.</p>
      </Section>
    </>
  )
}

const FAQS = [
  {
    question: 'How do I search for jobs?',
    answer: <>Open <InternalLink to={PATHS.jobs}>Find Jobs</InternalLink> to search and use the available filters. Confirm listing details with the employer, especially when demo mode is active.</>,
  },
  {
    question: 'How do I create an account?',
    answer: <>Choose <InternalLink to={PATHS.register}>Create an account</InternalLink> and select the candidate or recruiter account type. The local project configuration uses mock authentication; use a live service only after confirming the deployed backend setup.</>,
  },
  {
    question: 'How do I save a job?',
    answer: 'Use the save control on a job listing. Saving jobs is part of the candidate account workflow and may require signing in.',
  },
  {
    question: 'How can I apply for a job?',
    answer: 'Open the job details and use its application action. You may be asked to sign in and provide the requested application information. Follow the employer’s instructions and verify the listing is current.',
  },
  {
    question: 'How can I update my profile?',
    answer: <>Sign in and open your candidate dashboard profile, or the recruiter company profile for employer details. You can also review the <InternalLink to={PATHS.privacyPolicy}>Privacy Policy</InternalLink> for data-mode limitations.</>,
  },
  {
    question: 'How can I contact a recruiter?',
    answer: 'Use the application instructions provided on the job listing. JobKhoj does not promise a direct recruiter-contact option for every listing.',
  },
  {
    question: 'How do I report a suspicious job listing?',
    answer: <>The inspected app does not show an in-app report flow. Send the listing link and a short description to <ContactEmail />. Do not send passwords, payment details, or identity documents.</>,
  },
  {
    question: 'How can recruiters post jobs?',
    answer: <>Create a recruiter account from <InternalLink to={PATHS.register}>registration</InternalLink>, then use the recruiter dashboard to manage company details and job listings. Review information for accuracy before publishing.</>,
  },
  {
    question: 'What should I do if I cannot log in?',
    answer: <>Check your email and try the <InternalLink to={PATHS.forgotPassword}>password reset</InternalLink> flow if the live service supports it. Mock mode does not provide production authentication; contact support if you still need help.</>,
  },
  {
    question: 'How can I contact JobKhoj support?',
    answer: <>Email <ContactEmail />. Your email application will open, and you must send the message from there. Do not include sensitive information.</>,
  },
]

function HelpPage() {
  return (
    <>
      <Section title="Frequently asked questions">
        <div className="space-y-3">
          {FAQS.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-ink-200 bg-white p-4 shadow-card">
              <summary className="cursor-pointer list-none font-semibold text-ink-900 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
                <span className="flex items-center justify-between gap-4">
                  {question}
                  <span aria-hidden="true" className="text-xl font-normal text-brand-700 group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 pr-8 text-sm leading-6 text-ink-600">{answer}</p>
            </details>
          ))}
        </div>
      </Section>
      <section className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <h2 className="text-lg font-semibold text-ink-900">Still need help?</h2>
        <p className="mt-1 text-sm text-ink-600">
          Email <ContactEmail />. Selecting the address opens your email application; remember
          to send the message there.
        </p>
        <Link
          to={PATHS.contact}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Contact JobKhoj <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </>
  )
}

const PAGE_CONTENT = {
  about: AboutPage,
  contact: ContactPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  help: HelpPage,
}

export default function InfoPages({ page }) {
  const Content = PAGE_CONTENT[page]

  if (!Content) return null

  return (
    <PageShell page={page}>
      <Content />
    </PageShell>
  )
}
