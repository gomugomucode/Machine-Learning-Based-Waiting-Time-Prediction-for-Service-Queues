import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div>
          <p className="font-medium text-slate-700">
            Machine Learning-Based Waiting Time Prediction for Service Queues
          </p>
          <p className="text-slate-400 mt-0.5">
            BCA 6th-Semester Major Project • Powered by Django REST Framework, PostgreSQL & React
          </p>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Phase 1: Architecture & Dataset Grounding</span>
          <span>•</span>
          <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-sm">ML Model Offline (No Fake AI)</span>
        </div>
      </div>
    </footer>
  );
};
