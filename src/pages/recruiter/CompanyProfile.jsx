import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Building2,
  Globe,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Save,
  Users,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Card, { CardHeader } from '@/components/common/Card'
import Button from '@/components/common/Button'
import Field from '@/components/common/Field'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Select from '@/components/common/Select'
import Badge from '@/components/common/Badge'
import TagInput from '@/components/common/TagInput'
import Skeleton from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as recruiterService from '@/services/recruiterService'
import * as companyService from '@/services/companyService'
import { COMPANY_SIZE, COMPANY_STATUS, COMPANY_STATUS_TONE } from '@/utils/constants'

/**
 * Company profile editor (PRD section 16).
 *
 * The company record is fetched through the recruiter profile endpoint, which
 * already nests `company`, then saved back with `updateMyCompany`.
 */
export default function CompanyProfile() {
  const toast = useToast()

  const query = useFetch(() => recruiterService.getRecruiterProfile(), [])
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      about: '',
      website: '',
      industry: '',
      size: '201-500',
      location: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      perks: [],
    },
  })

  // Populate once the company arrives.
  useEffect(() => {
    const company = query.data?.company
    if (!company) return

    reset({
      name: company.name ?? '',
      about: company.about ?? '',
      website: company.website ?? '',
      industry: company.industry ?? '',
      size: company.size ?? '201-500',
      location: company.location ?? '',
      address: company.address ?? '',
      contactEmail: company.contactEmail ?? '',
      contactPhone: company.contactPhone ?? '',
      perks: company.perks ?? [],
    })
  }, [query.data, reset])

  async function onSubmit(values) {
    setSaving(true)
    try {
      const updated = await companyService.updateMyCompany(values)
      query.setData({ ...query.data, company: { ...query.data.company, ...updated } })
      toast.success('Company profile updated.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (query.loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (query.error || !query.data) {
    return (
      <Card>
        <EmptyState
          icon="file"
          title="Could not load your company"
          description={query.error?.message ?? 'No company is linked to your account yet.'}
          action={
            <Button variant="secondary" onClick={query.refetch}>
              Try again
            </Button>
          }
        />
      </Card>
    )
  }

  const company = query.data.company

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company profile"
        subtitle="This page is public — candidates see it before applying."
        actions={
          company?.slug && (
            <Button as="a" href={`/companies/${company.slug}`} variant="outline">
              <Globe className="mr-1.5 h-4 w-4" aria-hidden="true" />
              View public page
            </Button>
          )
        }
      />

      {/* ------------------------- verification banner ------------------- */}
      {company?.verification && (
        <div
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            company.verification === COMPANY_STATUS.VERIFIED
              ? 'border-success-500/30 bg-success-50'
              : 'border-warning-500/30 bg-warning-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <Building2
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                company.verification === COMPANY_STATUS.VERIFIED ? 'text-success-600' : 'text-warning-600'
              }`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-ink-900">
                {company.verification === COMPANY_STATUS.VERIFIED
                  ? 'Your company is verified'
                  : 'Verification pending'}
              </p>
              <p className="mt-0.5 text-sm text-ink-600">
                {company.verification === COMPANY_STATUS.VERIFIED
                  ? 'A verified badge appears on all your job postings, which increases applicant trust.'
                  : 'An admin is reviewing your company. Verified companies receive 2x more applicants.'}
              </p>
            </div>
          </div>
          <Badge tone={COMPANY_STATUS_TONE[company.verification] ?? 'neutral'}>
            {company.verification}
          </Badge>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* -------------------------- basics -------------------------- */}
            <Card padded={false}>
              <CardHeader title="Company details" />
              <div className="space-y-4 p-5">
                <Field label="Company name" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    {...register('name', { required: 'Company name is required' })}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Industry" htmlFor="industry">
                    <Input
                      id="industry"
                      placeholder="Information Technology"
                      {...register('industry')}
                    />
                  </Field>

                  <Field label="Company size" htmlFor="size">
                    <Select
                      id="size"
                      options={COMPANY_SIZE.map((value) => ({ value, label: value }))}
                      {...register('size')}
                    />
                  </Field>

                  <Field label="City" htmlFor="location">
                    <Input id="location" placeholder="Bengaluru" {...register('location')} />
                  </Field>

                  <Field label="Website" htmlFor="website">
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      {...register('website', {
                        pattern: {
                          value: /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i,
                          message: 'Enter a valid URL',
                        },
                      })}
                    />
                  </Field>
                </div>

                <Field
                  label="About the company"
                  htmlFor="about"
                  hint="Up to 1,500 characters — this is the company blurb on the public page."
                  error={errors.about?.message}
                >
                  <Textarea
                    id="about"
                    rows={6}
                    maxLength={1500}
                    {...register('about', {
                      maxLength: { value: 1500, message: 'Keep it under 1,500 characters' },
                    })}
                  />
                </Field>
              </div>
            </Card>

            {/* ------------------------- contact --------------------------- */}
            <Card padded={false}>
              <CardHeader title="Contact & address" />
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="careers@example.com"
                      {...register('contactEmail', {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                    />
                  </Field>

                  <Field label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone?.message}>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+91 80 4000 1234"
                      {...register('contactPhone', {
                        pattern: {
                          value: /^[+\d][\d\s-]{6,}$/,
                          message: 'Enter a valid phone number',
                        },
                      })}
                    />
                  </Field>
                </div>

                <Field label="Office address" htmlFor="address">
                  <Textarea
                    id="address"
                    rows={3}
                    placeholder="Building, street, city, state, PIN"
                    {...register('address')}
                  />
                </Field>
              </div>
            </Card>
          </div>

          {/* ---------------------------- side --------------------------- */}
          <aside className="space-y-6">
            <Card padded={false}>
              <CardHeader title="Preview" />

              <div className="p-5">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Building2 className="h-7 w-7" aria-hidden="true" />
                </span>

                <h2 className="mt-3 text-base font-semibold text-ink-900">
                  {watch('name') || company?.name}
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">{watch('industry') || 'Industry'}</p>

                <div className="mt-3 space-y-1.5 text-xs text-ink-500">
                  {watch('location') && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {watch('location')}
                    </p>
                  )}
                  {watch('contactEmail') && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {watch('contactEmail')}
                    </p>
                  )}
                  {watch('contactPhone') && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {watch('contactPhone')}
                    </p>
                  )}
                  {watch('website') && (
                    <p className="flex items-center gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="truncate">{watch('website')}</span>
                    </p>
                  )}
                  {watch('size') && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {watch('size')} employees
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title="Perks & benefits" />
              <div className="p-5">
                <Field
                  label="Perks"
                  htmlFor="perks"
                  hint="Shown on your public company page."
                >
                  <TagInput
                    id="perks"
                    max={12}
                    value={watch('perks') ?? []}
                    onChange={(perks) => setValue('perks', perks)}
                    placeholder="Health insurance, Flexi hours…"
                  />
                </Field>
              </div>
            </Card>
          </aside>
        </div>

        <div className="flex justify-end rounded-xl border border-ink-200 bg-white p-4">
          <Button type="submit" variant="primary" loading={saving}>
            {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
            Save company profile
          </Button>
        </div>
      </form>
    </div>
  )
}