import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prediction } from '../pages/Prediction';
import * as api from '../services/api';
import { PredictionError } from '../services/predictionApi';
import type { BackendStatus, PredictionResponse, ServiceType } from '../types';

const mockServiceTypes: ServiceType[] = [
  { id: 1, name: 'Cash Transactions', description: 'Deposits and withdrawals', created_at: '2026-09-27' },
  { id: 2, name: 'Loan Operations', description: 'Credit review and underwriting', created_at: '2026-09-27' },
];

const mockOnlineStatus: BackendStatus = {
  status: 'online',
  model_connected: true,
  version: 'phase2-best-model',
  model: 'Random Forest Regressor',
  model_name: 'Random Forest Regressor',
  model_file: 'best_waiting_time_model.joblib',
  metrics: {
    test_mae_minutes: 0.9166,
    test_rmse_minutes: 1.7678,
    test_r2_score: 0.9994,
  },
  features: [
    'queue_length',
    'minutes_since_opening',
    'hour',
    'minute',
    'day_of_week',
    'sin_time',
    'cos_time',
    'lag1_queue_length',
    'arrivals_last_15m',
    'arrivals_last_30m',
  ],
  all_benchmarks: [
    { Model: 'Random Forest', Type: 'Machine Learning', MAE: 0.92, RMSE: 1.77, 'R²': 0.9994 },
    { Model: 'Gradient Boosting', Type: 'Machine Learning', MAE: 2.79, RMSE: 4.14, 'R²': 0.9965 },
  ],
  message: 'Trained Phase 2 Random Forest Regressor is loaded and ready for real-time inference.',
};

const mockPredictionResponse: PredictionResponse = {
  status: 'success',
  predicted_wait_minutes: 31.02,
  predicted_wait_seconds: 1861,
  model: 'Random Forest Regressor',
  model_name: 'Random Forest Regressor',
  model_version: 'phase2-best-model',
  confidence_interval: {
    lower_minutes: 30.1,
    upper_minutes: 31.93,
    mae_tolerance: 0.92,
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
};

describe('Prediction Page Real-Time Integration & User Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getServiceTypes').mockResolvedValue(mockServiceTypes);
    vi.spyOn(api, 'getPredictionStatus').mockResolvedValue(mockOnlineStatus);
    vi.spyOn(api, 'predictWaitingTime').mockResolvedValue(mockPredictionResponse);
  });

  // Test 1: Prediction form renders all required inputs
  it('1. renders prediction form with all operational input fields and initial state', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Waiting-Time Prediction Engine')).toBeInTheDocument();
    expect(screen.getByLabelText(/^queue length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arrival date & time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous queue length/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arrivals \(last 15 min\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arrivals \(last 30 min\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active open counters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /predict waiting time/i })).toBeInTheDocument();
  });

  // Test 2: Queue length validation works (rejects negative numbers and displays message)
  it('2. validates queue length and prevents submission on negative or invalid value', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const queueInput = screen.getByLabelText(/^queue length/i);
    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });

    // Enter negative value
    await act(async () => {
      fireEvent.change(queueInput, { target: { value: '-5' } });
      fireEvent.click(submitButton);
    });

    expect(screen.getByText(/queue length cannot be negative/i)).toBeInTheDocument();
    expect(api.predictWaitingTime).not.toHaveBeenCalled();

    // Enter empty value
    await act(async () => {
      fireEvent.change(queueInput, { target: { value: '' } });
      fireEvent.click(submitButton);
    });

    expect(screen.getByText(/queue length is required/i)).toBeInTheDocument();
  });

  // Test 3: Predict button triggers API request with valid payload
  it('3. triggers API request with correctly formatted ISO timestamp and payload', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const queueInput = screen.getByLabelText(/^queue length/i);
    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });

    await act(async () => {
      fireEvent.change(queueInput, { target: { value: '30' } });
      fireEvent.click(submitButton);
    });

    expect(api.predictWaitingTime).toHaveBeenCalledTimes(1);
    expect(api.predictWaitingTime).toHaveBeenCalledWith(
      expect.objectContaining({
        queue_length: 30,
        active_counters: 4,
      })
    );
  });

  // Test 4: Successful response renders predicted waiting time (decimal and human readable)
  it('4. renders predicted waiting time prominently with human readable format', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Estimated Waiting Time')).toBeInTheDocument();
    expect(screen.getByText('31.0')).toBeInTheDocument();
    expect(screen.getByText('Approximately 31 min 1 sec')).toBeInTheDocument();
  });

  // Test 5: Error range renders with empirical ±MAE phrasing, confirming NO "95% confidence interval" text
  it('5. renders empirical error tolerance interval and explicitly avoids calling it a 95% confidence interval', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText(/30.1 – 31.9/i)).toBeInTheDocument();
    expect(
      screen.getByText(/expected error tolerance: approximately ±0.92 minutes based on held-out test mae/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/95% confidence interval/i)).not.toBeInTheDocument();
  });

  // Test 6: Congestion status renders from backend response
  it('6. renders backend congestion status and badge color accurately', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Moderate Wait')).toBeInTheDocument();
  });

  // Test 7: Loading state renders and button is disabled during submission
  it('7. displays loading state "Analyzing queue..." while waiting for inference response', async () => {
    let resolvePrediction: (val: PredictionResponse) => void;
    vi.spyOn(api, 'predictWaitingTime').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePrediction = resolve;
        })
    );

    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Check loading indicator on button
    expect(screen.getByRole('button', { name: /analyzing queue/i })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolvePrediction!(mockPredictionResponse);
    });

    expect(screen.getByText('Estimated Waiting Time')).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  // Test 8: API 400 error renders cleanly
  it('8. renders backend HTTP 400 validation error without crashing', async () => {
    vi.spyOn(api, 'predictWaitingTime').mockRejectedValue(
      new PredictionError('queue_length must be a non-negative integer.', { status: 400 })
    );

    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/queue_length must be a non-negative integer/i)).toBeInTheDocument();
  });

  // Test 9: Network failure renders graceful connection error
  it('9. renders friendly connection failure message when backend server is offline', async () => {
    vi.spyOn(api, 'predictWaitingTime').mockRejectedValue(
      new PredictionError('Unable to connect to the prediction server. Make sure the Django backend is running.', {
        isNetworkError: true,
      })
    );

    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const submitButton = screen.getByRole('button', { name: /predict waiting time/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/network connection failure/i)).toBeInTheDocument();
    expect(screen.getByText(/unable to connect to the prediction server/i)).toBeInTheDocument();
  });

  // Test 10: Backend status handles both online indicator and offline fallback gracefully
  it('10. handles both online status and offline status fallback gracefully', async () => {
    // 10a. Online
    const { unmount } = render(
      <BrowserRouter>
        <Prediction />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('● Prediction engine online')).toBeInTheDocument();
    });
    unmount();

    // 10b. Offline fallback
    vi.spyOn(api, 'getPredictionStatus').mockResolvedValue({
      status: 'offline',
      model_connected: false,
      version: '0.0.0-uninitialized',
      message: 'Prediction model not loaded.',
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Prediction engine unavailable')).toBeInTheDocument();
  });
});
