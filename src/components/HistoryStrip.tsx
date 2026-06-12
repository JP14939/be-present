'use client'

interface DayData {
  date: string       // 'Mon', 'Tue', etc.
  health: number | null
  isToday: boolean
}

interface Props {
  days: DayData[]
}

function healthToColor(health: number | null): string {
  if (health === null) return '#d6d3d1'        // no data — stone-300
  if (health >= 80) return '#22c55e'           // thriving — green
  if (health >= 50) return '#84cc16'           // okay — lime
  if (health >= 20) return '#eab308'           // struggling — yellow
  return '#a8a29e'                             // critical — stone
}

export default function HistoryStrip({ days }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-3 sm:gap-4">
        {days.map((day, i) => {
          const color = healthToColor(day.health)
          const size = day.isToday ? 18 : 12
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: '50%',
                  boxShadow: day.isToday ? `0 0 0 3px white, 0 0 0 5px ${color}` : undefined,
                  opacity: day.health === null ? 0.4 : 1,
                  transition: 'background-color 0.3s',
                }}
              />
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: day.isToday ? '#44403c' : '#a8a29e' }}
              >
                {day.date}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
