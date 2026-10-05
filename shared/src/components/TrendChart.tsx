import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { OpsEvent } from '../data/events';
import { fmtDay } from '../format';
import { fw, series as palette } from '../theme/tokens';

export interface SeriesDef {
  key: string;
  label: string;
  kind: 'line' | 'area' | 'bar';
  color: string;
  axis?: 'left' | 'right';
  dashed?: boolean;
  format: (n: number) => string;
}

export interface RefLineDef {
  y: number;
  label: string;
  axis?: 'left' | 'right';
}

type Bound = number | 'auto' | 'dataMin' | 'dataMax';

export interface TrendChartProps {
  data: object[];
  series: SeriesDef[];
  events?: OpsEvent[];
  refLines?: RefLineDef[];
  leftFormat: (n: number) => string;
  rightFormat?: (n: number) => string;
  leftDomain?: [Bound, Bound];
  rightDomain?: [Bound, Bound];
  height?: number;
}

const axisTick = { fill: palette.axis, fontSize: 11, fontFamily: 'Inter Variable, Inter Fallback, sans-serif', fontVariantNumeric: 'tabular-nums' };

export function TrendChart({
  data,
  series,
  events = [],
  refLines = [],
  leftFormat,
  rightFormat,
  leftDomain = ['auto', 'auto'],
  rightDomain = ['auto', 'auto'],
  height = 240,
}: TrendChartProps) {
  const hasRight = series.some((s) => s.axis === 'right');
  const eventByDate = new Map(events.map((e) => [e.date, e]));

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 4 : 12, bottom: 0, left: 4 }}>
          <defs>
            {series
              .filter((s) => s.kind === 'area')
              .map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
          </defs>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: palette.grid }}
            interval={6}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={leftFormat}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            domain={leftDomain}
            width={60}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={rightFormat ?? leftFormat}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              domain={rightDomain}
              width={60}
            />
          )}

          {events.map((e) => (
            <ReferenceLine
              key={e.date}
              x={e.date}
              yAxisId="left"
              stroke={e.kind === 'incident' ? fw.red500 : fw.purple200}
              strokeDasharray="3 3"
            />
          ))}
          {refLines.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.y}
              yAxisId={r.axis ?? 'left'}
              stroke={palette.target}
              strokeDasharray="6 4"
              label={{ value: r.label, position: 'insideTopLeft', fill: palette.axis, fontSize: 11 }}
            />
          ))}

          {series.map((s) => {
            const common = { dataKey: s.key, name: s.label, yAxisId: s.axis ?? 'left', isAnimationActive: false };
            if (s.kind === 'bar') return <Bar key={s.key} {...common} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={14} />;
            if (s.kind === 'area')
              return (
                <Area
                  key={s.key}
                  {...common}
                  type="monotone"
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              );
            return (
              <Line
                key={s.key}
                {...common}
                type="monotone"
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}

          <Tooltip
            cursor={{ stroke: fw.purple50, strokeWidth: 1 }}
            content={(props: TooltipProps<number, string>) => (
              <ChartTooltip {...props} series={series} event={eventByDate.get(props.label as string)} />
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <ul className="legend">
        {series.map((s) => (
          <li key={s.key}>
            <span
              className={`legend__swatch legend__swatch--${s.kind}${s.dashed ? ' legend__swatch--dashed' : ''}`}
              style={{ color: s.color }}
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  event,
}: TooltipProps<number, string> & { series: SeriesDef[]; event?: OpsEvent }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="tooltip__date label">{fmtDay(label as string)}</div>
      {series.map((s) => {
        const p = payload.find((x) => x.dataKey === s.key);
        if (p?.value == null) return null;
        return (
          <div key={s.key} className="tooltip__row">
            <span className="tooltip__dot" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span className="tooltip__val">{s.format(p.value)}</span>
          </div>
        );
      })}
      {event && <div className={`tooltip__event tooltip__event--${event.kind}`}>{event.note}</div>}
    </div>
  );
}
