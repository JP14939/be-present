'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Dot
} from 'recharts'

interface DataPoint {
  date: string      // e.g. "12 Jun"
  health: number | null
  isToday: boolean
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className="bg-white border border-stone-100 rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="text-stone-400">{label}</p>
      <p className="font-semibold text-stone-800">{payload[0].value} / 100</p>
    </div>
  )
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (!payload.isToday || payload.health == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#4ade80" stroke="white" strokeWidth={2} />
    </g>
  )
}

export default function HealthChart({ data }: Props) {
  // Filter out null values for the chart but keep structure
  const chartData = data.map(d => ({ ...d, health: d.health ?? undefined }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#a8a29e' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#a8a29e' }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 50, 100]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d6d3d1', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="health"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#healthGradient)"
            connectNulls
            dot={<CustomDot />}
            activeDot={{ r: 4, fill: '#22c55e', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
