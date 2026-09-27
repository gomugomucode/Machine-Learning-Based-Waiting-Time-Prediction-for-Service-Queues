import axios from 'axios';
import type {
  HealthStatus,
  ServiceType,
  QueueObservation,
  PaginatedResponse,
  DatasetSummary,
  PredictionStatus,
  PredictionRequest,
  PredictionResult,
  AnalyticsOverview,
  HourlyAnalyticsItem,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getHealth = async (): Promise<HealthStatus> => {
  const response = await apiClient.get<HealthStatus>('/health/');
  return response.data;
};

export const getServiceTypes = async (): Promise<ServiceType[]> => {
  const response = await apiClient.get<PaginatedResponse<ServiceType> | ServiceType[]>('/service-types/');
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.results || [];
};

export interface ObservationQueryParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  service_type?: number;
}

export const getQueueObservations = async (
  params?: ObservationQueryParams
): Promise<PaginatedResponse<QueueObservation>> => {
  const response = await apiClient.get<PaginatedResponse<QueueObservation>>('/queue-observations/', {
    params,
  });
  return response.data;
};

export const getQueueObservationById = async (id: number): Promise<QueueObservation> => {
  const response = await apiClient.get<QueueObservation>(`/queue-observations/${id}/`);
  return response.data;
};

export const getDatasetSummary = async (): Promise<DatasetSummary> => {
  const response = await apiClient.get<DatasetSummary>('/datasets/summary/');
  return response.data;
};

export const getPredictionStatus = async (): Promise<PredictionStatus> => {
  const response = await apiClient.get<PredictionStatus>('/predictions/status/');
  return response.data;
};

export const predictWaitingTime = async (data: PredictionRequest): Promise<PredictionResult> => {
  const response = await apiClient.post<PredictionResult>('/predictions/predict/', data);
  return response.data;
};

export const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  const response = await apiClient.get<AnalyticsOverview>('/analytics/overview/');
  return response.data;
};

export const getHourlyAnalytics = async (): Promise<HourlyAnalyticsItem[]> => {
  const response = await apiClient.get<HourlyAnalyticsItem[]>('/analytics/hourly/');
  return response.data;
};

export default apiClient;
