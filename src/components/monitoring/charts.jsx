"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Color palette for charts
const CHART_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#ef4444", // red
  "#eab308", // yellow
];

// Colors that work in both light and dark modes
const getChartColors = (isDark) => ({
  grid: isDark ? "#334155" : "#e2e8f0",
  text: isDark ? "#94a3b8" : "#64748b",
  textMain: isDark ? "#f8fafc" : "#0f172a",
  tooltip: {
    bg: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#94a3b8" : "#64748b",
  },
});

// Custom Tooltip Component
function CustomTooltip({ active, payload, label, formatter, isDark }) {
  const colors = getChartColors(isDark);

  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg shadow-lg p-3 text-sm border"
      style={{
        backgroundColor: colors.tooltip.bg,
        borderColor: colors.tooltip.border,
        color: colors.tooltip.text,
      }}
    >
      <p className="font-medium mb-2" style={{ color: colors.tooltip.text }}>
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div
            key={`tooltip-${entry.name || idx}`}
            className="flex items-center gap-2"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: colors.tooltip.muted }}>{entry.name}:</span>
            <span
              className="font-medium"
              style={{ color: colors.tooltip.text }}
            >
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Legend Component
function CustomLegend({ payload, isDark }) {
  const colors = getChartColors(isDark);

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload.map((entry) => (
        <span
          key={`legend-${entry.value}`}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: colors.text }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

// Time Series Chart (Line/Area)
export function TimeSeriesChart({
  data,
  series,
  height = 300,
  type = "line",
  showGrid = true,
  showLegend = true,
  yAxisFormatter = (v) => v,
  xAxisFormatter = (v) => v,
  className,
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = getChartColors(isDark);
  const ChartComponent = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              opacity={0.5}
            />
          )}
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: colors.text }}
            tickFormatter={xAxisFormatter}
            axisLine={{ stroke: colors.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.text }}
            tickFormatter={yAxisFormatter}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <CustomTooltip formatter={yAxisFormatter} isDark={isDark} />
            }
          />
          {showLegend && (
            <Legend
              content={(props) => <CustomLegend {...props} isDark={isDark} />}
            />
          )}
          {series.map((s, index) => (
            <DataComponent
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || CHART_COLORS[index % CHART_COLORS.length]}
              fill={
                type === "area"
                  ? s.color || CHART_COLORS[index % CHART_COLORS.length]
                  : undefined
              }
              fillOpacity={type === "area" ? 0.2 : undefined}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart Component
export function BarChartComponent({
  data,
  series,
  height = 300,
  layout = "horizontal",
  showGrid = true,
  yAxisFormatter = (v) => v,
  className,
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = getChartColors(isDark);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              opacity={0.5}
            />
          )}
          <XAxis
            type={layout === "horizontal" ? "category" : "number"}
            dataKey={layout === "horizontal" ? "name" : undefined}
            tick={{ fontSize: 11, fill: colors.text }}
            axisLine={{ stroke: colors.grid }}
            tickLine={false}
          />
          <YAxis
            type={layout === "horizontal" ? "number" : "category"}
            dataKey={layout === "vertical" ? "name" : undefined}
            tick={{ fontSize: 11, fill: colors.text }}
            tickFormatter={yAxisFormatter}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <CustomTooltip formatter={yAxisFormatter} isDark={isDark} />
            }
          />
          <Legend
            content={(props) => <CustomLegend {...props} isDark={isDark} />}
          />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Stat Value with Sparkline
export function StatWithSparkline({
  title,
  value,
  unit,
  data,
  dataKey,
  color = "#3b82f6",
  trend,
  className,
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const colors = getChartColors(isDark);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "text-xs font-medium",
              trend > 0 ? "text-emerald-500" : "text-red-500",
            )}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {data && (
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id={`sparkline-${dataKey}-${color.replace(/[^a-zA-Z0-9]/g, "")}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={`url(#sparkline-${dataKey}-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// Gauge/Progress Chart
export function GaugeChart({
  value,
  max = 100,
  label,
  color = "#3b82f6",
  size = 120,
  strokeWidth = 10,
  className,
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark mode colors if not mounted or dark theme
  const isDark = mounted ? resolvedTheme === "dark" : true;
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on value
  let gaugeColor = color;
  if (percentage > 80)
    gaugeColor = "#ef4444"; // red
  else if (percentage > 60)
    gaugeColor = "#f59e0b"; // orange
  else if (percentage > 40) gaugeColor = "#eab308"; // yellow

  const bgColor = isDark ? "#334155" : "#e2e8f0";
  // Always use light text for visibility in both themes
  const textColor = "#f8fafc";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <title>
            {label
              ? `${label}: ${Math.round(percentage)}%`
              : `Gauge: ${Math.round(percentage)}%`}
          </title>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-white/70 mt-2">{label}</span>}
    </div>
  );
}
