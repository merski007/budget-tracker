import { formatCurrency } from '../utils/budgetUtils'

const VIEW_W = 600
const VIEW_H = 180
const PAD_L  = 12
const PAD_R  = 12
const PAD_T  = 12
const PAD_B  = 24

/**
 * Renders a simple, dependency-free SVG burn-down of the money remaining for the
 * current month. `series` comes from buildBurnDownSeries(); when it is empty the
 * chart is hidden (e.g. for past/future months where it isn't meaningful).
 */
function BurnDownChart({ series }) {
  if (!series || series.length < 2) return null

  const startRemaining = series[0].remaining
  const maxRemaining   = Math.max(startRemaining, 1)   // avoid divide-by-zero
  const firstDay = series[0].day
  const lastDay  = series[series.length - 1].day
  const daySpan  = Math.max(lastDay - firstDay, 1)

  const plotW = VIEW_W - PAD_L - PAD_R
  const plotH = VIEW_H - PAD_T - PAD_B

  const x = day       => PAD_L + ((day - firstDay) / daySpan) * plotW
  const y = remaining => PAD_T + (1 - remaining / maxRemaining) * plotH

  const linePoints = series.map(p => `${x(p.day).toFixed(1)},${y(p.remaining).toFixed(1)}`).join(' ')
  const areaPoints = `${x(firstDay).toFixed(1)},${y(0).toFixed(1)} ${linePoints} ${x(lastDay).toFixed(1)},${y(0).toFixed(1)}`

  return (
    <section className="panel burndown-panel">
      <h2 className="panel-title">
        Remaining Burn-Down
        <span className="row-sub" style={{ marginLeft: '0.5rem' }}>this month</span>
      </h2>

      <div className="burndown-meta">
        <span>
          <strong>{formatCurrency(startRemaining)}</strong> left over <strong>{daySpan}</strong> day
          {daySpan !== 1 ? 's' : ''}
        </span>
      </div>

      <svg
        className="burndown-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Projected money remaining falling from ${formatCurrency(startRemaining)} to $0 by the end of the month`}
      >
        <line x1={PAD_L} y1={y(0)} x2={VIEW_W - PAD_R} y2={y(0)} className="burndown-axis" />
        <polygon points={areaPoints} className="burndown-area" />
        <polyline points={linePoints} className="burndown-line" />
        <circle cx={x(firstDay)} cy={y(startRemaining)} r="4" className="burndown-dot" />

        <text x={PAD_L} y={VIEW_H - 6} className="burndown-tick">Day {firstDay}</text>
        <text x={VIEW_W - PAD_R} y={VIEW_H - 6} className="burndown-tick burndown-tick-end">
          Month end
        </text>
      </svg>
    </section>
  )
}

export default BurnDownChart
