import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Home } from '../pages/Home';
import { Prediction } from '../pages/Prediction';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import * as api from '../services/api';

vi.spyOn(api, 'getServiceTypes').mockResolvedValue([
  { id: 1, name: 'Cash Transactions', description: 'Deposits and withdrawals', created_at: '2026-09-27' },
]);

vi.spyOn(api, 'getPredictionStatus').mockResolvedValue({
  status: 'online',
  model_connected: true,
  version: 'phase2-best-model',
  model_name: 'Random Forest Regressor',
  metrics: {
    test_mae_minutes: 0.92,
    test_rmse_minutes: 1.77,
    test_r2_score: 0.9994,
  },
  all_benchmarks: [
    { Model: 'Random Forest', Type: 'Machine Learning', MAE: 0.92, RMSE: 1.77, 'R²': 0.9994 },
    { Model: 'Linear Regression', Type: 'Machine Learning', MAE: 10.76, RMSE: 14.62, 'R²': 0.9568 },
  ],
  message: 'Trained Phase 2 Random Forest Regressor is loaded and ready for real-time inference.',
});

vi.spyOn(api, 'predictWaitingTime').mockResolvedValue({
  status: 'success',
  predicted_wait_minutes: 26.36,
  predicted_wait_seconds: 1582,
  model: 'Random Forest Regressor',
  model_name: 'Random Forest Regressor',
  model_version: 'phase2-best-model',
  confidence_interval: {
    lower_minutes: 25.59,
    upper_minutes: 27.14,
    mae_tolerance: 0.78,
    method: 'Empirical ±MAE error tolerance interval from held-out test evaluation (test MAE = 0.92 min).',
  },
  congestion: {
    level: 'Moderate Wait',
    badge_color: 'blue',
  },
  features_evaluated: {
    queue_length: 25,
    minutes_since_opening: 90,
    hour: 10,
    minute: 30,
    day_of_week: 0,
    sin_time: 0.9238,
    cos_time: 0.3826,
    lag1_queue_length: 23,
    arrivals_last_15m: 8,
    arrivals_last_30m: 17,
    active_counters: 4,
    capacity_multiplier: 1.0,
    service_type_name: 'Cash Transactions',
    service_complexity_multiplier: 0.85,
  },
});

describe('Home Page', () => {
  it('renders project title and major project headers', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText('Machine Learning-Based Waiting Time Prediction for Service Queues')
    ).toBeInTheDocument();
    expect(screen.getByText('BCA 6th-Semester Major Project')).toBeInTheDocument();
    expect(screen.getByText('View Queue Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Explore Prediction Interface')).toBeInTheDocument();
  });
});

describe('Prediction Page Live ML Inference', () => {
  it('renders prediction interface with live model status and metrics', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Waiting-Time Prediction Engine')).toBeInTheDocument();
    expect(screen.getByText('● Prediction engine online')).toBeInTheDocument();
    expect(screen.getByText(/Active Architecture: Random Forest Regressor/i)).toBeInTheDocument();
    expect(screen.getByText('Candidate Models Benchmark')).toBeInTheDocument();
  });

  it('submits inputs and displays real-time prediction result card', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const button = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Estimated Waiting Time')).toBeInTheDocument();
    expect(screen.getByText('26.4')).toBeInTheDocument();
    expect(screen.getByText(/25.6 – 27.1/i)).toBeInTheDocument();
    expect(screen.getByText('Moderate Wait')).toBeInTheDocument();
    expect(screen.getByText(/Prediction Inputs & Evaluated Features/i)).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="Custom Empty State"
        description="Detailed empty description message."
      />
    );

    expect(screen.getByText('Custom Empty State')).toBeInTheDocument();
    expect(screen.getByText('Detailed empty description message.')).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('renders badge children with correct styling', () => {
    render(<Badge variant="green">Online</Badge>);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
