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
  version: '1.0.0',
  model_name: 'Ridge Regression',
  trained_at: '2026-09-27T21:09:21',
  training_samples: 7975,
  test_samples: 4042,
  metrics: {
    test_mae_minutes: 15.16,
    test_rmse_minutes: 19.87,
    test_r2_score: 0.9073,
  },
  all_benchmarks: [
    { model_name: 'Naive Mean Baseline', train_mae: 56.24, test_mae: 55.74, test_rmse: 65.47, test_r2: -0.0066 },
    { model_name: 'Ridge Regression', train_mae: 11.48, test_mae: 15.16, test_rmse: 19.87, test_r2: 0.9073 },
  ],
  message: 'Trained machine learning pipeline is loaded.',
});

vi.spyOn(api, 'predictWaitingTime').mockResolvedValue({
  status: 'success',
  model_name: 'Ridge Regression',
  predicted_wait_minutes: 30.7,
  confidence_interval: {
    lower_minutes: 15.5,
    upper_minutes: 45.8,
    mae_tolerance: 15.2,
  },
  congestion: {
    level: 'Moderate Wait',
    badge_color: 'blue',
  },
  features_evaluated: {
    queue_length: 25,
    arrival_time: '11:30',
    minutes_since_0900: 150,
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

    expect(screen.getByText('Waiting Time Prediction Engine')).toBeInTheDocument();
    expect(screen.getByText(/Model Online • Ridge Regression/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 2 Model Online/i)).toBeInTheDocument();
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

    const button = screen.getByRole('button', { name: /calculate predicted waiting time/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Live Model Prediction Result')).toBeInTheDocument();
    expect(screen.getByText('30.7')).toBeInTheDocument();
    expect(screen.getByText(/15.5 – 45.8/i)).toBeInTheDocument();
    expect(screen.getByText('Moderate Wait')).toBeInTheDocument();
    expect(screen.getByText(/Model Feature Vector Evaluated/i)).toBeInTheDocument();
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
