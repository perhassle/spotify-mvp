"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";

interface KeyboardShortcutsConfig {
  enabled?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const {
    enabled = true,
    ignoreInputs = true,
  } = config;

  const {
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume,
    volume,
    seekTo,
    progress,
    duration,
    skipForward,
    skipBackward,
    toggleShuffle,
    setRepeatMode,
    repeatMode,
  } = usePlayerStore();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields, textareas, or contenteditable elements
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Prevent default behavior for handled shortcuts
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      switch (event.code) {
        case "Space":
          // Play/Pause (Space)
          preventDefault();
          togglePlayPause();
          break;

        case "ArrowLeft":
          if (event.shiftKey) {
            // Shift + Left Arrow: Previous track
            preventDefault();
            previousTrack();
          } else if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Left Arrow: Skip backward 30s
            preventDefault();
            skipBackward(30);
          } else {
            // Left Arrow: Seek backward 5s
            preventDefault();
            const newTime = Math.max(0, progress - 5);
            seekTo(newTime);
          }
          break;

        case "ArrowRight":
          if (event.shiftKey) {
            // Shift + Right Arrow: Next track
            preventDefault();
            nextTrack();
          } else if (event.ctrlKey || event.metaKey) {
            // Ctrl/Cmd + Right Arrow: Skip forward 30s
            preventDefault();
            skipForward(30);
          } else {
            // Right Arrow: Seek forward 5s
            preventDefault();
            const newTime = Math.min(duration, progress + 5);
            seekTo(newTime);
          }
          break;

        case "ArrowUp":
          // Up Arrow: Volume up
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const newVolume = Math.min(1, volume + 0.1);
            setVolume(newVolume);
          }
          break;

        case "ArrowDown":
          // Down Arrow: Volume down
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const newVolume = Math.max(0, volume - 0.1);
            setVolume(newVolume);
          }
          break;

        case "KeyM":
          // M: Mute/Unmute
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            setVolume(volume === 0 ? 0.8 : 0);
          }
          break;

        case "KeyS":
          // S: Toggle Shuffle
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            toggleShuffle();
          }
          break;

        case "KeyR":
          // R: Cycle Repeat modes
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const modes: Array<"off" | "context" | "track"> = ["off", "context", "track"];
            const currentIndex = modes.indexOf(repeatMode || "off");
            const nextMode = modes[(currentIndex + 1) % modes.length] || "off";
            setRepeatMode(nextMode);
          }
          break;

        case "KeyL":
          // L: Like/Unlike current track (placeholder - would connect to like functionality)
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            console.log("Like/Unlike shortcut pressed");
            // TODO: Implement like/unlike functionality
          }
          break;

        case "KeyJ":
          // J: Skip backward 10s
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            skipBackward(10);
          }
          break;

        case "KeyK":
          // K: Play/Pause (alternative to Space)
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            togglePlayPause();
          }
          break;

        case "KeyF":
          // F: Skip forward 10s
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            skipForward(10);
          }
          break;

        case "Digit0":
        case "Digit1":
        case "Digit2":
        case "Digit3":
        case "Digit4":
        case "Digit5":
        case "Digit6":
        case "Digit7":
        case "Digit8":
        case "Digit9":
          // Number keys: Seek to percentage of track
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const number = parseInt(event.code.replace("Digit", ""));
            const percentage = number === 0 ? 1 : number / 10; // 0 = 100%, 1-9 = 10%-90%
            const newTime = duration * percentage;
            seekTo(newTime);
          }
          break;

        case "Comma":
          // , (comma): Previous track
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            previousTrack();
          }
          break;

        case "Period":
          // . (period): Next track
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            nextTrack();
          }
          break;

        case "Minus":
        case "NumpadSubtract":
          // - or Numpad -: Volume down
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const newVolume = Math.max(0, volume - 0.1);
            setVolume(newVolume);
          }
          break;

        case "Equal":
        case "NumpadAdd":
          // = or Numpad +: Volume up
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            preventDefault();
            const newVolume = Math.min(1, volume + 0.1);
            setVolume(newVolume);
          }
          break;

        default:
          // Don't prevent default for unhandled keys
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    ignoreInputs,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setVolume,
    volume,
    seekTo,
    progress,
    duration,
    skipForward,
    skipBackward,
    toggleShuffle,
    setRepeatMode,
    repeatMode,
  ]);
}

// Hook to get keyboard shortcuts help information
export function useKeyboardShortcutsHelp() {
  return {
    shortcuts: [
      { key: "Space", description: "Play/Pause" },
      { key: "K", description: "Play/Pause (alternative)" },
      { key: "← →", description: "Seek backward/forward 5s" },
      { key: "Shift + ← →", description: "Previous/Next track" },
      { key: "Ctrl + ← →", description: "Skip backward/forward 30s" },
      { key: "↑ ↓", description: "Volume up/down" },
      { key: "M", description: "Mute/Unmute" },
      { key: "S", description: "Toggle Shuffle" },
      { key: "R", description: "Cycle Repeat modes" },
      { key: "J", description: "Skip backward 10s" },
      { key: "F", description: "Skip forward 10s" },
      { key: "L", description: "Like/Unlike track" },
      { key: "0-9", description: "Seek to 0%-100% of track" },
      { key: ", .", description: "Previous/Next track" },
      { key: "- +", description: "Volume down/up" },
    ],
    categories: {
      playback: [
        { key: "Space / K", description: "Play/Pause" },
        { key: "Shift + ← →", description: "Previous/Next track" },
        { key: ", .", description: "Previous/Next track (alternative)" },
      ],
      seeking: [
        { key: "← →", description: "Seek backward/forward 5s" },
        { key: "J / F", description: "Skip backward/forward 10s" },
        { key: "Ctrl + ← →", description: "Skip backward/forward 30s" },
        { key: "0-9", description: "Seek to percentage of track" },
      ],
      volume: [
        { key: "↑ ↓", description: "Volume up/down" },
        { key: "- / +", description: "Volume down/up (alternative)" },
        { key: "M", description: "Mute/Unmute" },
      ],
      modes: [
        { key: "S", description: "Toggle Shuffle" },
        { key: "R", description: "Cycle Repeat modes" },
      ],
      other: [
        { key: "L", description: "Like/Unlike current track" },
      ],
    },
  };
}