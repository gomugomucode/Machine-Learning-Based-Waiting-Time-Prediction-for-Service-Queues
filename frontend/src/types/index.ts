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

export interface PredictionStatus {
  status: string;
  model_connected: boolean;
  version: string;
  message: string;
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
