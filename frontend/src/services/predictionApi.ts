import axios, { AxiosError } from 'axios';
import type {
  PredictionRequest,
  PredictionResponse,
  ConfidenceInterval,
  CongestionInfo,
  EvaluatedFeatures,
  PredictionApiError,
  BackendStatus,
  PredictionResult,
  PredictionStatus,
} from '../types';

// Re-export types for consumers importing from predictionApi
export type {
  PredictionRequest,
  PredictionResponse,
  ConfidenceInterval,
  CongestionInfo,
  EvaluatedFeatures,
  PredictionApiError,
  BackendStatus,
  PredictionResult,
  PredictionStatus,
};

/**
 * Normalizes the API base URL to ensure proper endpoint routing
 * whether configured as 'http://127.0.0.1:8000' or 'http://127.0.0.1:8000/api'.
 */
const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Structured Application Error for Waiting Time Prediction operations.
 */
export class PredictionError extends Error {
  public status?: number;
  public isNetworkError: boolean;
  public detail?: string;
  public apiError: PredictionApiError;

  constructor(message: string, options?: { status?: number; isNetworkError?: boolean; detail?: string }) {
    super(message);
    this.name = 'PredictionError';
    this.status = options?.status;
    this.isNetworkError = options?.isNetworkError ?? false;
    this.detail = options?.detail;
    this.apiError = {
      error: message,
      detail: options?.detail,
      status: options?.status,
      isNetworkError: this.isNetworkError,
    };
  }
}

/**
 * Converts caught Axios or runtime errors into a human-friendly PredictionError.
 */
export const parseApiError = (error: unknown): PredictionError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; detail?: string; message?: string }>;
    
    // 1. Network Failure / Connection Refused
    if (!axiosError.response) {
      return new PredictionError(
        'Unable to connect to the prediction server. Make sure the Django backend is running.',
        { isNetworkError: true }
      );
    }

    const statusCode = axiosError.response.status;
    const responseData = axiosError.response.data;
    const backendMessage = responseData?.error || responseData?.detail || responseData?.message;

    // 2. Specific HTTP status handling
    if (statusCode === 400) {
      return new PredictionError(
        backendMessage || 'Invalid prediction input. Please verify the queue parameters.',
        { status: 400, detail: responseData?.detail }
      );
    }

    if (statusCode === 503) {
      return new PredictionError(
        backendMessage || 'Prediction model is currently offline or uninitialized on the server.',
        { status: 503, detail: responseData?.detail }
      );
    }

    if (statusCode >= 500) {
      return new PredictionError(
        backendMessage || 'The prediction service encountered an internal error. Please try again.',
        { status: statusCode, detail: responseData?.detail }
      );
    }

    return new PredictionError(
      backendMessage || `Request failed with status ${statusCode}.`,
      { status: statusCode, detail: responseData?.detail }
    );
  }

  if (error instanceof Error) {
    return new PredictionError(error.message);
  }

  return new PredictionError('An unexpected error occurred during prediction.');
};

/**
 * Fetches the current operational and validation status of the ML prediction engine.
 */
export const getPredictionStatus = async (): Promise<BackendStatus> => {
  try {
    const response = await apiClient.get<BackendStatus>('/predictions/status/');
    return response.data;
  } catch (err: unknown) {
    throw parseApiError(err);
  }
};

/**
 * Sends real-time queue state features to the Django inference API
 * and returns the validated waiting-time prediction response.
 */
export const predictWaitingTime = async (data: PredictionRequest): Promise<PredictionResponse> => {
  try {
    const response = await apiClient.post<PredictionResponse>('/predictions/predict/', data);
    return response.data;
  } catch (err: unknown) {
    throw parseApiError(err);
  }
};

export default {
  getPredictionStatus,
  predictWaitingTime,
  parseApiError,
};
