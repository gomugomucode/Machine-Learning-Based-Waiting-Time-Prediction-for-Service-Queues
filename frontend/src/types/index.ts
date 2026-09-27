export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  database: string;
}

export interface ServiceType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  observations_count?: number;
}

export interface QueueObservation {
  id: number;
  arrival_time: string;
  service_start_time: string;
  service_end_time: string;
  wait_time: number;
  service_duration: number | null;
  queue_length: number;
  service_type: number | null;
  service_type_name?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DatasetMetrics {
  avg_wait_time_minutes: number | null;
  min_wait_time_minutes: number | null;
  max_wait_time_minutes: number | null;
  avg_queue_length: number | null;
  min_queue_length: number | null;
  max_queue_length: number | null;
  earliest_arrival: string | null;
  latest_arrival: string | null;
}

export interface DatasetSummary {
  status: 'ready' | 'empty';
  total_observations: number;
  imported_datasets_count: number;
  metrics: DatasetMetrics;
}

export interface ModelBenchmark {
  model_name: string;
  train_mae: number;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
}

export interface PredictionStatus {
  status: string;
  model_connected: boolean;
  version: string;
  model_name?: string;
  trained_at?: string;
  training_samples?: number;
  test_samples?: number;
  metrics?: {
    test_mae_minutes?: number;
    test_rmse_minutes?: number;
    test_r2_score?: number;
  };
  all_benchmarks?: ModelBenchmark[];
  message: string;
}

export interface PredictionRequest {
  queue_length: number;
  arrival_time?: string;
  service_type?: number;
  active_counters?: number;
}

export interface PredictionResult {
  status: 'success' | 'error';
  model_name: string;
  predicted_wait_minutes: number;
  confidence_interval: {
    lower_minutes: number;
    upper_minutes: number;
    mae_tolerance: number;
  };
  congestion: {
    level: string;
    badge_color: 'emerald' | 'blue' | 'amber' | 'rose';
  };
  features_evaluated: {
    queue_length: number;
    active_counters?: number;
    arrival_time: string;
    minutes_since_0900: number;
    capacity_multiplier?: number;
  };
}

export interface AnalyticsSummary {
  avg_wait_minutes: number;
  min_wait_minutes: number;
  max_wait_minutes: number;
  avg_service_minutes: number;
  avg_queue_length: number;
  max_queue_length: number;
}

export interface AnalyticsOverview {
  has_data: boolean;
  total_observations: number;
  summary: AnalyticsSummary;
}

export interface HourlyAnalyticsItem {
  hour: number;
  label: string;
  observations: number;
  avg_wait_minutes: number;
  avg_queue_length: number;
}
