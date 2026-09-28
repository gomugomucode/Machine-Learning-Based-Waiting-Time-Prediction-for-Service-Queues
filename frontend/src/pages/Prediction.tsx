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
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  History,
  HelpCircle,
  Radio,
} from 'lucide-react';
import { getServiceTypes, getPredictionStatus, predictWaitingTime, PredictionError } from '../services/api';
import type {
  ServiceType,
  BackendStatus,
  PredictionResponse,
  PredictionRequest,
} from '../types';
import { Badge } from '../components/Badge';

/**
 * Returns a local ISO string formatted for datetime-local inputs (YYYY-MM-DDTHH:mm).
 */
const getLocalDateTimeString = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats wait duration in seconds to a human-friendly string (e.g. "Approximately 31 min 1 sec").
 */
const formatHumanReadableWait = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return 'Approximately 0 min';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `Approximately ${secs} sec`;
  if (secs === 0) return `Approximately ${mins} min`;
  return `Approximately ${mins} min ${secs} sec`;
};

export const Prediction: React.FC = () => {
  // Master API Data
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Form Inputs
  const [queueLength, setQueueLength] = useState<string>('25');
  const [arrivalTime, setArrivalTime] = useState<string>(getLocalDateTimeString());
  const [lag1QueueLength, setLag1QueueLength] = useState<string>('23');
  const [arrivals15m, setArrivals15m] = useState<string>('8');
  const [arrivals30m, setArrivals30m] = useState<string>('17');
  const [activeCounters, setActiveCounters] = useState<number>(4);
  const [selectedService, setSelectedService] = useState<string>('');

  // UI Interactive States
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [showFeatureTransparency, setShowFeatureTransparency] = useState<boolean>(true);
  const [showAdvancedMath, setShowAdvancedMath] = useState<boolean>(false);

  // Validation & Submission States
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [apiError, setApiError] = useState<{ message: string; isNetwork?: boolean; detail?: string } | null>(null);

  // Load initial backend status and service types on mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      setLoadingStatus(true);
      setStatusError(null);

      // 1. Fetch Service Types
      try {
        const types = await getServiceTypes();
        if (isMounted) {
          setServiceTypes(types);
          if (types.length > 0) {
            setSelectedService(String(types[0].id));
          }
        }
      } catch (err) {
        console.warn('Unable to load service types from backend:', err);
      }

      // 2. Fetch Prediction Engine Status
      try {
        const statusData = await getPredictionStatus();
        if (isMounted) {
          setBackendStatus(statusData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Prediction status endpoint unreachable:', err);
          setStatusError('Prediction engine unavailable');
        }
      } finally {
        if (isMounted) {
          setLoadingStatus(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Validate all user inputs prior to sending POST request.
   */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // 1. Queue Length validation (required, integer, min 0, max 1000)
    if (queueLength === '' || queueLength === undefined || queueLength === null) {
      errors.queue_length = 'Queue length is required.';
    } else {
      const qNum = Number(queueLength);
      if (isNaN(qNum) || !Number.isInteger(qNum)) {
        errors.queue_length = 'Queue length must be a whole integer.';
      } else if (qNum < 0) {
        errors.queue_length = 'Queue length cannot be negative.';
      } else if (qNum > 1000) {
        errors.queue_length = 'Queue length exceeds maximum operational capacity (1,000).';
      }
    }

    // 2. Arrival Time validation (valid ISO date string)
    if (!arrivalTime) {
      errors.arrival_time = 'Arrival date and time is required.';
    } else {
      const parsedDate = new Date(arrivalTime);
      if (isNaN(parsedDate.getTime())) {
        errors.arrival_time = 'Please select a valid date and time.';
      }
    }

    // 3. Previous Queue Length validation (optional, must be integer >= 0 if provided)
    if (lag1QueueLength !== '') {
      const lagNum = Number(lag1QueueLength);
      if (isNaN(lagNum) || !Number.isInteger(lagNum) || lagNum < 0) {
        errors.lag1_queue_length = 'Previous queue length must be a non-negative integer.';
      }
    }

    // 4. Arrivals in Last 15 min (optional, must be >= 0 if provided)
    if (arrivals15m !== '') {
      const a15Num = Number(arrivals15m);
      if (isNaN(a15Num) || a15Num < 0) {
        errors.arrivals_last_15m = 'Arrivals in last 15 min must be non-negative.';
      }
    }

    // 5. Arrivals in Last 30 min (optional, must be >= 0 if provided)
    if (arrivals30m !== '') {
      const a30Num = Number(arrivals30m);
      if (isNaN(a30Num) || a30Num < 0) {
        errors.arrivals_last_30m = 'Arrivals in last 30 min must be non-negative.';
      }
    }

    // 6. Active Counters validation (1 to 50)
    if (activeCounters < 1 || activeCounters > 50) {
      errors.active_counters = 'Active counters must be between 1 and 50.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle prediction form submission with real-time feedback.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Build ISO-8601 timestamp string (YYYY-MM-DDTHH:mm:00)
      const isoArrival = arrivalTime.includes('T') && arrivalTime.length === 16
        ? `${arrivalTime}:00`
        : new Date(arrivalTime).toISOString();

      const payload: PredictionRequest = {
        queue_length: parseInt(queueLength, 10),
        arrival_time: isoArrival,
        active_counters: activeCounters,
      };

      if (lag1QueueLength !== '') {
        payload.lag1_queue_length = parseInt(lag1QueueLength, 10);
      }
      if (arrivals15m !== '') {
        payload.arrivals_last_15m = parseFloat(arrivals15m);
      }
      if (arrivals30m !== '') {
        payload.arrivals_last_30m = parseFloat(arrivals30m);
      }
      if (selectedService) {
        payload.service_type = parseInt(selectedService, 10);
      }

      const prediction = await predictWaitingTime(payload);
      setResult(prediction);
    } catch (err: unknown) {
      console.error('Inference error encountered:', err);
      if (err instanceof PredictionError) {
        setApiError({
          message: err.message,
          isNetwork: err.isNetworkError,
          detail: err.detail,
        });
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string; detail?: string } } };
        const msg = axiosErr.response?.data?.error || axiosErr.response?.data?.detail || 'Inference service returned an error.';
        setApiError({ message: msg });
      } else {
        setApiError({
          message: 'Unable to connect to the prediction server. Make sure the Django backend is running.',
          isNetwork: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Map backend congestion color string to UI Badge variant.
   */
  const getCongestionBadgeVariant = (badgeColor?: string): 'green' | 'blue' | 'amber' | 'red' => {
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

  const isModelOnline = Boolean(backendStatus?.model_connected && backendStatus?.status === 'online');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Header & Live Backend Status Bar */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Waiting-Time Prediction Engine
              </h1>
              {loadingStatus ? (
                <Badge variant="gray">Checking Prediction Engine...</Badge>
              ) : isModelOnline ? (
                <Badge variant="green">● Prediction engine online</Badge>
              ) : (
                <Badge variant="amber">{statusError || 'Prediction engine unavailable'}</Badge>
              )}
              <Badge variant="blue">Phase 2 ML Pipeline</Badge>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Live inference engine powered by a verified Random Forest regressor evaluated on 12,017 chronological queue observations.
            </p>
          </div>

          {backendStatus?.metrics && (
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
              <Activity className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="text-slate-600">
                <span className="font-semibold text-slate-900">Held-Out Test MAE:</span>{' '}
                <span className="font-mono text-blue-700 font-bold">{backendStatus.metrics.test_mae_minutes?.toFixed(2)} min</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-semibold text-slate-900">R²:</span>{' '}
                <span className="font-mono text-emerald-700 font-bold">{backendStatus.metrics.test_r2_score?.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Verification Banner */}
      <div className="mb-8 rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-5 text-emerald-950 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-emerald-950">
                Active Architecture: {backendStatus?.model_name || 'Random Forest Regressor'} ({backendStatus?.version || 'phase2-best-model'})
              </h2>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Strict Temporal Split (10 Days Train / 4 Days Test)
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
              Inference requests are executed using 10 causal prediction-time features available at arrival moment{' '}
              <span className="font-mono font-semibold">$t_0$</span>. All future operational leakage (<span className="font-mono">wait_time</span>,{' '}
              <span className="font-mono">start_time</span>, <span className="font-mono">finish_time</span>) is mathematically eliminated.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left 7 cols) & Info/Benchmarks (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form & Real-Time Results */}
        <div className="space-y-6 lg:col-span-7">
          {/* Prediction Input Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Queue Operational Parameters</h2>
                  <p className="text-xs text-slate-500">Provide snapshot values observable at customer arrival.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Field 1: Queue Length (Required) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="queue-length-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    Queue Length <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="queue-length-input"
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      value={queueLength}
                      onChange={(e) => {
                        setQueueLength(e.target.value);
                        if (fieldErrors.queue_length) {
                          setFieldErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.queue_length;
                            return updated;
                          });
                        }
                      }}
                      className={`w-24 rounded-lg border px-2.5 py-1 text-right text-xs font-bold transition-colors ${
                        fieldErrors.queue_length
                          ? 'border-rose-400 bg-rose-50 text-rose-800 focus:border-rose-500'
                          : 'border-blue-300 bg-blue-50 text-blue-800 focus:border-blue-500'
                      } focus:outline-hidden`}
                    />
                    <span className="text-xs font-semibold text-slate-500">people</span>
                  </div>
                </div>

                <input
                  id="queue-length"
                  type="range"
                  min="0"
                  max="200"
                  value={isNaN(Number(queueLength)) ? 0 : Math.min(200, Math.max(0, Number(queueLength)))}
                  onChange={(e) => {
                    setQueueLength(e.target.value);
                    if (fieldErrors.queue_length) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.queue_length;
                        return updated;
                      });
                    }
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>0 (Empty Queue)</span>
                  <span>50 (Moderate Line)</span>
                  <span>100 (Peak Surge)</span>
                  <span>200+ (Severe)</span>
                </div>
                {fieldErrors.queue_length ? (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.queue_length}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Primary ML driver: Observed customers standing ahead in the service line at arrival moment.
                  </p>
                )}
              </div>

              {/* Field 2: Arrival Time (Date & Time Picker) */}
              <div>
                <label htmlFor="arrival-time" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Arrival Date &amp; Time <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="arrival-time"
                    type="datetime-local"
                    value={arrivalTime}
                    onChange={(e) => {
                      setArrivalTime(e.target.value);
                      if (fieldErrors.arrival_time) {
                        setFieldErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.arrival_time;
                          return updated;
                        });
                      }
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 transition-colors ${
                      fieldErrors.arrival_time
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    } focus:outline-hidden`}
                  />
                  <button
                    type="button"
                    onClick={() => setArrivalTime(getLocalDateTimeString())}
                    className="shrink-0 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    title="Set to Current Time"
                  >
                    Now
                  </button>
                </div>
                {fieldErrors.arrival_time ? (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.arrival_time}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Transformed by feature engineering into <span className="font-mono">minutes_since_opening</span>, diurnal cyclical <span className="font-mono">sin_time</span>, <span className="font-mono">cos_time</span>, and <span className="font-mono">day_of_week</span>.
                  </p>
                )}
              </div>

              {/* Field 3: Temporal Lag & Arrival Velocity (Optional Features) */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-indigo-600" />
                    Temporal Queue Dynamics (Optional Features)
                  </span>
                  <span className="text-[11px] text-slate-500">Defaults to empirical averages if left blank</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="lag1-queue-length" className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Previous Queue Length
                    </label>
                    <input
                      id="lag1-queue-length"
                      type="number"
                      min="0"
                      max="1000"
                      placeholder="Auto (same as queue)"
                      value={lag1QueueLength}
                      onChange={(e) => setLag1QueueLength(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400">Preceding observation</p>
                  </div>

                  <div>
                    <label htmlFor="arrivals-15m" className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Arrivals (Last 15 min)
                    </label>
                    <input
                      id="arrivals-15m"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 8"
                      value={arrivals15m}
                      onChange={(e) => setArrivals15m(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400">15m velocity (mean: 27.5)</p>
                  </div>

                  <div>
                    <label htmlFor="arrivals-30m" className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Arrivals (Last 30 min)
                    </label>
                    <input
                      id="arrivals-30m"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 17"
                      value={arrivals30m}
                      onChange={(e) => setArrivals30m(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
                    />
                    <p className="mt-0.5 text-[10px] text-slate-400">30m velocity (mean: 55.0)</p>
                  </div>
                </div>
              </div>

              {/* Field 4: Operational Environment (Counters & Service Type) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="active-counters" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Users className="h-4 w-4 text-slate-400" />
                    Active Open Counters
                  </label>
                  <input
                    id="active-counters"
                    type="number"
                    min="1"
                    max="20"
                    value={activeCounters}
                    onChange={(e) => setActiveCounters(Math.max(1, Math.min(20, Number(e.target.value))))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                    Baseline: 4 counters. Multi-server capacity simulation layer (Little&apos;s Law clearing velocity factor: <span className="font-mono font-semibold">{(4 / Math.max(1, activeCounters)).toFixed(2)}x</span>).
                  </p>
                </div>

                <div>
                  <label htmlFor="service-type" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Layers className="h-4 w-4 text-slate-400" />
                    Service Category
                  </label>
                  <select
                    id="service-type"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {serviceTypes.length > 0 ? (
                      serviceTypes.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))
                    ) : (
                      <option value="">General Queue Service (Default)</option>
                    )}
                  </select>
                  <p className="mt-1 text-[11px] font-medium text-indigo-700">
                    {(() => {
                      const st = serviceTypes.find((s) => String(s.id) === selectedService);
                      if (!st) return 'Standard baseline duration (1.00x complexity multiplier)';
                      const n = st.name.toLowerCase();
                      if (n.includes('cash')) return '⚡ Routine teller speed (0.85x service duration)';
                      if (n.includes('loan')) return '⏳ In-depth documentation & interview (1.70x duration)';
                      if (n.includes('support')) return '🔍 Dispute & card resolution (1.25x duration)';
                      if (n.includes('inquir')) return '🚀 Quick routing & token queries (0.65x duration)';
                      return '📋 Standard baseline duration (1.00x multiplier)';
                    })()}
                  </p>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <BrainCircuit className={`h-4 w-4 text-purple-400 ${submitting ? 'animate-spin' : ''}`} />
                  {submitting ? 'Analyzing queue...' : 'Predict Waiting Time'}
                </button>
              </div>
            </form>
          </div>

          {/* Error Feedback Banners */}
          {apiError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3 shadow-xs"
            >
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-950">
                  {apiError.isNetwork ? 'Network Connection Failure' : 'Inference Request Error'}
                </p>
                <p className="mt-1 text-rose-800 leading-relaxed">{apiError.message}</p>
                {apiError.detail && (
                  <p className="mt-1 font-mono text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                    {apiError.detail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Idle Empty State (when no prediction yet) */}
          {!result && !submitting && !apiError && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
              <div className="mx-auto rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center text-blue-600 mb-3">
                <Timer className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Prediction Generated Yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Set the current observed queue length and arrival parameters above, then click{' '}
                <strong className="text-slate-700">Predict Waiting Time</strong> to compute expected wait times with held-out error tolerances.
              </p>
            </div>
          )}

          {/* Loading Skeleton */}
          {submitting && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-8 text-center animate-pulse">
              <div className="mx-auto rounded-full bg-blue-200 w-12 h-12 flex items-center justify-center text-blue-700 mb-3">
                <BrainCircuit className="h-6 w-6 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-blue-900">Analyzing queue...</h3>
              <p className="mt-1 text-xs text-blue-700">
                Evaluating temporal features and computing Random Forest regression inference with multi-server scaling.
              </p>
            </div>
          )}

          {/* Section 7, 8, 9, 10, 11: Real Prediction Result Card */}
          {result && (
            <div className="rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-md transition-all">
              {/* Header: Result Title & Backend Congestion Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-blue-600 p-2 text-white shadow-xs">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Estimated Waiting Time</h3>
                    <p className="text-xs text-slate-500">
                      Model: {result.model_name || 'Random Forest Regressor'} • {result.model_version || 'phase2-best-model'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Congestion Level:</span>
                  <Badge variant={getCongestionBadgeVariant(result.congestion.badge_color)}>
                    {result.congestion.level}
                  </Badge>
                </div>
              </div>

              {/* Main Metric Cards: Wait Time & Empirical ±MAE Interval */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                {/* 1. Estimated Waiting Time */}
                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Predicted Queue Delay
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {result.predicted_wait_minutes.toFixed(1)}
                    </span>
                    <span className="text-base font-semibold text-slate-600">minutes</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    <Clock className="h-3.5 w-3.5" />
                    {formatHumanReadableWait(result.predicted_wait_seconds)}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 leading-normal">
                    Estimated duration from customer arrival until service counter intake.
                  </p>
                </div>

                {/* 2. Error Tolerance Range (Strict Academic Phrasing) */}
                <div className="rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estimated Range
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-blue-700">
                      {result.confidence_interval.lower_minutes.toFixed(1)} – {result.confidence_interval.upper_minutes.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">minutes</span>
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md">
                    Expected error tolerance: approximately &plusmn;{result.confidence_interval.mae_tolerance.toFixed(2)} minutes based on held-out test MAE.
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400 leading-tight">
                    * Derived empirically from Phase 2 held-out test evaluation (test MAE = 0.92 min), representing error tolerance on unseen operational observations.
                  </p>
                </div>
              </div>

              {/* Section 11: Feature Transparency (Collapsible) */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs mb-4">
                <button
                  type="button"
                  onClick={() => setShowFeatureTransparency(!showFeatureTransparency)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Prediction Inputs &amp; Evaluated Features
                  </span>
                  {showFeatureTransparency ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showFeatureTransparency && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Queue Length</span>
                        <p className="text-sm font-bold text-slate-900">{result.features_evaluated.queue_length} people</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Previous Queue</span>
                        <p className="text-sm font-bold text-slate-900">{result.features_evaluated.lag1_queue_length ?? 'N/A'}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Arrivals / 15 min</span>
                        <p className="text-sm font-bold text-slate-900">{result.features_evaluated.arrivals_last_15m ?? 'N/A'}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Arrivals / 30 min</span>
                        <p className="text-sm font-bold text-slate-900">{result.features_evaluated.arrivals_last_30m ?? 'N/A'}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Minutes Since Opening</span>
                        <p className="text-sm font-bold text-slate-900">{result.features_evaluated.minutes_since_opening ?? 'N/A'} min</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Active Counters</span>
                        <p className="text-sm font-bold text-slate-900">
                          {result.features_evaluated.active_counters ?? activeCounters} tellers ({result.features_evaluated.capacity_multiplier ? `${result.features_evaluated.capacity_multiplier}x` : '1.0x'})
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Complexity</span>
                        <span className="font-semibold text-slate-800">
                          {result.features_evaluated.service_type_name || 'General Queue Service'}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Multiplier: {result.features_evaluated.service_complexity_multiplier ?? 1.0}x
                      </span>
                    </div>

                    {/* Advanced Mathematical Values (sin_time, cos_time, etc.) */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedMath(!showAdvancedMath)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {showAdvancedMath ? 'Hide Advanced Mathematical Features' : 'Show Advanced Cyclical & Time Encoding Features'}
                        {showAdvancedMath ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {showAdvancedMath && (
                        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-900 text-slate-200 p-3 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">sin_time</span>
                            <span>{typeof result.features_evaluated.sin_time === 'number' ? result.features_evaluated.sin_time.toFixed(4) : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">cos_time</span>
                            <span>{typeof result.features_evaluated.cos_time === 'number' ? result.features_evaluated.cos_time.toFixed(4) : 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">hour</span>
                            <span>{result.features_evaluated.hour ?? 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">day_of_week</span>
                            <span>{result.features_evaluated.day_of_week ?? 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 10: How was this prediction generated? (Collapsible) */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    How was this prediction generated?
                  </span>
                  {showHowItWorks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showHowItWorks && (
                  <div className="p-4 text-xs text-slate-600 space-y-2.5 leading-relaxed bg-white">
                    <p>
                      The system uses a <strong>Random Forest regression model</strong> trained on historical queue observations.
                    </p>
                    <p className="font-semibold text-slate-800">Prediction-time features include:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                      <li><strong>Queue length:</strong> Current number of customers standing in line</li>
                      <li><strong>Time since opening:</strong> Minutes elapsed since 09:00 AM operating window</li>
                      <li><strong>Arrival time:</strong> Diurnal cyclical encoding (<span className="font-mono">sin_time</span>, <span className="font-mono">cos_time</span>)</li>
                      <li><strong>Day of week:</strong> Temporal pattern across the weekly cycle</li>
                      <li><strong>Previous queue length:</strong> Lag-1 autocorrelation signal</li>
                      <li><strong>Recent arrival rates:</strong> 15-minute and 30-minute rolling customer arrival counts</li>
                    </ul>
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                      <strong>Data Leakage Guardrail:</strong> Zero future information is utilized. At prediction moment, variables such as{' '}
                      <code className="text-emerald-950 font-bold">service_start_time</code> or <code className="text-emerald-950 font-bold">service_end_time</code> are unknown and strictly excluded from the feature matrix.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Model Benchmarks & Academic Defence Specifications */}
        <div className="space-y-6 lg:col-span-5">
          {/* Candidate Models Benchmark Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Candidate Models Benchmark</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                12,017 Observations
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Trained and evaluated chronologically (first 10 days train = 7,975 rows, held-out 4 days test = 4,042 rows).
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
                  {backendStatus?.all_benchmarks?.map((bm, idx) => {
                    const modelName = bm.Model || bm.model_name || `Model ${idx}`;
                    const isSelected = modelName.toLowerCase().includes('random forest');
                    const maeVal = bm.MAE ?? bm.test_mae;
                    const r2Val = bm['R²'] ?? bm.test_r2;

                    return (
                      <tr
                        key={modelName}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{modelName}</span>
                            {isSelected && (
                              <span className="rounded-md bg-blue-600 text-white text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wide">
                                Active Model
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                          {typeof maeVal === 'number' ? `${maeVal.toFixed(2)}m` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                          {typeof r2Val === 'number' ? r2Val.toFixed(4) : 'N/A'}
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

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                <span>Baseline Error Reduction: 98.4%</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                The deployed Random Forest regressor achieves a held-out test MAE of <strong>0.92 minutes</strong> and $R^2$ of <strong>0.9994</strong>, completely outperforming naive and heuristic baselines on unseen operating days.
              </p>
            </div>
          </div>

          {/* Academic Pipeline Defense Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Radio className="h-4 w-4 text-purple-600" />
              Academic Research Architecture (Viva Defence)
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-600" />
                  Target Formulation ($y$):
                </span>
                <p className="text-slate-600 mt-1 font-mono text-[11px]">
                  wait_time = (service_start_time - arrival_time) / 60
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Supervised continuous target in minutes. Evaluated strictly without lookahead bias.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Causal Inference Pipeline:
                </span>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-slate-600 text-[11px]">
                  <li>User inputs observed queue depth &amp; arrival timestamp</li>
                  <li>Django REST API performs schema validation</li>
                  <li>Causal feature matrix (10 features) constructed in memory</li>
                  <li>Pre-trained Random Forest model executes inference</li>
                  <li>Empirical &plusmn;MAE error tolerance &amp; congestion rendered</li>
                </ol>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Empirical Error Tolerance:
                </span>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                  The interval reported ([pred - MAE, pred + MAE]) represents expected prediction tolerance based on the test set MAE (0.92 min). Defensible in viva as an empirical error window rather than an uncalibrated 95% Bayesian interval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
