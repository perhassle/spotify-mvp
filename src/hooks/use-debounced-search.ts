import { useState, useEffect, useCallback } from "react";
import { useSearchStore } from "@/stores/search-store";

interface UseDebounceSearchOptions {
  delay?: number;
  minLength?: number;
  enabled?: boolean;
}

export function useDebounceSearch(options: UseDebounceSearchOptions = {}) {
  const {
    delay = 300,
    minLength = 1,
    enabled = true,
  } = options;

  const {
    query,
    setQuery,
    performSearch,
    isLoading,
    error,
    results,
    suggestions,
    setSuggestions,
    clearSuggestions,
    history,
  } = useSearchStore();

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the search query
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, enabled]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!enabled) return;
    
    if (debouncedQuery.length >= minLength) {
      performSearch(debouncedQuery);
    } else if (debouncedQuery.length === 0) {
      // Clear results when query is empty
      useSearchStore.getState().clearResults();
    }
  }, [debouncedQuery, minLength, enabled, performSearch]);

  // Generate suggestions based on input and history
  const generateSuggestions = useCallback((input: string) => {
    if (input.length < 2) {
      clearSuggestions();
      return;
    }

    const inputLower = input.toLowerCase();
    
    // Get suggestions from search history
    const historySuggestions = history
      .filter(item => item.query.toLowerCase().includes(inputLower))
      .map(item => item.query)
      .slice(0, 5);

    // Mock suggestions - in a real app, these would come from an API
    const mockSuggestions = [
      "Taylor Swift",
      "The Weeknd",
      "Billie Eilish",
      "Drake",
      "Ariana Grande",
      "Ed Sheeran",
      "Dua Lipa",
      "Post Malone",
      "Olivia Rodrigo",
      "Bad Bunny",
      "Anti-Hero",
      "Blinding Lights",
      "bad guy",
      "God's Plan",
      "positions",
      "Shape of You",
      "Levitating",
      "Circles",
      "good 4 u",
      "Dakiti"
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(inputLower) &&
      suggestion.toLowerCase() !== inputLower
    ).slice(0, 5);

    // Combine and deduplicate suggestions
    const allSuggestions = [...new Set([...historySuggestions, ...mockSuggestions])];
    setSuggestions(allSuggestions.slice(0, 8));
  }, [history, setSuggestions, clearSuggestions]);

  // Handle input change
  const handleInputChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    generateSuggestions(newQuery);
  }, [setQuery, generateSuggestions]);

  // Handle suggestion select
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    clearSuggestions();
    if (suggestion.length >= minLength) {
      performSearch(suggestion);
    }
  }, [setQuery, clearSuggestions, minLength, performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    useSearchStore.getState().clearQuery();
    clearSuggestions();
  }, [clearSuggestions]);

  return {
    query,
    debouncedQuery,
    suggestions,
    isLoading,
    error,
    results,
    history,
    handleInputChange,
    handleSuggestionSelect,
    clearSearch,
    generateSuggestions,
  };
}