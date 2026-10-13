import { useState } from 'react'
import { BarChart3, Building2, Briefcase, Download, RotateCcw, Users } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import Button from '@/components/common/Button'
import Card, { CardBody, CardHeader } from '@/components/common/Card'
import DataTable from '@/components/common/DataTable'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import StatCard from '@/components/common/StatCard'
import { LineTrend, HorizontalBars, BarSeries, DonutChart } from '@/components/charts/Charts'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import * as adminService from '@/services/adminService'
import { formatNumber, formatDate } from '@/utils/format'

/**
 * Platform reports (PRD section 21).
 *
 * The mock has no server to stream a file from, so "download" serialises the
 * report the page is already showing to CSV in the browser. Swapping in a real
 * `/admin/reports/export` endpoint later only changes this one handler.
 */
export default function AdminReports() {
  const toast = useToast()
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const { data, error, loading, refetch } = useFetch(() => adminService.getReports(), [])

  const totals = data?.totals ?? {}
  const charts = data?.charts ?? {}
  const split = data?.applicationStatusSplit ?? []

  async function resetData() {
    setResetting(true)
    try {
      await adminService.resetMockData()
      toast.success('Demo data restored to its seeded state.')
      refetch()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setResetting(false)
    }
  }

  function downloadCsv() {
    const header = ['Metric', 'Value']
    const rows = Object.entries(totals).map(([key, value]) => [humanise(key), value])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    // Blob + object URL avoids adding a CSV dependency for one export.
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `jobkhoj-report-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded.')
  }

  const statusRows = split.map((row) => ({
    id: row.status,
    status: row.status,
    applications: formatNumber(row.value),
    share: `${row.percent}%`,
  }))

  const columns = [
    { key: 'status', header: 'Application status' },
    { key: 'applications', header: 'Applications', align: 'right' },
    { key: 'share', header: 'Share', align: 'right' },
  ]

  if (error) {
    return (
      <Card>
        <div className="py-14 text-center">
          <p className="text-sm text-danger-700">{error.message}</p>
          <Button variant="secondary" className="mt-4" onClick={refetch}>
            Try again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle={
          data?.generatedAt
            ? `Generated ${formatDate(data.generatedAt)}`
            : 'Platform-wide metrics across every role.'
        }
        actions={
          <>
            <Button variant="outline" loading={resetting} onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset demo data
            </Button>
            <Button variant="primary" onClick={downloadCsv}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={formatNumber(totals.users ?? 0)} icon={Users} tone="brand" loading={loading} />
        <StatCard
          label="Companies"
          value={formatNumber(totals.companies ?? 0)}
          icon={Building2}
          tone="info"
          loading={loading}
          hint={`${formatNumber(totals.verifiedCompanies ?? 0)} verified`}
        />
        <StatCard
          label="Jobs"
          value={formatNumber(totals.jobs ?? 0)}
          icon={Briefcase}
          tone="success"
          loading={loading}
          hint={`${formatNumber(totals.activeJobs ?? 0)} active`}
        />
        <StatCard
          label="Applications"
          value={formatNumber(totals.applications ?? 0)}
          icon={BarChart3}
          tone="warning"
          loading={loading}
        />
      </div>

      <Card padded={false}>
        <CardHeader
          title="Registration growth"
          subtitle="New job seekers and recruiters per month."
        />
        <CardBody>
          <LineTrend
            data={charts.newUsersPerMonth ?? []}
            dataKey="month"
            series={[
              { key: 'seekers', label: 'Job seekers', color: '#4f46e5' },
              { key: 'recruiters', label: 'Recruiters', color: '#0891b2' },
            ]}
          />
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Hiring outcomes" subtitle="Hires against rejections each month." />
          <CardBody>
            <LineTrend
              data={charts.hiringTrends ?? []}
              dataKey="month"
              series={[
                { key: 'hired', label: 'Hired', color: '#059669' },
                { key: 'rejected', label: 'Rejected', color: '#dc2626' },
              ]}
            />
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardHeader title="Applications by work mode" subtitle="How candidates prefer to work." />
          <CardBody>
            <HorizontalBars
              data={(charts.applicationsByWorkMode ?? []).map((row) => ({
                label: row.mode,
                value: row.value,
              }))}
              dataKey="label"
              valueKey="value"
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Application outcomes" subtitle="Share of applications by status." />
          <CardBody>
            <DonutChart
              data={split
                .filter((row) => row.value > 0)
                .map((row) => ({ label: row.status, value: row.value }))}
              centerValue={formatNumber(totals.applications ?? 0)}
              centerLabel="applications"
            />
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardHeader title="Most demanded skills" subtitle="Across every published job." />
          <CardBody>
            <BarSeries
              data={(charts.topSkills ?? []).map((row) => ({
                label: row.skill,
                value: row.count,
              }))}
              dataKey="label"
              valueKey="value"
            />
          </CardBody>
        </Card>
      </div>

      <Card padded={false}>
        <CardHeader
          title="Outcome breakdown"
          subtitle="Applications grouped by the status the candidate reached."
        />
        <DataTable
          columns={columns}
          rows={statusRows}
          loading={loading}
          emptyTitle="No applications recorded"
        />
      </Card>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetData}
        title="Reset all demo data?"
        message="Every change made in this session — blocked users, moderated jobs, verified companies, new applications — is discarded and the seeded dataset is restored."
        confirmLabel="Reset data"
      />
    </div>
  )
}

/** Turns a camelCase metric key into a readable CSV label. */
function humanise(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
}