"use client";

import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSearchStore } from "@/stores/search-store";
import { cn } from "@/lib/utils";

interface SearchHistoryProps {
  className?: string;
  onSearchSelect?: (query: string) => void;
  maxItems?: number;
}

export function SearchHistory({ 
  className, 
  onSearchSelect, 
  maxItems = 10 
}: SearchHistoryProps) {
  const { history, removeFromHistory, clearHistory, performSearch } = useSearchStore();

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  // Handle search selection
  const handleSearchSelect = (query: string) => {
    if (onSearchSelect) {
      onSearchSelect(query);
    } else {
      performSearch(query);
    }
  };

  // Handle remove item
  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromHistory(id);
  };

  // Handle clear all
  const handleClearAll = () => {
    clearHistory();
  };

  if (history.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <ClockIcon className="w-8 h-8 text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No search history</h3>
        <p className="text-white/60 text-sm">
          Your recent searches will appear here
        </p>
      </div>
    );
  }

  const displayedHistory = history.slice(0, maxItems);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent searches</h3>
        <button
          onClick={handleClearAll}
          className={cn(
            "text-sm text-white/60 hover:text-white transition-colors",
            "focus:outline-none focus:text-white"
          )}
        >
          Clear all
        </button>
      </div>

      {/* History List */}
      <div className="space-y-1">
        {displayedHistory.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200",
              "cursor-pointer"
            )}
            onClick={() => handleSearchSelect(item.query)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSearchSelect(item.query);
              }
            }}
          >
            {/* Search Icon */}
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-5 h-5 text-white/60" />
            </div>

            {/* Search Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white truncate group-hover:text-green-400 transition-colors">
                  {item.query}
                </h4>
                <span className="text-xs text-white/40 flex-shrink-0 ml-2">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
              <p className="text-sm text-white/60">
                {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                {item.filters?.genre && ` • ${item.filters.genre}`}
                {item.filters?.type && item.filters.type !== "all" && ` • ${item.filters.type}s`}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={(e) => handleRemoveItem(e, item.id)}
              className={cn(
                "w-8 h-8 rounded-full hover:bg-white/10 transition-all flex-shrink-0",
                "flex items-center justify-center opacity-0 group-hover:opacity-100",
                "focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
              )}
              aria-label={`Remove "${item.query}" from search history`}
            >
              <XMarkIcon className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {history.length > maxItems && (
        <button
          className={cn(
            "w-full text-center py-3 text-sm text-white/60 hover:text-white transition-colors",
            "focus:outline-none focus:text-white"
          )}
        >
          Show {history.length - maxItems} more
        </button>
      )}
    </div>
  );
}

// Compact version for use in search input dropdown
export function SearchHistoryCompact({
  className,
  onSearchSelect,
  maxItems = 5,
}: SearchHistoryProps) {
  const { history } = useSearchStore();

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = history.slice(0, maxItems);

  return (
    <div className={cn("space-y-1", className)}>
      {displayedHistory.map((item) => (
        <button
          key={item.id}
          onClick={() => onSearchSelect?.(item.query)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/10 transition-colors",
            "focus:outline-none focus:bg-white/10"
          )}
        >
          <ClockIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-white text-sm truncate block">
              {item.query}
            </span>
            <span className="text-white/40 text-xs">
              {item.resultCount} results • {formatTimestamp(item.timestamp)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "now";
  } else if (minutes < 60) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h`;
  } else {
    return `${days}d`;
  }
}