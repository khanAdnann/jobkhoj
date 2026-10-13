import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * Guards against status/stage strings drifting away from utils/constants.js.
 *
 * The constants are title-cased ('Verified') while the mock layer kept writing
 * the uppercase forms ('VERIFIED'). Nothing crashed: verification badges
 * rendered untoned and every status filter matched nothing, because the query
 * compared against a value no row actually had.
 *
 * Two tiers, because "this string is a status" and "this string is a label" are
 * different things and a rule that conflates them gets switched off:
 *
 *  1. UPPERCASE forms are banned everywhere. They are never display text in
 *     this codebase, so every occurrence is a data value.
 *  2. Title-cased forms are banned only where a value is stored or compared —
 *     comparison operands, call arguments, and assignments to status-ish fields.
 *     That leaves `label: 'Pending'`, `aria-label="Verified"`, table headers and
 *     tone maps alone, which is where these strings legitimately belong.
 *
 * utils/constants.js is exempt: it is where the values are defined.
 */
const STAGE_KEYS = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'HIRED',
  'REJECTED',
]

const STATUS_VALUES = [
  // APPLICATION_STATUS
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Hired',
  'Rejected',
  // JOB_STATUS
  'Draft',
  'Pending Approval',
  'Active',
  'Closed',
  'Expired',
  // COMPANY_STATUS
  'Pending',
  'Verified',
  'Suspended',
  // USER_STATUS
  'Blocked',
]

/** Object keys whose literal value is a stored status, not a label. */
const STATUS_KEYS = [
  'status',
  'stage',
  'verification',
  'userStatus',
  'jobStatus',
  'companyStatus',
  'applicationStatus',
  'reviewStatus',
  'hiringStatus',
]

const MESSAGE = (value) =>
  `Use the constant from utils/constants.js instead of "${value}" — the literal form silently breaks status filters and badge tones.`

const upperCaseValues = [
  ...STAGE_KEYS,
  'VERIFIED',
  'SUSPENDED',
  'BLOCKED',
  'PENDING',
  'ACTIVE',
  'DRAFT',
  'CLOSED',
  'EXPIRED',
]

const upperCaseStageKeys = upperCaseValues.map((value) => ({
  selector: `Literal[value=${JSON.stringify(value)}]`,
  message: MESSAGE(value),
}))

const statusValues = STATUS_VALUES.flatMap((value) => {
  const literal = `Literal[value=${JSON.stringify(value)}]`
  const comparisons = [
    `BinaryExpression[left.value=${JSON.stringify(value)}]`,
    `BinaryExpression[right.value=${JSON.stringify(value)}]`,
  ]
  const argumentsIn = [0, 1, 2, 3, 4].map(
    (i) => `CallExpression[arguments.${i}.value=${JSON.stringify(value)}]`,
  )
  const assignments = [
    ...STATUS_KEYS.map((key) => `Property[key.name=${JSON.stringify(key)}] > ${literal}`),
    ...STATUS_KEYS.map((key) => `VariableDeclarator[id.name=${JSON.stringify(key)}] > ${literal}`),
  ]
  return [...comparisons, ...argumentsIn, ...assignments].map((selector) => ({
    selector,
    message: MESSAGE(value),
  }))
})

export default [
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Teaches core no-unused-vars that a variable used only inside JSX is
      // still a real usage — without this every JSX component reads as unused.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.js'],
    ignores: ['src/utils/constants.js'],
    rules: { 'no-restricted-syntax': ['error', ...upperCaseStageKeys, ...statusValues] },
  },
  {
    // Node-side tooling (build scripts, smoke tests) — not browser code.
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]