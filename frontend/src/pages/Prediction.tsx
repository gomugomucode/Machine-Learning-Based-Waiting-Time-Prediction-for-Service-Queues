import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sliders,
  Clock,
  Users,
  Layers,
  ShieldCheck,
  AlertCircle,
  Timer,
  BarChart3,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { getServiceTypes, getPredictionStatus, predictWaitingTime } from '../services/api';
import type { ServiceType, PredictionStatus, PredictionResult } from '../types';
import { Badge } from '../components/Badge';

export const Prediction: React.FC = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [status, setStatus] = useState<PredictionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  // Form State
  const [queueLength, setQueueLength] = useState<number>(25);
  const [selectedService, setSelectedService] = useState<string>('');
  const [activeCounters, setActiveCounters] = useState<number>(4);
  const [arrivalTime, setArrivalTime] = useState<string>('11:30');

  // Prediction State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getServiceTypes()
        .then((data) => {
          setServiceTypes(data);
          if (data.length > 0) {
            setSelectedService(String(data[0].id));
          }
        })
        .catch((err) => console.error('Error fetching service types:', err)),
      getPredictionStatus()
        .then((data) => setStatus(data))
        .catch((err) => console.error('Error fetching prediction status:', err))
        .finally(() => setLoadingStatus(false)),
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const prediction = await predictWaitingTime({
        queue_length: queueLength,
        arrival_time: arrivalTime,
        service_type: selectedService ? Number(selectedService) : undefined,
        active_counters: activeCounters,
      });
      setResult(prediction);
    } catch (err: unknown) {
      console.error('Prediction inference failed:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Inference service returned an error.');
      } else {
        setError('Failed to connect to machine learning inference backend.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getCongestionBadgeVariant = (badgeColor: string): 'green' | 'blue' | 'amber' | 'red' => {
    switch (badgeColor) {
      case 'emerald':
        return 'green';
      case 'amber':
        return 'amber';
      case 'rose':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title & Status */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Waiting Time Prediction Engine
          </h1>
          {status?.model_connected ? (
            <Badge variant="green">Model Online • {status.model_name || 'Ridge Regression'}</Badge>
          ) : loadingStatus ? (
            <Badge variant="gray">Checking Model Status...</Badge>
          ) : (
            <Badge variant="amber">Model Offline</Badge>
          )}
          <Badge variant="blue">Phase 2 Pipeline Active</Badge>
          {status?.metrics && (
            <Badge variant="gray">
              Test MAE: {status.metrics.test_mae_minutes?.toFixed(1)}m | R²: {status.metrics.test_r2_score?.toFixed(3)}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Real-time machine learning inference evaluated on 12,017 chronological queue observations.
        </p>
      </div>

      {/* Online Model Information Banner */}
      <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-emerald-950">
                Phase 2 Model Online — {status?.model_name || 'Ridge Regression'} ({status?.version || 'v1.0.0'})
              </h2>
              <span className="text-xs font-semibold text-emerald-700">
                12,017 Records Trained (Chronological 10-day train / 4-day test split)
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
              Real-time inference pipeline loaded in memory. Inputs are processed through scikit-learn standard scaling
              and L2 regularized regression to prevent overfitting during diurnal rush hours. Zero synthetic heuristics.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Input Form (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Queue Operational Inputs</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input 1: Queue Length Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="queue-length" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    Observed Queue Length (Customers in line)
                  </label>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                    {queueLength} customers
                  </span>
                </div>
                <input
                  id="queue-length"
                  type="range"
                  min="0"
                  max="300"
                  value={queueLength}
                  onChange={(e) => setQueueLength(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                  <span>0 (Empty line)</span>
                  <span>75 (Normal flow)</span>
                  <span>150 (Mid-day rush)</span>
                  <span>300 (Severe peak)</span>
                </div>
              </div>

              {/* Input 2: Time of Day & Service Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="arrival-time" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Customer Arrival Time
                  </label>
                  <input
                    id="arrival-time"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Service hours: 09:00 – 17:00</p>
                </div>

                <div>
                  <label htmlFor="service-type" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Service Category
                  </label>
                  <select
                    id="service-type"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {serviceTypes.length > 0 ? (
                      serviceTypes.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))
                    ) : (
                      <option value="">General Queue Service</option>
                    )}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">Loaded from PostgreSQL database</p>
                </div>
              </div>

              {/* Input 3: Active Counters */}
              <div>
                <label htmlFor="active-counters" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  Active Open Service Counters
                </label>
                <input
                  id="active-counters"
                  type="number"
                  min="1"
                  max="20"
                  value={activeCounters}
                  onChange={(e) => setActiveCounters(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Default: 4 active tellers. Supported for future multi-counter simulation extensions.
                </p>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60 transition-all cursor-pointer"
                >
                  <BrainCircuit className="h-4 w-4 text-purple-400" />
                  {submitting ? 'Running Inference Model...' : 'Calculate Predicted Waiting Time'}
                </button>
              </div>
            </form>
          </div>

          {/* Inference Error Display */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Inference Error</p>
                <p className="mt-1 text-rose-800">{error}</p>
              </div>
            </div>
          )}

          {/* Real Prediction Result Card */}
          {result && (
            <div className="rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Live Model Prediction Result</h3>
                    <p className="text-xs text-slate-500">Inference engine: {result.model_name}</p>
                  </div>
                </div>
                <Badge variant={getCongestionBadgeVariant(result.congestion.badge_color)}>
                  {result.congestion.level}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                {/* Primary Metric */}
                <div className="rounded-xl bg-white p-5 border border-slate-200/70 shadow-2xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estimated Wait Time
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {result.predicted_wait_minutes.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">minutes</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Expected elapsed duration from customer arrival until service counter intake.
                  </p>
                </div>

                {/* Confidence Interval */}
                <div className="rounded-xl bg-white p-5 border border-slate-200/70 shadow-2xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Expected Confidence Range (±MAE)
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-blue-700">
                      {result.confidence_interval.lower_minutes.toFixed(1)} – {result.confidence_interval.upper_minutes.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">min span</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Computed based on test set MAE tolerance (±{result.confidence_interval.mae_tolerance.toFixed(1)} min).
                  </p>
                </div>
              </div>

              {/* Evaluated Feature Breakdown */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Model Feature Vector Evaluated
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
                    <p className="text-[10px] text-slate-500 uppercase">Queue Depth</p>
                    <p className="text-sm font-bold text-slate-800">{result.features_evaluated.queue_length} people</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
                    <p className="text-[10px] text-slate-500 uppercase">Arrival Window</p>
                    <p className="text-sm font-bold text-slate-800">{result.features_evaluated.arrival_time}</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 border border-slate-200/70">
                    <p className="text-[10px] text-slate-500 uppercase">Diurnal Progress</p>
                    <p className="text-sm font-bold text-slate-800">+{result.features_evaluated.minutes_since_0900}m</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Model Benchmarks & Methodology (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Candidate Models Benchmark Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Candidate Models Benchmark</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Trained and tested strictly on 12,017 Kaggle queue observations using a chronological split (first 10 days train, held-out 4 days test).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-2 text-right">Test MAE</th>
                    <th className="py-2.5 px-2 text-right">R²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {status?.all_benchmarks?.map((bm) => {
                    const isSelected = bm.model_name === status.model_name;
                    return (
                      <tr
                        key={bm.model_name}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{bm.model_name}</span>
                            {isSelected && (
                              <span className="rounded-md bg-blue-600 text-white text-[9px] px-1.5 py-0.5 font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                          {bm.test_mae.toFixed(1)}m
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                          {bm.test_r2.toFixed(3)}
                        </td>
                      </tr>
                    );
                  }) || (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 text-xs">
                        Loading benchmark comparison...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                <span>Baseline Error Reduction: 72.8%</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The deployed Ridge Regression model drops MAE from 55.74 min (Naive Mean Baseline) to 15.16 min,
                achieving an $R^2$ of 0.9073 on unseen operational days.
              </p>
            </div>
          </div>

          {/* Model Architecture & Features Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              Academic Machine Learning Specifications
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Target Variable ($y$):</span>
                <p className="text-slate-600 mt-0.5 font-mono text-[11px]">
                  wait_time = (service_start_time - arrival_time) / 60
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Input Feature Matrix ($X$):</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                  <li><strong className="text-slate-700">queue_length:</strong> Current line depth ($r = 0.964$)</li>
                  <li><strong className="text-slate-700">minutes_since_0900:</strong> Diurnal progress ($r = 0.911$)</li>
                  <li><strong className="text-slate-700">is_peak_window:</strong> 11:30–14:30 rush indicator</li>
                  <li><strong className="text-slate-700">StandardScaler:</strong> Scaled feature matrix</li>
                </ul>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Data Leakage Prevention:</span>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Strictly avoids future information (<code className="text-slate-700">service_start_time</code> or{' '}
                  <code className="text-slate-700">service_end_time</code>). Only customer-observable variables are used at inference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
