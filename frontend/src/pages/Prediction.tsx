import React, { useState, useEffect } from 'react';
import { BrainCircuit, Info, Sliders, Clock, Users, Layers, ShieldAlert } from 'lucide-react';
import { getServiceTypes } from '../services/api';
import type { ServiceType } from '../types';
import { Badge } from '../components/Badge';

export const Prediction: React.FC = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [queueLength, setQueueLength] = useState<number>(25);
  const [selectedService, setSelectedService] = useState<string>('');
  const [activeCounters, setActiveCounters] = useState<number>(4);
  const [arrivalTime, setArrivalTime] = useState<string>('11:30');
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

  useEffect(() => {
    getServiceTypes()
      .then((data) => {
        setServiceTypes(data);
        if (data.length > 0) {
          setSelectedService(String(data[0].id));
        }
      })
      .catch((err) => console.error('Error fetching service types:', err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title & Status */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Waiting Time Prediction Engine
          </h1>
          <Badge variant="amber">Model Not Yet Connected</Badge>
          <Badge variant="gray">Phase 1 Foundation</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Inference interface specification for service queue waiting time forecasting.
        </p>
      </div>

      {/* Prominent Architectural Warning Banner */}
      <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50/70 p-6 text-amber-900 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-200/60 p-2 text-amber-800">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-amber-950">
              Prediction module — model not yet connected
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-amber-800 leading-relaxed">
              In accordance with scientific and academic engineering rules,{' '}
              <strong>no fake prediction results or mock heuristics are displayed</strong>.
              The prediction model will be systematically trained, cross-validated, and deployed in Phase 2
              only after target formulation and feature engineering are finalized.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Input Form (2 cols) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Queue Operational Inputs</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input 1: Queue Length */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="queue-length" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  Observed Queue Length (People in Line)
                </label>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {queueLength} people
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
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0 (Empty line)</span>
                <span>150 (Moderate)</span>
                <span>300 (Severe peak)</span>
              </div>
            </div>

            {/* Input 2: Time of Day */}
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
                <p className="mt-1 text-[11px] text-slate-500">Peak operating window: 09:00 – 17:00</p>
              </div>

              {/* Input 3: Service Type */}
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
                    <option value="">General Queue (Default)</option>
                  )}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">Loaded dynamically from Django API</p>
              </div>
            </div>

            {/* Input 4: Active Counters */}
            <div>
              <label htmlFor="active-counters" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                <Users className="h-4 w-4 text-slate-400" />
                Active Open Counters / Tellers
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
                Note: Kaggle dataset does not record active counters (NOT AVAILABLE IN DATASET); supported here for production extensibility.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                <BrainCircuit className="h-4 w-4 text-purple-400" />
                Request Estimated Waiting Time
              </button>

              {submitAttempted && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Inference Denied (Architectural Protocol)</p>
                    <p className="mt-1 text-blue-800">
                      Prediction service returned HTTP 503 (Model Unavailable).
                      No synthetic prediction was computed. The model will be trained on the 12,017 verified
                      records in Phase 2 using scikit-learn regressors.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Model Blueprint (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              Phase 2 ML Pipeline Blueprint
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Target Variable (Y):</span>
                <p className="text-slate-600 mt-0.5 font-mono text-[11px]">wait_time (continuous minutes)</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Primary Features (X):</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                  <li>queue_length (r = 0.964)</li>
                  <li>hour_of_arrival (r = 0.911)</li>
                  <li>day_of_week (categorical)</li>
                  <li>rolling_service_rate (derived)</li>
                </ul>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Candidate Algorithms:</span>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Linear Regression (Baseline), Ridge, Random Forest Regressor, Gradient Boosting.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                <span className="font-bold text-slate-800">Target Metrics:</span>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Mean Absolute Error (MAE), RMSE, R-Squared.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
