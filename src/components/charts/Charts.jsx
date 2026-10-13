import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/utils/cn'

/**
 * Shared chart shells (PRD sections 18, 22).
 *
 * recharts needs a fixed height on the container to measure itself, so every
 * chart here takes a `height` rather than relying on the parent. Colours come
 * from the Tailwind palette via literal hex values, because SVG fill/stroke
 * cannot use `currentColor` reliably across both axes and series.
 */

const PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed']

const AXIS = {
  stroke: '#94a3b8',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
}

const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgb(15 23 42 / 0.12)',
    fontSize: '0.8125rem',
  },
  labelStyle: { fontWeight: 600, color: '#0f172a' },
}

function Frame({ height = 260, className, children }) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Multi-series line chart over time.
 *
 * @param {Array}  data      [{ label, ...numeric fields }]
 * @param {Array}  series    [{ key, label, color? }]
 * @param {string} dataKey   Field holding the x-axis label
 */
export function LineTrend({ data = [], series = [], dataKey = 'month', height = 260, className }) {
  if (!data.length) return <ChartEmpty height={height} />

  return (
    <Frame height={height} className={className}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={dataKey} {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8125rem' }} />}
        {series.map((item, index) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color ?? PALETTE[index % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </Frame>
  )
}

/**
 * Vertical bars for a single measure.
 *
 * @param {Array}  data       [{ label, value }]
 * @param {string} valueKey
 * @param {string} color
 */
export function BarSeries({ data = [], valueKey = 'value', dataKey = 'label', height = 260, className, color }) {
  if (!data.length) return <ChartEmpty height={height} />

  return (
    <Frame height={height} className={className}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={dataKey} {...AXIS} interval={0} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey={valueKey} name="Value" fill={color ?? PALETTE[0]} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </Frame>
  )
}

/**
 * Horizontal bars — better than vertical when the category labels are words
 * (funnel stages, work modes) rather than short ticks.
 */
export function HorizontalBars({ data = [], valueKey = 'value', dataKey = 'label', height = 260, className, color }) {
  if (!data.length) return <ChartEmpty height={height} />

  return (
    <Frame height={height} className={className}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" {...AXIS} allowDecimals={false} />
        <YAxis type="category" dataKey={dataKey} {...AXIS} width={92} />
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey={valueKey} name="Value" fill={color ?? PALETTE[1]} radius={[0, 6, 6, 0]} maxBarSize={28} />
      </BarChart>
    </Frame>
  )
}

/**
 * Donut for a small set of parts-of-a-whole.
 *
 * @param {Array} data   [{ label, value }]
 * @param {string} centerLabel / centerValue — optional headline in the hole
 */
export function DonutChart({ data = [], valueKey = 'value', dataKey = 'label', height = 260, className, centerLabel, centerValue }) {
  if (!data.length) return <ChartEmpty height={height} />

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={dataKey}
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry[dataKey] ?? index} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8125rem' }} />
        </PieChart>
      </ResponsiveContainer>

      {centerValue !== undefined && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900">{centerValue}</span>
          {centerLabel && <span className="text-xs text-ink-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

function ChartEmpty({ height }) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-dashed border-ink-300 text-sm text-ink-400"
      style={{ height }}
    >
      Not enough data to chart yet
    </div>
  )
}