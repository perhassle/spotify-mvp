// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Music and Content Types
export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album: Album;
  duration: number; // in seconds
  previewUrl?: string;
  streamUrl?: string;
  isExplicit: boolean;
  popularity: number;
  trackNumber?: number;
  genres: string[];
  releaseDate: Date;
  imageUrl?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  genres: string[];
  followers: number;
  isVerified: boolean;
  popularity: number;
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  releaseDate: Date;
  totalTracks: number;
  imageUrl?: string;
  genres: string[];
  tracks?: Track[];
  type: "album" | "single" | "compilation";
}

// Playlist Types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  owner: User;
  tracks: Track[];
  isPublic: boolean;
  collaborative: boolean;
  followers: number;
  createdAt: Date;
  updatedAt: Date;
}

// Music Player Types
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // current time in seconds
  duration: number; // total duration in seconds
  queue: Track[];
  currentIndex: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
  isLoading: boolean;
}

export type RepeatMode = "off" | "track" | "context";

export interface PlaybackContext {
  type: "playlist" | "album" | "artist" | "liked" | "queue";
  id?: string;
  name?: string;
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  currentView: ViewType;
  searchQuery: string;
  selectedGenre?: string;
  theme: "light" | "dark";
}

export type ViewType = 
  | "home" 
  | "search" 
  | "library" 
  | "playlist" 
  | "album" 
  | "artist" 
  | "liked-songs"
  | "recently-played"
  | "queue";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search Types
export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface SearchFilters {
  type?: "track" | "artist" | "album" | "playlist";
  genre?: string;
  year?: number;
  explicit?: boolean;
}

// Component Props Types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  type: "free" | "premium";
  status: "active" | "cancelled" | "expired";
  startDate: Date;
  endDate?: Date;
  features: SubscriptionFeature[];
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
}

// Analytics Types
export interface ListeningHistory {
  id: string;
  userId: string;
  trackId: string;
  playedAt: Date;
  duration: number; // time listened in seconds
  context?: PlaybackContext;
}

export interface UserPreferences {
  favoriteGenres: string[];
  preferredAudioQuality: "low" | "medium" | "high" | "lossless";
  autoplay: boolean;
  crossfade: boolean;
  normalizeVolume: boolean;
  showExplicitContent: boolean;
  privateSession: boolean;
}