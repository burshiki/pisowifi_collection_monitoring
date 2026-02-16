export interface MonthlyCollection {
  amount: number;
  remarks: string | null;
  confirmed_amount?: number;
  confirmed_by?: number;
  confirmed_at?: string;
  discrepancy?: number;
  auditor_remarks?: string | null;
}

export interface WifiVendo {
  id: number;
  name: string;
  remarks: string | null;
  monthly_collections: Record<string, MonthlyCollection | number>; // Support both old and new format for backwards compatibility
  created_at: string;
  updated_at: string;
}

export interface PaginatedVendos {
  data: WifiVendo[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}
