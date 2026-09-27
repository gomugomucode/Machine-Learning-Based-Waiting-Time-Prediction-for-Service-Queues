import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Home, LayoutDashboard, Table, BrainCircuit, Activity } from 'lucide-react';
import { getHealth } from '../services/api';
import type { HealthStatus } from '../types';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', service: 'offline', database: 'disconnected' }));
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Data', path: '/data', icon: Table },
    { name: 'Prediction', path: '/prediction', icon: BrainCircuit },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              QueueWait AI
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              BCA 6th Sem • Queue Waiting Time Prediction
            </p>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Health status badge */}
        <div className="flex items-center gap-3">
          {health?.status === 'ok' ? (
            <Badge variant="green">
              API & DB Online
            </Badge>
          ) : health?.status === 'degraded' ? (
            <Badge variant="amber">
              DB Degraded
            </Badge>
          ) : (
            <Badge variant="red">
              Backend Offline
            </Badge>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Activity className="h-3 w-3 text-slate-400" />
            <span>v1.0.0-foundation</span>
          </div>
        </div>
      </div>
    </header>
  );
};
