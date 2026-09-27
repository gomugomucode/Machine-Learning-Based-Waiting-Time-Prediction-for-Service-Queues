import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, BrainCircuit, Database, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../components/Badge';

export const Home: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs sm:p-14">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="blue">BCA 6th-Semester Major Project</Badge>
            <Badge variant="amber">Phase 1: Foundation & Data Inspection</Badge>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
            Machine Learning-Based Waiting Time Prediction for Service Queues
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            An empirical, data-driven queue analysis platform designed to forecast customer waiting times
            in high-traffic service centers. Grounded on real banking queue observations with verified
            time dynamics, queue congestion metrics, and honest machine learning boundaries.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              View Queue Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/prediction"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              Explore Prediction Interface
            </Link>

            <Link
              to="/data"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <Database className="h-4 w-4 text-emerald-600" />
              Dataset Browser
            </Link>
          </div>
        </div>
      </div>

      {/* Project Status & Principles Grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1: Current Status */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Current Phase Status</h2>
              <p className="text-xs text-slate-500">Milestone 1 Deliverables</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>12,017 Kaggle queue observations inspected & verified</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>PostgreSQL 17 database & Django ORM schema active</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Django REST Framework API with health check</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Modular React 19 + TypeScript + Vite frontend</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Empirical ML Protocol */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic & ML Rigor</h2>
              <p className="text-xs text-slate-500">No Mock / Fake AI</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            Per academic standards, we adhere to strict anti-hallucination rules:
            no hardcoded numbers, no fake prediction outcomes, and no external black-box LLM APIs.
            The ML model will be trained on empirical ground truth in Phase 2.
          </p>
          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600 border border-slate-200">
            Target: wait_time (min) = (start_time - arrival_time)
          </div>
        </div>

        {/* Card 3: Key Insights */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Dataset Telemetry</h2>
              <p className="text-xs text-slate-500">Verified Findings</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Records</span>
              <span className="font-semibold text-slate-900">12,017 rows</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Queue Length vs Wait Time</span>
              <span className="font-semibold text-emerald-600">r = 0.964 correlation</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span>Diurnal Trend (Hour)</span>
              <span className="font-semibold text-blue-600">r = 0.911 correlation</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span>Missing Values</span>
              <span className="font-semibold text-slate-900">0.0% (Clean)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Architecture Diagram */}
      <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Project Development Order (BCA Methodology)</h2>
        <p className="mt-1 text-xs text-slate-500">Systematic execution strictly adhering to academic research milestones</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Phase 1 • Done</span>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Data Inspection</h3>
            <p className="mt-1 text-xs text-slate-500">Verification of 12,017 records, column audit & leakage checks.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Phase 1 • Done</span>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Architecture & API</h3>
            <p className="mt-1 text-xs text-slate-500">Django + PostgreSQL monorepo with typed REST endpoints.</p>
          </div>
          <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-200/60">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Phase 2 • Next</span>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">ML Engineering</h3>
            <p className="mt-1 text-xs text-slate-500">Baseline models, regression algorithms & cross-validation.</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 opacity-60">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Phase 3 • Future</span>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">Defense & Docs</h3>
            <p className="mt-1 text-xs text-slate-500">Final BCA project documentation, defense slides & evaluation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
