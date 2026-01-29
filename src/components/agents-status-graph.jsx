"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconActivity, IconCircleFilled } from "@tabler/icons-react";

const MAX_DATA_POINTS = 60; // 60 minutes of history

export function AgentsStatusGraph({ agents }) {
  const [statusHistory, setStatusHistory] = useState([]);
  const isInitialMount = useRef(true);

  // Clear localStorage on page load (component mount)
  useEffect(() => {
    if (isInitialMount.current) {
      localStorage.removeItem("agents-status-history");
      isInitialMount.current = false;
    }
  }, []);

  // Load history from localStorage on mount (after clearing)
  useEffect(() => {
    const stored = localStorage.getItem("agents-status-history");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStatusHistory(parsed);
      } catch (e) {
        console.error("Failed to parse status history:", e);
      }
    }
  }, []);

  // Record current status
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    const now = Date.now();
    const activeCount = agents.filter((a) => a.isActive).length;
    const inactiveCount = agents.filter(
      (a) => !a.isActive && a.isConnected,
    ).length;
    const pendingCount = agents.filter((a) => !a.isConnected).length;

    // Calculate average load score
    const agentsWithLoad = agents.filter(
      (a) => a.loadScore !== undefined && a.loadScore > 0,
    );
    const avgLoad =
      agentsWithLoad.length > 0
        ? agentsWithLoad.reduce((sum, a) => sum + a.loadScore, 0) /
          agentsWithLoad.length
        : 0;

    const newDataPoint = {
      timestamp: now,
      active: activeCount,
      inactive: inactiveCount,
      pending: pendingCount,
      total: agents.length,
      avgLoad: Math.round(avgLoad * 10) / 10, // Round to 1 decimal
    };

    setStatusHistory((prev) => {
      const updated = [...prev, newDataPoint].slice(-MAX_DATA_POINTS);
      localStorage.setItem("agents-status-history", JSON.stringify(updated));
      return updated;
    });
  }, [agents]);

  if (statusHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            История статусов агентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Сбор данных... График появится через минуту
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate graph dimensions
  const width = 100; // percentage
  const height = 120; // pixels
  const maxValue = Math.max(...statusHistory.map((d) => d.total), 1);
  const maxLoad = 100; // Load score is always 0-100%

  // Generate SVG path for each status type
  const generatePath = (dataKey, maxVal = maxValue) => {
    if (statusHistory.length < 2) return "";

    const points = statusHistory.map((point, index) => {
      const x = (index / (statusHistory.length - 1)) * 100;
      const y = height - (point[dataKey] / maxVal) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const latestData = statusHistory[statusHistory.length - 1];
  const oldestData = statusHistory[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconActivity className="h-5 w-5" />
          История статусов агентов
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {formatTime(oldestData.timestamp)} —{" "}
            {formatTime(latestData.timestamp)}
          </span>
          <span>•</span>
          <span>{statusHistory.length} точек данных</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-3 w-3 text-green-500" />
            <span>Активные: {latestData.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-3 w-3 text-yellow-500" />
            <span>Неактивные: {latestData.inactive}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-3 w-3 text-slate-400" />
            <span>Ожидают: {latestData.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCircleFilled className="h-3 w-3 text-blue-500" />
            <span>
              Средняя нагрузка: {latestData.avgLoad?.toFixed(1) || 0}%
            </span>
          </div>
        </div>

        {/* Graph */}
        <div className="relative w-full bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border">
          <svg
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: `${height}px` }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={height * ratio}
                x2="100"
                y2={height * ratio}
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-slate-300 dark:text-slate-700"
                strokeDasharray="2,2"
              />
            ))}

            {/* Area fills */}
            <defs>
              <linearGradient id="activeGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(34, 197, 94)"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(34, 197, 94)"
                  stopOpacity="0.05"
                />
              </linearGradient>
              <linearGradient id="inactiveGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(234, 179, 8)"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(234, 179, 8)"
                  stopOpacity="0.05"
                />
              </linearGradient>
              <linearGradient id="pendingGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(148, 163, 184)"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(148, 163, 184)"
                  stopOpacity="0.05"
                />
              </linearGradient>
              <linearGradient id="loadGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity="0.2"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity="0.05"
                />
              </linearGradient>
            </defs>

            {/* Pending area */}
            {statusHistory.length > 1 && (
              <path
                d={`${generatePath("pending")} L 100,${height} L 0,${height} Z`}
                fill="url(#pendingGradient)"
              />
            )}

            {/* Inactive area */}
            {statusHistory.length > 1 && (
              <path
                d={`${generatePath("inactive")} L 100,${height} L 0,${height} Z`}
                fill="url(#inactiveGradient)"
              />
            )}

            {/* Active area */}
            {statusHistory.length > 1 && (
              <path
                d={`${generatePath("active")} L 100,${height} L 0,${height} Z`}
                fill="url(#activeGradient)"
              />
            )}

            {/* Lines */}
            {statusHistory.length > 1 && (
              <>
                <path
                  d={generatePath("pending")}
                  fill="none"
                  stroke="rgb(148, 163, 184)"
                  strokeWidth="1.5"
                  className="opacity-70"
                />
                <path
                  d={generatePath("inactive")}
                  fill="none"
                  stroke="rgb(234, 179, 8)"
                  strokeWidth="1.5"
                  className="opacity-70"
                />
                <path
                  d={generatePath("active")}
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="2"
                />
                {/* Load line (using maxLoad scale) */}
                <path
                  d={generatePath("avgLoad", maxLoad)}
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2.5"
                  strokeDasharray="4,2"
                  className="opacity-80"
                />
              </>
            )}

            {/* Data points */}
            {statusHistory.map((point, index) => {
              const x = (index / (statusHistory.length - 1)) * 100;
              const yActive = height - (point.active / maxValue) * height;
              const yInactive = height - (point.inactive / maxValue) * height;
              const yPending = height - (point.pending / maxValue) * height;
              const yLoad = height - (point.avgLoad / maxLoad) * height;

              return (
                <g key={point.timestamp}>
                  {point.pending > 0 && (
                    <circle
                      cx={x}
                      cy={yPending}
                      r="1.5"
                      fill="rgb(148, 163, 184)"
                      className="opacity-70"
                    />
                  )}
                  {point.inactive > 0 && (
                    <circle
                      cx={x}
                      cy={yInactive}
                      r="1.5"
                      fill="rgb(234, 179, 8)"
                      className="opacity-70"
                    />
                  )}
                  {point.active > 0 && (
                    <circle cx={x} cy={yActive} r="2" fill="rgb(34, 197, 94)" />
                  )}
                  {point.avgLoad > 0 && (
                    <circle
                      cx={x}
                      cy={yLoad}
                      r="2"
                      fill="rgb(59, 130, 246)"
                      className="opacity-80"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
            <div className="flex flex-col items-start">
              <span className="font-semibold">{maxValue}</span>
              <span className="text-[10px]">агентов</span>
            </div>
            <span>{Math.round(maxValue * 0.5)}</span>
            <span>0</span>
          </div>

          {/* Right Y-axis labels for load */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-blue-600 pointer-events-none">
            <div className="flex flex-col items-end">
              <span className="font-semibold">100%</span>
              <span className="text-[10px]">нагрузка</span>
            </div>
            <span>50%</span>
            <span>0%</span>
          </div>
        </div>

        {/* Stats summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-muted-foreground">Макс. активных</div>
            <div className="text-lg font-semibold text-green-600">
              {Math.max(...statusHistory.map((d) => d.active))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Макс. неактивных</div>
            <div className="text-lg font-semibold text-yellow-600">
              {Math.max(...statusHistory.map((d) => d.inactive))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Макс. ожидающих</div>
            <div className="text-lg font-semibold text-slate-600">
              {Math.max(...statusHistory.map((d) => d.pending))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Макс. нагрузка</div>
            <div className="text-lg font-semibold text-blue-600">
              {Math.max(...statusHistory.map((d) => d.avgLoad || 0)).toFixed(1)}
              %
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
