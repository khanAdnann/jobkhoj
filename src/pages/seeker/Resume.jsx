import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Info, Trash2, Upload } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card, { CardHeader } from '@/components/common/Card'
import FileUpload from '@/components/common/FileUpload'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Skeleton from '@/components/common/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import * as userService from '@/services/userService'
import { formatBytes, formatDate } from '@/utils/format'
import { PATHS } from '@/routes/paths'

/**
 * Resume manager (PRD section 11).
 *
 * The mock layer only stores file metadata, so the File object never leaves the
 * browser — matching what a real multipart upload would return.
 */
export default function Resume() {
  const toast = useToast()
  const { user, refresh } = useAuth()

  const fileRef = useRef(null)

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setResume(await userService.getResume())
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUpload() {
    if (!file) {
      toast.error('Choose a file first.')
      return
    }

    setUploading(true)
    try {
      await userService.uploadResume(file)
      toast.success('Resume uploaded.')
      setFile(null)
      await Promise.all([load(), refresh()])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setRemoving(true)
    try {
      await userService.deleteResume()
      toast.success('Resume removed.')
      setConfirmOpen(false)
      await Promise.all([load(), refresh()])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My resume"
        subtitle="Your resume is attached automatically when you apply to a job."
        actions={
          resume && !file ? (
            <>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Replace resume
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmOpen(true)}
                className="bg-danger-50 text-danger-700 hover:bg-danger-100"
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* --------------------------- current resume ---------------------- */}
          <Card padded={false}>
            <CardHeader
              title="Current resume"
              subtitle="The file recruiters will receive with your applications."
            />
            <div className="p-5">
              {loading ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : resume ? (
                <div className="flex items-start gap-4 rounded-lg border border-success-500/30 bg-success-50 p-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-success-600">
                    <FileText className="h-6 w-6" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{resume.name}</p>
                    <p className="mt-0.5 text-sm text-ink-600">
                      {formatBytes(resume.size)} · Uploaded {formatDate(resume.uploadedAt)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">
                      Active
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-warning-500/40 bg-warning-50 p-6 text-center">
                  <p className="text-sm font-medium text-ink-900">No resume uploaded</p>
                  <p className="mt-1 text-sm text-ink-600">
                    Upload a PDF or DOCX — it will be attached to every application you submit.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* ----------------------------- upload ----------------------------- */}
          <Card padded={false}>
            <CardHeader
              title={resume ? 'Replace resume' : 'Upload resume'}
              subtitle="PDF or DOC/DOCX up to 5 MB."
            />
            <div className="space-y-4 p-5">
              <FileUpload
                file={file}
                onChange={setFile}
                disabled={uploading}
                hint="PDF or DOC/DOCX up to 5 MB"
              />

              <div className="flex flex-wrap items-center justify-end gap-2">
                {file && (
                  <Button
                    variant="ghost"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    Clear
                  </Button>
                )}

                <Button
                  variant="primary"
                  loading={uploading}
                  disabled={!file}
                  onClick={handleUpload}
                >
                  {!uploading && <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                  {resume ? 'Replace resume' : 'Upload resume'}
                </Button>
              </div>

              {/* hidden input behind the header action */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </Card>
        </div>

        {/* ------------------------------- tips ------------------------------ */}
        <aside className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Resume tips" />
            <ul className="space-y-3 p-5 text-sm text-ink-600">
              {[
                'Keep it to 1–2 pages for most roles.',
                'Match your summary to the job description.',
                'List measurable impact, not just responsibilities.',
                'Save as PDF so formatting never shifts.',
                'Re-upload after every major role change.',
              ].map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-start gap-3 rounded-xl border border-info-500/25 bg-info-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-info-600" aria-hidden="true" />
            <p className="text-sm text-ink-600">
              This is a demo build — file contents are never uploaded or stored. Only the file
              name, size and date are kept locally.{' '}
              <Link to={PATHS.profile} className="font-semibold text-brand-600 hover:underline">
                Edit your profile
              </Link>
              .
            </p>
          </div>

          {!user?.hasResume && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-50 p-4 text-sm text-warning-800">
              Your profile is missing a resume, which lowers your chance of being shortlisted.
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={removing}
        title="Remove your resume?"
        message="You can upload a new one at any time, but applications you already submitted keep their attachments."
        confirmLabel="Remove resume"
        variant="danger"
      />
    </div>
  )
}
