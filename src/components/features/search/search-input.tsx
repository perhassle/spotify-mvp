"use client";

import { useState, useRef, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ClockIcon } from "@heroicons/react/24/solid";
import { useDebounceSearch } from "@/hooks/use-debounced-search";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: (query: string) => void;
}

export function SearchInput({ 
  placeholder = "Search for songs, artists, or albums...", 
  className,
  autoFocus = false,
  onSubmit
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    suggestions,
    isLoading,
    history,
    handleInputChange,
    handleSuggestionSelect,
    clearSearch,
  } = useDebounceSearch();

  const allSuggestions = [
    ...suggestions.map(s => ({ text: s, type: "suggestion" as const })),
    ...(query.length === 0 && history.length > 0 ? 
      history.slice(0, 5).map(h => ({ text: h.query, type: "history" as const })) : []
    )
  ];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        onSubmit?.(query);
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
        
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          const selectedSuggestion = allSuggestions[selectedIndex];
          if (selectedSuggestion) {
            handleSuggestionSelect(selectedSuggestion.text);
            onSubmit?.(selectedSuggestion.text);
          }
        } else if (query.trim()) {
          onSubmit?.(query);
        }
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
        
      case "Escape":
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  // Handle blur with delay to allow suggestion clicks
  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleSuggestionSelect(suggestion);
    onSubmit?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    clearSearch();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit?.(query);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Input */}
        <div className={cn(
          "relative flex items-center rounded-full bg-white/10 border transition-all duration-200",
          isFocused 
            ? "border-green-400 bg-white/20 shadow-lg" 
            : "border-white/20 hover:border-white/30"
        )}>
          {/* Search Icon */}
          <MagnifyingGlassIcon 
            className={cn(
              "w-5 h-5 ml-4 transition-colors",
              isFocused ? "text-green-400" : "text-white/60"
            )}
          />
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "flex-1 px-4 py-3 bg-transparent text-white placeholder-white/60",
              "focus:outline-none text-sm md:text-base",
              "min-h-[44px]" // Minimum touch target size
            )}
            aria-label="Search music"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            autoComplete="off"
            role="combobox"
          />
          
          {/* Loading Spinner */}
          {isLoading && (
            <div className="mr-4">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          {/* Clear Button */}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "mr-4 p-1 rounded-full hover:bg-white/10 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent"
              )}
              aria-label="Clear search"
            >
              <XMarkIcon className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && allSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 py-2",
              "bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50",
              "max-h-64 overflow-y-auto"
            )}
            role="listbox"
            aria-label="Search suggestions"
          >
            {allSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}`}
                type="button"
                onClick={() => handleSuggestionClick(suggestion.text)}
                className={cn(
                  "w-full flex items-center px-4 py-2 text-left text-sm",
                  "hover:bg-white/10 transition-colors",
                  "focus:outline-none focus:bg-white/10",
                  selectedIndex === index && "bg-white/10"
                )}
                role="option"
                aria-selected={selectedIndex === index}
              >
                {suggestion.type === "history" ? (
                  <ClockIcon className="w-4 h-4 mr-3 text-white/40 flex-shrink-0" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4 mr-3 text-white/40 flex-shrink-0" />
                )}
                <span className="text-white truncate">{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}