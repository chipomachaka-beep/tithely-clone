// Two month-by-month charts for Reports, drawn with plain SVG:
//   1. a line chart of Tithe and Offering
//   2. a bar chart of money in vs. money out
// Each chart is drawn twice, a wide version and a narrow one, and CSS shows the
// one that fits the screen, so the labels stay readable on phones.
// Hovering a point or bar shows its exact amount; "Show the numbers" lists them all.
import { formatMoney } from "@/lib/format";

const NAVY = "#1b2a4a";
// A deeper gold than the brand gold, so thin lines still stand out on white
// (3.6:1 contrast; the brand gold is only 2.4:1).
const GOLD = "#a8812f";
const GRID = "#e6e8ee";
const INK = "#5f6b7a";

// A round number at or above `value` for the top of the axis, split into 4 steps.
function niceScale(value) {
  if (value <= 0) return { max: 100, step: 25 };
  const rough = value / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s * 4 >= value);
  return { max: step * 4, step };
}

function axisMoney(n) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;
}

// Shared frame: grid lines, dollar labels on the left, month labels along the bottom.
function Frame({ width, height, pad, scale, months, xFor }) {
  const ticks = [0, 1, 2, 3, 4].map((i) => i * scale.step);
  const y = (v) => pad.top + (height - pad.top - pad.bottom) * (1 - v / scale.max);
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(t)}
            y2={y(t)}
            stroke={t === 0 ? "#c9ced8" : GRID}
            strokeWidth="1"
          />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill={INK}>
            {axisMoney(t)}
          </text>
        </g>
      ))}
      {months.map((m, i) => (
        <text
          key={m.key}
          x={xFor(i)}
          y={height - pad.bottom + 18}
          textAnchor="middle"
          fontSize="12"
          fill={INK}
        >
          {m.short}
          {(i === 0 || m.key.endsWith("-01")) && ` ${m.key.slice(0, 4)}`}
        </text>
      ))}
    </g>
  );
}

function LineChart({ months, width, height }) {
  const pad = { top: 16, right: 84, bottom: 34, left: 52 };
  const plotWidth = width - pad.left - pad.right;
  const scale = niceScale(Math.max(...months.map((m) => Math.max(m.tithe, m.offering))));
  const xFor = (i) =>
    months.length === 1 ? pad.left + plotWidth / 2 : pad.left + (plotWidth * i) / (months.length - 1);
  const yFor = (v) => pad.top + (height - pad.top - pad.bottom) * (1 - v / scale.max);

  const series = [
    { key: "tithe", label: "Tithe", color: NAVY, dash: undefined },
    { key: "offering", label: "Offering", color: GOLD, dash: "6 4" },
  ];

  // Labels at the end of each line, nudged apart if they'd overlap.
  const last = months.length - 1;
  const ends = series.map((s) => ({ ...s, y: yFor(months[last][s.key]) }));
  if (Math.abs(ends[0].y - ends[1].y) < 16) {
    const middle = (ends[0].y + ends[1].y) / 2;
    const upper = ends[0].y <= ends[1].y ? 0 : 1;
    ends[upper].y = middle - 8;
    ends[1 - upper].y = middle + 8;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Line chart of Tithe and Offering totals by month"
      className="chart-svg"
    >
      <Frame width={width} height={height} pad={pad} scale={scale} months={months} xFor={xFor} />

      {series.map((s) => (
        <polyline
          key={s.key}
          points={months.map((m, i) => `${xFor(i)},${yFor(m[s.key])}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeDasharray={s.dash}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {months.map((m, i) =>
        series.map((s) => {
          const x = xFor(i);
          const y = yFor(m[s.key]);
          const tip = `${m.name} · ${s.label}: ${formatMoney(m[s.key])}`;
          return (
            <g key={`${m.key}-${s.key}`} className="chart-point">
              <title>{tip}</title>
              {/* A bigger invisible circle makes the point easy to hover. */}
              <circle cx={x} cy={y} r="12" fill="transparent" />
              {s.key === "tithe" ? (
                <circle cx={x} cy={y} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2" />
              ) : (
                <rect x={x - 4.5} y={y - 4.5} width="9" height="9" fill={s.color} stroke="#fff" strokeWidth="2" />
              )}
            </g>
          );
        })
      )}

      {ends.map((s) => (
        <text key={s.key} x={xFor(last) + 10} y={s.y + 4} fontSize="12" fontWeight="600" fill="#1f2933">
          {s.label}
        </text>
      ))}
    </svg>
  );
}

// A bar whose top corners are rounded and whose bottom sits flat on the baseline.
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function BarChart({ months, width, height }) {
  const pad = { top: 16, right: 16, bottom: 34, left: 52 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const scale = niceScale(Math.max(...months.map((m) => Math.max(m.moneyIn, m.moneyOut))));
  const groupWidth = plotWidth / months.length;
  const barWidth = Math.min(30, groupWidth * 0.32);
  const xFor = (i) => pad.left + groupWidth * (i + 0.5);
  const heightFor = (v) => (plotHeight * v) / scale.max;
  const baseline = pad.top + plotHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Bar chart of money in and money out by month"
      className="chart-svg"
    >
      <Frame width={width} height={height} pad={pad} scale={scale} months={months} xFor={xFor} />
      {months.map((m, i) => {
        const center = xFor(i);
        const bars = [
          { label: "Money in", value: m.moneyIn, color: NAVY, x: center - barWidth - 1 },
          { label: "Money out", value: m.moneyOut, color: GOLD, x: center + 1 },
        ];
        return bars.map((b) => {
          const h = heightFor(b.value);
          return (
            <g key={`${m.key}-${b.label}`} className="chart-point">
              <title>{`${m.name} · ${b.label}: ${formatMoney(b.value)}`}</title>
              {/* Hover area covers the whole column, so even a $0 bar shows its tip. */}
              <rect x={b.x} y={pad.top} width={barWidth} height={plotHeight} fill="transparent" />
              <path d={barPath(b.x, baseline - h, barWidth, h)} fill={b.color} />
            </g>
          );
        });
      })}
    </svg>
  );
}

function Legend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={`legend-swatch legend-${item.shape}`} style={{ "--swatch": item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default function TrendCharts({ months }) {
  return (
    <div className="trend-charts">
      <figure className="chart-card">
        <figcaption>
          <h3>Tithe and Offering by month</h3>
          <Legend
            items={[
              { label: "Tithe", color: NAVY, shape: "line" },
              { label: "Offering", color: GOLD, shape: "dashed" },
            ]}
          />
        </figcaption>
        <div className="chart-wide">
          <LineChart months={months} width={680} height={260} />
        </div>
        <div className="chart-narrow">
          <LineChart months={months} width={340} height={240} />
        </div>
      </figure>

      <figure className="chart-card">
        <figcaption>
          <h3>Money in vs. money out by month</h3>
          <Legend
            items={[
              { label: "Money in", color: NAVY, shape: "box" },
              { label: "Money out", color: GOLD, shape: "box" },
            ]}
          />
        </figcaption>
        <div className="chart-wide">
          <BarChart months={months} width={680} height={260} />
        </div>
        <div className="chart-narrow">
          <BarChart months={months} width={340} height={240} />
        </div>
      </figure>

      <details className="chart-numbers">
        <summary>Show the numbers</summary>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Tithe</th>
                <th className="num">Offering</th>
                <th className="num">Money in</th>
                <th className="num">Money out</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m) => (
                <tr key={m.key}>
                  <td>{m.name}</td>
                  <td className="num">{formatMoney(m.tithe)}</td>
                  <td className="num">{formatMoney(m.offering)}</td>
                  <td className="num">{formatMoney(m.moneyIn)}</td>
                  <td className="num">{formatMoney(m.moneyOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
