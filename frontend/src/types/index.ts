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

export interface BenchmarkItem {
  Model?: string;
  model_name?: string;
  Type?: string;
  MAE?: number;
  test_mae?: number;
  train_mae?: number;
  RMSE?: number;
  test_rmse?: number;
  'R²'?: number;
  test_r2?: number;
}

export interface BackendStatus {
  status: string;
  model_connected: boolean;
  version: string;
  model?: string;
  model_name?: string;
  model_file?: string;
  metrics?: {
    test_mae_minutes?: number;
    test_rmse_minutes?: number;
    test_r2_score?: number;
  };
  features?: string[];
  all_benchmarks?: BenchmarkItem[];
  message?: string;
}

export type PredictionStatus = BackendStatus;

export interface PredictionRequest {
  queue_length: number;
  arrival_time?: string;
  lag1_queue_length?: number;
  arrivals_last_15m?: number;
  arrivals_last_30m?: number;
  active_counters?: number;
  service_type?: number;
}

export interface ConfidenceInterval {
  lower_minutes: number;
  upper_minutes: number;
  mae_tolerance: number;
  method?: string;
}

export interface CongestionInfo {
  level: string;
  badge_color: 'emerald' | 'blue' | 'amber' | 'rose' | string;
}

export interface EvaluatedFeatures {
  queue_length: number;
  minutes_since_opening?: number;
  hour?: number;
  minute?: number;
  day_of_week?: number;
  sin_time?: number;
  cos_time?: number;
  lag1_queue_length?: number;
  arrivals_last_15m?: number;
  arrivals_last_30m?: number;
  active_counters?: number;
  capacity_multiplier?: number;
  service_type_name?: string;
  service_complexity_multiplier?: number;
  arrival_time?: string;
  minutes_since_0900?: number;
  [key: string]: unknown;
}

export interface PredictionResponse {
  status: 'success' | 'error' | string;
  predicted_wait_minutes: number;
  predicted_wait_seconds: number;
  model?: string;
  model_name: string;
  model_version?: string;
  confidence_interval: ConfidenceInterval;
  congestion: CongestionInfo;
  features_evaluated: EvaluatedFeatures;
}

export type PredictionResult = PredictionResponse;

export interface PredictionApiError {
  error: string;
  detail?: string;
  status?: number;
  isNetworkError?: boolean;
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
