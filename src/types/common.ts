// Common type definitions to replace 'any' types across the project

// Error types
export type ApiError = Error | { message: string; code?: string; status?: number };
export type UnknownError = unknown;

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

// React event handler types
export type ChangeHandler = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type SubmitHandler = React.FormEvent<HTMLFormElement>;
export type ClickHandler = React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>;
export type FocusHandler = React.FocusEvent<HTMLElement>;
export type KeyboardHandler = React.KeyboardEvent<HTMLElement>;

// DOM event types
export type DOMClickHandler = (event: MouseEvent) => void;
export type DOMKeyboardHandler = (event: KeyboardEvent) => void;

// Monitoring and metrics types
export interface Metric {
  name: string;
  value: number;
  timestamp?: number;
  tags?: Record<string, string | number>;
  unit?: string;
}

export interface WebVital {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  [key: string]: unknown;
}

// Stripe types
export interface StripeCustomer {
  id: string;
  email?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: {
    data: Array<{
      price: {
        id: string;
        product: string;
      };
    }>;
  };
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
}

// Generic types
export type AsyncFunction<T = void> = () => Promise<T>;
export type VoidFunction = () => void;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Object types
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;
export type AnyRecord = Record<string, unknown>;

// Array types
export type StringArray = string[];
export type NumberArray = number[];

// Utility types for components
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface WithLoading {
  isLoading?: boolean;
  error?: Error | null;
}

// Form types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched?: boolean;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}