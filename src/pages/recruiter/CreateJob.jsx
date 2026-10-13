import JobForm from './JobForm'

/** Thin route wrappers — the shared form lives in JobForm.jsx. */
export default function CreateJob() {
  return <JobForm mode="create" />
}