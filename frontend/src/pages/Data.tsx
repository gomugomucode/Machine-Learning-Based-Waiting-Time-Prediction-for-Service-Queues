import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, ArrowUpDown } from 'lucide-react';
import { getQueueObservations } from '../services/api';
import type { QueueObservation } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

export const Data: React.FC = () => {
  const [observations, setObservations] = useState<QueueObservation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(25);
  const [ordering, setOrdering] = useState<string>('arrival_time');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObservations = (page: number, order: string) => {
    setLoading(true);
    getQueueObservations({ page, page_size: pageSize, ordering: order })
      .then((data) => {
        setObservations(data.results);
        setTotalCount(data.count);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load observations:', err);
        setError('Failed to fetch records from Django backend.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchObservations(currentPage, ordering);
  }, [currentPage, ordering]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSortChange = (newOrder: string) => {
    setOrdering(newOrder);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Queue Observations Browser
            </h1>
            <Badge variant="blue">{totalCount.toLocaleString()} Records in DB</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            PostgreSQL observations imported from verified Kaggle queue observation dataset
          </p>
        </div>

        {/* Actions / Sorting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-2xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={ordering}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent focus:outline-hidden text-slate-700 font-medium"
            >
              <option value="arrival_time">Order: Arrival (Ascending)</option>
              <option value="-arrival_time">Order: Arrival (Descending)</option>
              <option value="-wait_time">Order: Longest Wait Time</option>
              <option value="wait_time">Order: Shortest Wait Time</option>
              <option value="-queue_length">Order: Highest Queue Length</option>
            </select>
          </div>

          <button
            onClick={() => fetchObservations(currentPage, ordering)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-semibold">{error}</p>
        </div>
      ) : totalCount === 0 && !loading ? (
        <EmptyState
          title="No Queue Observations in PostgreSQL"
          description="Import records using the backend management command: python manage.py import_dataset <filepath>"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Arrival Time</th>
                  <th className="px-4 py-3">Service Start</th>
                  <th className="px-4 py-3">Service Finish</th>
                  <th className="px-4 py-3 text-right">Queue Length</th>
                  <th className="px-4 py-3 text-right">Wait Time</th>
                  <th className="px-4 py-3 text-right">Service Duration</th>
                  <th className="px-4 py-3">Service Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span>Querying PostgreSQL...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  observations.map((obs) => {
                    const arr = new Date(obs.arrival_time);
                    const start = new Date(obs.service_start_time);
                    const end = new Date(obs.service_end_time);

                    return (
                      <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-bold">#{obs.id}</td>
                        <td className="px-4 py-3 text-slate-800">
                          {arr.toISOString().replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {start.toISOString().replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {end.toISOString().replace('T', ' ').substring(0, 19)}
                        </td>
                        <td className="px-4 py-3 text-right font-sans font-bold text-slate-900">
                          {obs.queue_length}
                        </td>
                        <td className="px-4 py-3 text-right font-sans font-bold text-amber-600">
                          {obs.wait_time.toFixed(2)} min
                        </td>
                        <td className="px-4 py-3 text-right font-sans text-slate-600">
                          {obs.service_duration !== null ? `${obs.service_duration.toFixed(2)} min` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {obs.service_type_name ? (
                            <Badge variant="blue">{obs.service_type_name}</Badge>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned (Kaggle)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalCount.toLocaleString()}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              <span className="px-2 font-mono text-slate-700">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
