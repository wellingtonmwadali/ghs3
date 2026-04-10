import api from './api';
import type { Car, CarFilters, ApiResponse, Invoice } from '@/types';

// ── Fetch ──

export async function fetchJobCards(filters?: CarFilters & { page?: number; limit?: number }) {
  const params: Record<string, string | number | boolean> = {};
  if (filters?.stage) params.stage = filters.stage;
  if (filters?.serviceType) params.serviceType = filters.serviceType;
  if (filters?.assignedMechanicId) params.assignedMechanicId = filters.assignedMechanicId;
  if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
  if (filters?.jobType) params.jobType = filters.jobType;
  if (filters?.priority) params.priority = filters.priority;
  if (filters?.isPaused !== undefined) params.isPaused = filters.isPaused;
  if (filters?.bayNumber) params.bayNumber = filters.bayNumber;
  if (filters?.search) params.search = filters.search;
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;

  const { data } = await api.get<ApiResponse<{ cars: Car[]; pagination: { page: number; limit: number; total: number; pages: number } }>>('/cars', { params });
  return data.data;
}

export async function fetchJobCard(id: string) {
  const { data } = await api.get<ApiResponse<Car>>(`/cars/${id}`);
  return data.data;
}

export async function fetchDashboardStats() {
  const { data } = await api.get<ApiResponse<any>>('/cars/dashboard');
  return data.data;
}

export async function fetchGarageBoard() {
  const { data } = await api.get<ApiResponse<any>>('/cars/garage-board');
  return data.data;
}

// ── Create / Update / Delete ──

export async function createJobCard(carData: Partial<Car>) {
  const { data } = await api.post<ApiResponse<Car>>('/cars', carData);
  return data.data;
}

export async function updateJobCard(id: string, updateData: Partial<Car>) {
  const { data } = await api.put<ApiResponse<Car>>(`/cars/${id}`, updateData);
  return data.data;
}

export async function deleteJobCard(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/cars/${id}`);
  return data;
}

// ── Workflow Actions ──

export async function pauseJobCard(id: string, reason: string) {
  const { data } = await api.post<ApiResponse<Car>>(`/cars/${id}/pause`, { reason });
  return data.data;
}

export async function resumeJobCard(id: string) {
  const { data } = await api.post<ApiResponse<Car>>(`/cars/${id}/resume`);
  return data.data;
}

export async function approveJobCard(id: string, notes?: string) {
  const { data } = await api.post<ApiResponse<Car>>(`/cars/${id}/approve`, { notes });
  return data.data;
}

export async function rejectJobCard(id: string, notes?: string) {
  const { data } = await api.post<ApiResponse<Car>>(`/cars/${id}/reject`, { notes });
  return data.data;
}

export async function generateInvoiceFromJobCard(carId: string) {
  const { data } = await api.post<ApiResponse<Invoice>>(`/invoices/generate-from-car/${carId}`);
  return data.data;
}
