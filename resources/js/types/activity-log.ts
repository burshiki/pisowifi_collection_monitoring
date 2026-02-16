import type { User } from './user';

export interface ActivityLog {
  id: number;
  user_id: number | null;
  user?: User;
  log_name: string | null;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  event: string | null;
  properties: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedActivityLogs {
  data: ActivityLog[];
  current_page: number;
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ActivityLogFilters {
  user_id?: number;
  log_name?: string;
  event?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}
