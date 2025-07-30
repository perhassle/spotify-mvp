// User and Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isPremium: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionTier = 'free' | 'premium' | 'family' | 'student';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'expired';

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
  tracks: PlaylistTrack[];
  isPublic: boolean;
  collaborative: boolean;
  followers: number;
  totalDuration: number; // in seconds
  trackCount: number;
  tags: string[];
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
  playCount: number;
  shareUrl?: string;
  isSmartPlaylist: boolean;
  smartPlaylistCriteria?: SmartPlaylistCriteria;
}

export interface PlaylistTrack {
  id: string;
  track: Track;
  addedAt: Date;
  addedBy: User;
  position: number;
  isLocal?: boolean;
}

export interface PlaylistFolder {
  id: string;
  name: string;
  userId: string;
  playlists: Playlist[];
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistCreateRequest {
  name: string;
  description?: string;
  isPublic: boolean;
  collaborative: boolean;
  imageFile?: File;
  folderId?: string;
  tags?: string[];
  templateId?: string;
}

export interface PlaylistUpdateRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  collaborative?: boolean;
  imageFile?: File;
  folderId?: string | null;
  tags?: string[];
}

export interface PlaylistTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  tags: string[];
  defaultTracks?: string[]; // Track IDs
  isPublic: boolean;
}

export interface SmartPlaylistCriteria {
  genre?: string[];
  artist?: string[];
  minYear?: number;
  maxYear?: number;
  minDuration?: number;
  maxDuration?: number;
  minPopularity?: number;
  isExplicit?: boolean;
  recentlyPlayed?: boolean;
  liked?: boolean;
  maxTracks?: number;
  sortBy?: 'popularity' | 'release_date' | 'recently_played' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  autoUpdate?: boolean;
}

export interface PlaylistShareSettings {
  shareUrl: string;
  allowCollaborators: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
  expiresAt?: Date;
  password?: string;
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
  // New advanced features
  playbackRate: number;
  crossfadeDuration: number;
  isEqualizerEnabled: boolean;
  equalizerPreset: string;
  isVisualizerEnabled: boolean;
  audioQuality: 'low' | 'medium' | 'high' | 'lossless';
  skipCount: number;
  maxSkips: number;
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
  | "queue"
  | "playlists"
  | "create-playlist";

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
  totalResults: number;
}

export interface SearchFilters {
  type?: "all" | "track" | "artist" | "album" | "playlist";
  genre?: string;
  year?: number;
  explicit?: boolean;
  sortBy?: "relevance" | "popularity" | "release_date" | "alphabetical";
  sortOrder?: "asc" | "desc";
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResults | null;
  isLoading: boolean;
  error: string | null;
  suggestions: string[];
  history: SearchHistoryItem[];
  selectedResultType: "all" | "track" | "artist" | "album" | "playlist";
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilters;
}

export interface SearchSuggestion {
  text: string;
  type: "query" | "artist" | "track" | "album";
  popularity?: number;
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
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  features: SubscriptionFeature[];
  paymentMethod?: PaymentMethod;
  nextBillingDate?: Date;
  billingPeriod: 'monthly' | 'yearly';
  price: number;
  currency: string;
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  usage?: number;
  resetPeriod?: 'hourly' | 'daily' | 'monthly';
  lastReset?: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  lastFourDigits?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// Usage Tracking Types
export interface SkipTracker {
  userId: string;
  skipCount: number;
  hourlyLimit: number;
  lastSkipTime: Date;
  resetTime: Date;
}

export interface AdConfiguration {
  frequency: number; // Every X songs
  minDuration: number; // Minimum ad duration in seconds
  maxDuration: number; // Maximum ad duration in seconds
  skipableAfter?: number; // Seconds after which ad can be skipped
}

export interface MockAd {
  id: string;
  title: string;
  advertiser: string;
  duration: number;
  audioUrl: string;
  imageUrl?: string;
  clickUrl?: string;
  skipable: boolean;
  skipableAfter?: number;
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

// Premium Feature Types
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier[];
  enabled: boolean;
  category: 'playback' | 'quality' | 'social' | 'offline' | 'customization';
}

export interface FeatureGate {
  featureId: string;
  requiredTier: SubscriptionTier;
  fallbackBehavior?: 'disable' | 'downgrade' | 'prompt';
  upgradePrompt?: {
    title: string;
    description: string;
    ctaText: string;
  };
}

// Offline Download Types (Mock Implementation)
export interface OfflineTrack {
  trackId: string;
  downloadedAt: Date;
  quality: 'low' | 'medium' | 'high';
  size: number; // in bytes
  expiresAt?: Date;
}

export interface OfflinePlaylist {
  playlistId: string;
  tracks: OfflineTrack[];
  lastSyncAt: Date;
  autoDownload: boolean;
}

// Stripe-specific Types
export interface StripeSubscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StripeCustomer {
  id: string;
  userId: string;
  email: string;
  name?: string;
  defaultPaymentMethodId?: string;
  billingAddress?: BillingAddress;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethodDetails {
  id: string;
  type: 'card' | 'paypal' | 'us_bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: string;
  };
  billingDetails: {
    name?: string;
    email?: string;
    address?: BillingAddress;
  };
  isDefault: boolean;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly?: PricingTier;
    yearly?: PricingTier;
  };
  popular?: boolean;
  studentEligible?: boolean;
  trialDays: number;
}

export interface PricingTier {
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  discountPercentage?: number;
  originalAmount?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  validFrom: Date;
  validUntil?: Date;
  applicableTiers: SubscriptionTier[];
  firstTimeOnly: boolean;
  active: boolean;
}

export interface CheckoutSession {
  id: string;
  userId: string;
  subscriptionTier: SubscriptionTier;
  billingPeriod: 'monthly' | 'yearly';
  priceId: string;
  amount: number;
  currency: string;
  taxAmount?: number;
  discountAmount?: number;
  promoCode?: string;
  paymentMethodTypes: string[];
  billingAddress?: BillingAddress;
  status: 'open' | 'complete' | 'expired';
  successUrl: string;
  cancelUrl: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: Date;
  paidAt?: Date;
  description: string;
  lineItems: InvoiceLineItem[];
  tax?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
  period: {
    start: Date;
    end: Date;
  };
  proration: boolean;
}

export interface SubscriptionUsage {
  userId: string;
  subscriptionId: string;
  period: {
    start: Date;
    end: Date;
  };
  features: {
    [featureId: string]: {
      limit: number;
      used: number;
      unlimited: boolean;
    };
  };
  lastUpdated: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  paymentMethodId?: string;
  customerId: string;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export interface SubscriptionChangePlan {
  currentTier: SubscriptionTier;
  targetTier: SubscriptionTier;
  currentPriceId: string;
  targetPriceId: string;
  prorationAmount: number;
  effectiveDate: Date;
  changeType: 'upgrade' | 'downgrade' | 'billing_cycle_change';
}

export interface FamilyMember {
  id: string;
  familySubscriptionId: string;
  userId: string;
  role: 'owner' | 'member';
  inviteEmail?: string;
  inviteStatus: 'pending' | 'accepted' | 'declined';
  joinedAt?: Date;
  invitedAt: Date;
  permissions: {
    manageFamily: boolean;
    viewBilling: boolean;
  };
}

export interface GiftSubscription {
  id: string;
  gifterId: string;
  recipientEmail: string;
  recipientUserId?: string;
  subscriptionTier: SubscriptionTier;
  duration: number; // in months
  message?: string;
  status: 'pending' | 'redeemed' | 'expired';
  purchasedAt: Date;
  redeemedAt?: Date;
  expiresAt: Date;
  giftCode: string;
}

export interface RetentionOffer {
  id: string;
  type: 'discount' | 'free_months' | 'feature_unlock';
  title: string;
  description: string;
  discountPercentage?: number;
  freeMonths?: number;
  features?: string[];
  validFor: number; // days
  usageLimit: number;
  currentUsage: number;
  active: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface DowngradeOptions {
  retentionOffers: RetentionOffer[];
  feedback: {
    reasons: string[];
    customReason?: string;
    rating?: number;
  };
  effectiveDate: Date;
  dataRetentionPeriod: number; // days
}

// Recommendation Engine Types
export interface UserBehavior {
  id: string;
  userId: string;
  trackId: string;
  action: 'play' | 'skip' | 'like' | 'add_to_playlist' | 'share';
  timestamp: Date;
  listenDuration?: number; // seconds listened
  context?: PlaybackContext;
  sessionId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface UserProfile {
  userId: string;
  favoriteGenres: GenrePreference[];
  favoriteArtists: ArtistPreference[];
  listeningPatterns: ListeningPattern[];
  skipBehavior: SkipBehavior;
  audioFeaturePreferences: AudioFeaturePreferences;
  timeBasedPreferences: TimeBasedPreferences;
  socialPreferences: SocialPreferences;
  lastUpdated: Date;
  version: number; // for cache invalidation
}

export interface GenrePreference {
  genre: string;
  score: number; // 0-1 preference score
  playCount: number;
  skipRate: number;
  averageListenTime: number;
  recentActivity: Date;
}

export interface ArtistPreference {
  artistId: string;
  score: number;
  playCount: number;
  skipRate: number;
  followStatus: boolean;
  lastPlayed: Date;
}

export interface ListeningPattern {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  preferredGenres: string[];
  averageSessionLength: number;
  energyLevel: 'low' | 'medium' | 'high';
  moodTags: string[];
}

export interface SkipBehavior {
  totalSkips: number;
  skipRate: number; // percentage of tracks skipped
  averageSkipPoint: number; // seconds into track when typically skipped
  skipReasons: Record<string, number>; // genre -> skip count
  patterns: {
    skipAfterRepeat: boolean;
    skipSimilarArtists: boolean;
    skipLongTracks: boolean;
  };
}

export interface AudioFeaturePreferences {
  danceability: number; // 0-1
  energy: number; // 0-1
  valence: number; // 0-1 (happiness/positivity)
  acousticness: number; // 0-1
  instrumentalness: number; // 0-1
  tempo: {
    min: number;
    max: number;
    preferred: number;
  };
  loudness: {
    min: number;
    max: number;
    preferred: number;
  };
}

export interface TimeBasedPreferences {
  morning: {
    preferredGenres: string[];
    energyLevel: 'low' | 'medium' | 'high';
    moodTags: string[];
  };
  afternoon: {
    preferredGenres: string[];
    energyLevel: 'low' | 'medium' | 'high';
    moodTags: string[];
  };
  evening: {
    preferredGenres: string[];
    energyLevel: 'low' | 'medium' | 'high';
    moodTags: string[];
  };
  night: {
    preferredGenres: string[];
    energyLevel: 'low' | 'medium' | 'high';
    moodTags: string[];
  };
}

export interface SocialPreferences {
  shareFrequency: number;
  followsInfluencers: boolean;
  discoveryThroughFriends: boolean;
  collaborativePlaylistParticipation: number;
  trendsFollowing: boolean;
}

export interface TrackFeatures {
  trackId: string;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo: number;
  loudness: number;
  mode: number; // 0 = minor, 1 = major
  key: number; // 0-11 (C, C#, D, etc.)
  timeSignature: number;
  duration: number;
  genres: string[];
  moodTags: string[];
  contextTags: string[]; // workout, study, party, chill, etc.
}

export interface RecommendationScore {
  trackId: string;
  score: number; // 0-1 recommendation confidence
  reasons: RecommendationReason[];
  algorithm: RecommendationAlgorithm;
  context: RecommendationContext;
  freshness: number; // 0-1, how new/recent the recommendation is
  diversity: number; // 0-1, how different from user's usual preferences
}

export interface RecommendationReason {
  type: 'similar_artist' | 'similar_genre' | 'audio_features' | 'collaborative' | 'trending' | 'time_based' | 'mood_based' | 'new_release' | 'friend_activity';
  weight: number; // importance of this reason in final score
  explanation: string; // human-readable explanation
  metadata?: Record<string, any>; // additional context
}

export type RecommendationAlgorithm = 
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'
  | 'popularity_based'
  | 'time_contextual'
  | 'mood_based'
  | 'social_collaborative';

export interface RecommendationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  weather?: string;
  activity?: 'workout' | 'study' | 'commute' | 'relaxing' | 'party' | 'work';
  mood?: 'happy' | 'sad' | 'energetic' | 'calm' | 'focused' | 'nostalgic';
  location?: 'home' | 'work' | 'gym' | 'car' | 'outdoor';
}

export interface RecommendationRequest {
  userId: string;
  sectionType: HomeFeedSectionType;
  limit: number;
  excludeTrackIds?: string[];
  context?: RecommendationContext;
  algorithm?: RecommendationAlgorithm;
  diversityLevel?: 'low' | 'medium' | 'high';
  freshnessLevel?: 'low' | 'medium' | 'high';
  seedTracks?: string[];
  seedArtists?: string[];
  seedGenres?: string[];
}

export interface RecommendationResponse {
  tracks: RecommendationScore[];
  totalAvailable: number;
  algorithm: RecommendationAlgorithm;
  generatedAt: Date;
  validUntil: Date;
  metadata: {
    processingTime: number;
    cacheHit: boolean;
    userProfileVersion: number;
    abTestVariant?: string;
  };
}

export type HomeFeedSectionType = 
  | 'discover_weekly'
  | 'daily_mix'
  | 'release_radar'
  | 'recently_played'
  | 'jump_back_in'
  | 'heavy_rotation'
  | 'trending_now'
  | 'new_releases'
  | 'charts'
  | 'morning_mix'
  | 'evening_chill'
  | 'workout_mix'
  | 'focus_music'
  | 'friends_listening'
  | 'popular_in_network'
  | 'because_you_liked'
  | 'similar_artists'
  | 'genre_based'
  | 'mood_based'
  | 'activity_based';

export interface HomeFeedSection {
  id: string;
  type: HomeFeedSectionType;
  title: string;
  subtitle?: string;
  description?: string;
  iconName?: string;
  priority: number;
  isPersonalized: boolean;
  refreshable: boolean;
  timeToLive: number; // minutes before refresh needed
  tracks: RecommendationScore[];
  metadata: {
    generatedAt: Date;
    lastRefreshed: Date;
    algorithm: RecommendationAlgorithm;
    userEngagement: {
      viewCount: number;
      clickCount: number;
      playCount: number;
      skipCount: number;
      likeCount: number;
      shareCount: number;
    };
  };
  displaySettings: {
    layout: 'horizontal_cards' | 'vertical_list' | 'grid' | 'hero';
    cardSize: 'small' | 'medium' | 'large';
    showArtwork: boolean;
    showMetadata: boolean;
    showRecommendationReason: boolean;
    maxItems: number;
  };
}

export interface HomeFeed {
  userId: string;
  sections: HomeFeedSection[];
  generatedAt: Date;
  lastRefreshed: Date;
  version: number;
  abTestVariant?: string;
  metadata: {
    totalRecommendations: number;
    averageConfidence: number;
    diversityScore: number;
    freshnessScore: number;
    processingTime: number;
  };
}

export interface RecommendationEngine {
  generateRecommendations: (request: RecommendationRequest) => Promise<RecommendationResponse>;
  updateUserBehavior: (behavior: UserBehavior) => Promise<void>;
  refreshUserProfile: (userId: string) => Promise<UserProfile>;
  getHomeFeed: (userId: string, refresh?: boolean) => Promise<HomeFeed>;
  trainModels: () => Promise<void>;
  getRecommendationExplanation: (trackId: string, userId: string) => Promise<RecommendationReason[]>;
}

export interface SimilarityMatrix {
  userId: string;
  similarities: Record<string, number>; // otherUserId -> similarity score
  lastUpdated: Date;
}

export interface ItemSimilarity {
  itemId: string;
  itemType: 'track' | 'artist' | 'album' | 'genre';
  similarities: Record<string, number>; // otherItemId -> similarity score
  lastUpdated: Date;
}

export interface TrendingData {
  trackId: string;
  playCount: number;
  playCountChange: number; // change from previous period
  velocity: number; // rate of growth
  regions: string[];
  ageGroups: string[];
  timeFrame: '1h' | '1d' | '1w' | '1m';
  trending: boolean;
  trendingRank?: number;
  peakRank?: number;
  lastUpdated: Date;
}

export interface PopularityData {
  trackId: string;
  globalRank: number;
  regionRanks: Record<string, number>;
  genreRanks: Record<string, number>;
  playCount: number;
  uniqueListeners: number;
  shareCount: number;
  playlistAdditions: number;
  skipRate: number;
  completionRate: number;
  lastUpdated: Date;
}

export interface ContentMetadata {
  trackId: string;
  genres: string[];
  subgenres: string[];
  moodTags: string[];
  activityTags: string[];
  era: string;
  language: string;
  bpm: number;
  key: string;
  mode: 'major' | 'minor';
  explicit: boolean;
  instrumental: boolean;
  live: boolean;
  acoustic: boolean;
  cover: boolean;
  remix: boolean;
  collaboration: boolean;
  featuredArtists: string[];
  producers: string[];
  writers: string[];
  recordLabel: string;
  releaseType: 'single' | 'album' | 'ep' | 'compilation';
  chartPositions: Record<string, number>;
  awards: string[];
  certifications: string[];
}

export interface RecommendationCache {
  userId: string;
  sectionType: HomeFeedSectionType;
  recommendations: RecommendationScore[];
  generatedAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastAccessed: Date;
  context: RecommendationContext;
  algorithm: RecommendationAlgorithm;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  algorithm: RecommendationAlgorithm;
  parameters: Record<string, any>;
  trafficPercentage: number;
  isActive: boolean;
  metrics: {
    userEngagement: number;
    clickThroughRate: number;
    playThroughRate: number;
    skipRate: number;
    likeRate: number;
    sessionLength: number;
    returnRate: number;
  };
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}

export interface RecommendationFeedback {
  id: string;
  userId: string;
  trackId: string;
  sectionType: HomeFeedSectionType;
  feedbackType: 'like' | 'dislike' | 'not_interested' | 'already_know' | 'inappropriate';
  timestamp: Date;
  context: RecommendationContext;
  recommendationScore: number;
  reasons: RecommendationReason[];
  algorithm: RecommendationAlgorithm;
}

export interface ColdStartStrategy {
  strategy: 'popularity_based' | 'demographic_based' | 'onboarding_based' | 'genre_exploration';
  minInteractions: number;
  fallbackAlgorithm: RecommendationAlgorithm;
  diversityBoost: number;
  explorationWeight: number;
  popularityThreshold: number;
}

// Social Features Types

// Artist Following Types
export interface FollowedArtist {
  id: string;
  userId: string;
  artistId: string;
  followedAt: Date;
  notificationsEnabled: boolean;
}

export interface ArtistFollowStats {
  artistId: string;
  followerCount: number;
  followingCount: number;
  totalPlays: number;
  monthlyListeners: number;
  isFollowing: boolean;
}

export interface FollowingFeedItem {
  id: string;
  type: 'new_release' | 'upcoming_show' | 'artist_update' | 'collaboration';
  artistId: string;
  artist: Artist;
  title: string;
  description: string;
  imageUrl?: string;
  releaseDate?: Date;
  trackId?: string;
  albumId?: string;
  createdAt: Date;
  isRead: boolean;
}

export interface FollowingNotification {
  id: string;
  userId: string;
  artistId: string;
  artist: Artist;
  type: 'new_release' | 'upcoming_album' | 'concert_announcement' | 'artist_milestone';
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// Content Sharing Types
export interface ShareableContent {
  id: string;
  type: 'track' | 'album' | 'playlist' | 'artist';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  description?: string;
  url: string;
  createdBy?: User;
  metadata?: Record<string, any>;
}

export interface ShareLink {
  id: string;
  contentType: 'track' | 'album' | 'playlist' | 'artist';
  contentId: string;
  shareUrl: string;
  shortUrl: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isPublic: boolean;
  allowPreview: boolean;
  viewCount: number;
  clickCount: number;
  lastAccessedAt?: Date;
  customMessage?: string;
  embedCode?: string;
}

export interface SocialShareOptions {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'telegram' | 'email' | 'copy_link';
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  hashtags?: string[];
  via?: string;
  customMessage?: string;
}

export interface ShareActivity {
  id: string;
  userId: string;
  contentType: 'track' | 'album' | 'playlist' | 'artist';
  contentId: string;
  platform: string;
  shareUrl: string;
  customMessage?: string;
  sharedAt: Date;
  clickCount: number;
  conversionCount: number;
  lastClickAt?: Date;
}

export interface EmailShareRequest {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  contentType: 'track' | 'album' | 'playlist' | 'artist';
  contentId: string;
  personalMessage?: string;
  includePreview: boolean;
  template?: 'default' | 'birthday' | 'recommendation' | 'discovery';
}

export interface EmbedCodeOptions {
  contentType: 'playlist' | 'album' | 'track';
  contentId: string;
  theme: 'dark' | 'light' | 'auto';
  width: number;
  height: number;
  showCover: boolean;
  showPlayButton: boolean;
  showTrackList: boolean;
  autoPlay: boolean;
  compact: boolean;
}

// Social Profile and Activity Types
export interface SocialProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  isPublic: boolean;
  followingCount: number;
  followerCount: number;
  playlistCount: number;
  totalListeningTime: number;
  joinedAt: Date;
  lastActiveAt: Date;
  topGenres: string[];
  topArtists: Artist[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  privacySettings: {
    showRecentlyPlayed: boolean;
    showTopTracks: boolean;
    showPlaylists: boolean;
    showFollowing: boolean;
    allowFollowing: boolean;
    showActivity: boolean;
  };
}

export interface SocialActivity {
  id: string;
  userId: string;
  type: 'played_track' | 'created_playlist' | 'followed_artist' | 'liked_track' | 'shared_content';
  targetType: 'track' | 'playlist' | 'artist' | 'album';
  targetId: string;
  targetName: string;
  targetImage?: string;
  description: string;
  timestamp: Date;
  isPublic: boolean;
  metadata?: Record<string, any>;
}

export interface FriendActivity {
  id: string;
  friendId: string;
  friendName: string;
  friendImage?: string;
  activity: SocialActivity;
  isFollowing: boolean;
}

// Notification System Types
export interface NotificationSettings {
  userId: string;
  newReleases: boolean;
  artistUpdates: boolean;
  friendActivity: boolean;
  playlistUpdates: boolean;
  systemUpdates: boolean;
  marketing: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_release' | 'artist_update' | 'friend_activity' | 'playlist_update' | 'system' | 'marketing';
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  isPersistent: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  channels: ('in_app' | 'email' | 'push')[];
}

export interface NotificationBatch {
  id: string;
  userId: string;
  type: 'daily_digest' | 'weekly_summary' | 'new_releases' | 'friend_activity';
  title: string;
  notifications: Notification[];
  createdAt: Date;
  sentAt?: Date;
  isRead: boolean;
}

// Social Discovery Types
export interface SocialRecommendation {
  id: string;
  userId: string;
  type: 'friend_listening' | 'friend_playlist' | 'trending_in_network' | 'collaborative_discovery';
  contentType: 'track' | 'playlist' | 'artist' | 'album';
  contentId: string;
  content: Track | Playlist | Artist | Album;
  sourceUserId?: string;
  sourceUser?: User;
  reason: string;
  confidence: number;
  socialProof: {
    friendCount: number;
    totalPlays: number;
    recentActivity: boolean;
    friendNames: string[];
  };
  createdAt: Date;
  expiresAt: Date;
}

export interface TrendingContent {
  contentType: 'track' | 'playlist' | 'artist' | 'album';
  contentId: string;
  content: Track | Playlist | Artist | Album;
  rank: number;
  previousRank?: number;
  trendScore: number;
  velocity: number;
  shareCount: number;
  playCount: number;
  uniqueListeners: number;
  timeframe: '1h' | '24h' | '7d' | '30d';
  region?: string;
  demographic?: string;
  lastUpdated: Date;
}

// Social Stats and Analytics
export interface SocialStats {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalShares: number;
    shareClicks: number;
    shareConversions: number;
    followingGrowth: number;
    notificationsSent: number;
    notificationsOpened: number;
    socialDiscoveries: number;
    viralShares: number;
    topSharedContent: {
      contentType: string;
      contentId: string;
      shareCount: number;
    }[];
    topReferralSources: {
      platform: string;
      clicks: number;
      conversions: number;
    }[];
  };
  generatedAt: Date;
}

// Store Types for Social Features
export interface SocialState {
  followedArtists: FollowedArtist[];
  followingStats: Record<string, ArtistFollowStats>;
  notifications: Notification[];
  unreadNotificationCount: number;
  socialProfile: SocialProfile | null;
  friendActivity: FriendActivity[];
  shareHistory: ShareActivity[];
  isLoading: boolean;
  error: string | null;
}

export interface ShareModalState {
  isOpen: boolean;
  content: ShareableContent | null;
  activeTab: 'social' | 'email' | 'embed' | 'copy';
  customMessage: string;
  selectedPlatforms: string[];
  emailRecipients: string[];
  embedOptions: Partial<EmbedCodeOptions>;
}