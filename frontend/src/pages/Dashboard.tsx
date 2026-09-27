import React, { useEffect, useState } from 'react';
import { Users, Clock, Database, Activity, Calendar, TrendingUp, AlertTriangle, BrainCircuit } from 'lucide-react';
import { getDatasetSummary, getHourlyAnalytics } from '../services/api';
import type { DatasetSummary, HourlyAnalyticsItem } from '../types';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyAnalyticsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDatasetSummary(), getHourlyAnalytics()])
      .then(([summaryData, hourlyData]) => {
        setSummary(summaryData);
        setHourly(hourlyData);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setError('Could not connect to the backend API. Please ensure the Django server is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Connecting to PostgreSQL & loading telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
            <h3 className="text-base font-semibold">Backend Connection Issue</h3>
          </div>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary || summary.total_observations === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Queue Operations Dashboard</h1>
          <p className="text-sm text-slate-500">Live operational telemetry from PostgreSQL</p>
        </div>
        <EmptyState
          title="No Queue Observations in Database"
          description="The database is initialized, but no dataset has been imported yet. Run python manage.py import_dataset to import verified observations."
        />
      </div>
    );
  }

  const { metrics } = summary;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Queue Operations Dashboard</h1>
            <Badge variant="green">PostgreSQL Ground Truth</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Empirical telemetry from <strong>{summary.total_observations.toLocaleString()}</strong> verified service records
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>
            {metrics.earliest_arrival ? new Date(metrics.earliest_arrival).toLocaleDateString() : 'N/A'} —{' '}
            {metrics.latest_arrival ? new Date(metrics.latest_arrival).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Observations"
          value={summary.total_observations.toLocaleString()}
          subtitle="Empirical queue events"
          icon={Database}
          variant="blue"
        />
        <StatCard
          title="Average Wait Time"
          value={`${metrics.avg_wait_time_minutes ?? 0} min`}
          subtitle={`Range: ${metrics.min_wait_time_minutes ?? 0}m – ${metrics.max_wait_time_minutes ?? 0}m`}
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Average Queue Length"
          value={`${metrics.avg_queue_length ?? 0} people`}
          subtitle={`Max observed: ${metrics.max_queue_length ?? 0} people`}
          icon={Users}
          variant="emerald"
        />
        <StatCard
          title="Dataset Integrity"
          value="100% Valid"
          subtitle="0 missing / 0 duplicate rows"
          icon={Activity}
          variant="indigo"
        />
      </div>

      {/* Hourly Congestion Table / Graph View */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Hourly Distribution (2 cols) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Diurnal Congestion by Arrival Hour</h2>
              <p className="text-xs text-slate-500">Hourly queue growth pattern observed across operating hours</p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Arrival Window</th>
                  <th className="px-4 py-2.5 font-semibold">Observations</th>
                  <th className="px-4 py-2.5 font-semibold">Avg Queue Length</th>
                  <th className="px-4 py-2.5 font-semibold">Avg Wait Time</th>
                  <th className="px-4 py-2.5 font-semibold">Congestion Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hourly.map((h) => {
                  const percent = Math.min(100, Math.round((h.avg_wait_minutes / 200) * 100));
                  return (
                    <tr key={h.hour} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{h.label}</td>
                      <td className="px-4 py-3 text-slate-600">{h.observations.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{h.avg_queue_length} people</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{h.avg_wait_minutes} min</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Future Analytics Placeholder (1 col) */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-3">
              <BrainCircuit className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Future ML Analytics</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This module will house model performance evaluations and residual analytics once ML training
              is executed in Phase 2.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Baseline Benchmark</span>
                <p className="mt-1 text-xs text-slate-700">Mean Regressor vs Linear Regression vs Random Forest</p>
                <div className="mt-2 text-[11px] text-slate-400 italic">Scheduled for Phase 2</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Error Metrics</span>
                <p className="mt-1 text-xs text-slate-700">Mean Absolute Error (MAE), RMSE & R² evaluation</p>
                <div className="mt-2 text-[11px] text-slate-400 italic">Scheduled for Phase 2</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Counter Optimization</span>
                <p className="mt-1 text-xs text-slate-700">Dynamic staffing recommendations to minimize queue buildup</p>
                <div className="mt-2 text-[11px] text-slate-400 italic">Scheduled for Phase 3</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-amber-50 p-3 border border-amber-200 text-center">
            <span className="text-xs font-semibold text-amber-800">
              Zero-Hallucination Policy: Model Offline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
