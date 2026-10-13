import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, Plus, Search, Trash2, Pencil } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Modal from '@/components/common/Modal'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Checkbox from '@/components/common/Checkbox'
import TagInput from '@/components/common/TagInput'
import EmptyState from '@/components/common/EmptyState'
import Skeleton from '@/components/common/Skeleton'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as userService from '@/services/userService'
import { ALERT_FREQUENCIES, DEPARTMENTS, EXPERIENCE_LEVELS } from '@/utils/constants'
import { formatDate } from '@/utils/format'

const EMPTY_FORM = {
  name: '',
  keywords: [],
  location: '',
  experience: 'Any',
  department: 'Software Development',
  frequency: 'Daily',
}

/**
 * Job alerts CRUD (PRD section 11).
 *
 * Creating and editing share one modal; `editing` holds the alert being edited
 * and `form` holds the draft, so cancelling always restores a clean state.
 */
export default function JobAlerts() {
  const toast = useToast()
  const query = useFetch(() => userService.getJobAlerts(), [])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const alerts = query.data ?? []

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  function openEdit(alert) {
    setEditing(alert)
    setForm({
      name: alert.name ?? '',
      keywords: alert.keywords ?? [],
      location: alert.location ?? '',
      experience: alert.experience ?? 'Any',
      department: alert.department ?? 'Software Development',
      frequency: alert.frequency ?? 'Daily',
    })
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Give your alert a name.')
      return
    }

    setSaving(true)

    try {
      if (editing) {
        await userService.updateJobAlert(editing.id, form)
        query.setData(
          alerts.map((alert) => (alert.id === editing.id ? { ...alert, ...form } : alert)),
        )
        toast.success('Alert updated.')
      } else {
        const created = await userService.createJobAlert(form)
        query.setData([created, ...alerts])
        toast.success('Job alert created.')
      }

      close()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(alert) {
    const next = { active: !alert.active }
    try {
      await userService.updateJobAlert(alert.id, next)
      query.setData(alerts.map((row) => (row.id === alert.id ? { ...row, ...next } : row)))
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDelete(alert) {
    setDeletingId(alert.id)
    try {
      await userService.deleteJobAlert(alert.id)
      query.setData(alerts.filter((row) => row.id !== alert.id))
      toast.success(`Deleted "${alert.name}".`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Job alerts"
        subtitle="Get notified when new jobs match the roles you care about."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New alert
          </Button>
        }
      />

      {query.error ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="Could not load your alerts"
            description={query.error.message}
            action={
              <Button variant="secondary" onClick={query.refetch}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-500">
            {query.loading
              ? 'Loading alerts…'
              : `${alerts.filter((a) => a.active).length} active of ${alerts.length}`}
          </p>

          <div className="space-y-3">
            {query.loading &&
              [1, 2].map((key) => (
                <Skeleton key={key} className="h-32 w-full rounded-xl" />
              ))}

            {!query.loading && alerts.length === 0 && (
              <Card>
                <EmptyState
                  icon="inbox"
                  title="No job alerts yet"
                  description="Create an alert with keywords like React or Bangalore and we will email you when matching jobs are posted."
                  action={
                    <Button variant="primary" onClick={openCreate}>
                      Create your first alert
                    </Button>
                  }
                />
              </Card>
            )}

            {alerts.map((alert) => (
              <Card key={alert.id} padded={false} className="overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      alert.active
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {alert.active ? (
                      <Bell className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <BellOff className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{alert.name}</h3>
                      <Badge tone={alert.active ? 'success' : 'neutral'}>
                        {alert.active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge tone="outline">{alert.frequency}</Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(alert.keywords ?? []).map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-ink-500">
                      {alert.location || 'Any location'} · {alert.experience} ·{' '}
                      {alert.department} · Created {formatDate(alert.createdAt)}
                    </p>

                    <Link
                      to={`/jobs?query=${encodeURIComponent((alert.keywords ?? []).join(' '))}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      <Search className="h-3.5 w-3.5" aria-hidden="true" />
                      View matching jobs
                    </Link>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(alert)}
                    >
                      {alert.active ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${alert.name}`}
                      onClick={() => openEdit(alert)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${alert.name}`}
                      loading={deletingId === alert.id}
                      onClick={() => handleDelete(alert)}
                      className="text-ink-500 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ---------------------------- create / edit --------------------------- */}
      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Edit job alert' : 'New job alert'}
        description="We will notify you when a new job matches these filters."
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Create alert'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Alert name" htmlFor="alert-name" required>
            <Input
              id="alert-name"
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder="e.g. Frontend roles in Bengaluru"
              maxLength={60}
            />
          </Field>

          <Field
            label="Keywords"
            htmlFor="alert-keywords"
            hint="Press Enter after each keyword. Leave empty to match every job."
          >
            <TagInput
              id="alert-keywords"
              value={form.keywords}
              onChange={(keywords) => set('keywords', keywords)}
              placeholder="React, TypeScript…"
              max={10}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" htmlFor="alert-location">
              <Input
                id="alert-location"
                value={form.location}
                onChange={(event) => set('location', event.target.value)}
                placeholder="Bengaluru"
              />
            </Field>

            <Field label="Experience" htmlFor="alert-experience">
              <Select
                id="alert-experience"
                value={form.experience}
                onChange={(event) => set('experience', event.target.value)}
                options={[
                  { value: 'Any', label: 'Any experience' },
                  ...EXPERIENCE_LEVELS.map((level) => ({ value: level, label: level })),
                ]}
              />
            </Field>

            <Field label="Department" htmlFor="alert-department">
              <Select
                id="alert-department"
                value={form.department}
                onChange={(event) => set('department', event.target.value)}
                options={DEPARTMENTS.map((value) => ({ value, label: value }))}
              />
            </Field>

            <Field label="Frequency" htmlFor="alert-frequency">
              <Select
                id="alert-frequency"
                value={form.frequency}
                onChange={(event) => set('frequency', event.target.value)}
                options={ALERT_FREQUENCIES.map((value) => ({ value, label: value }))}
              />
            </Field>
          </div>

          <div className="rounded-lg bg-ink-50 p-3">
            <Checkbox
              id="alert-email"
              checked
              disabled
              label="Send matches to my email"
              description="Demo build — email delivery is disabled."
            />
          </div>

          {/* Enter submits the form from any field. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            Save
          </button>
        </form>
      </Modal>
    </div>
  )
}