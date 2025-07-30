"use client";

import { useState, useEffect } from "react";
import { EnhancedMusicPlayer } from "@/components/layout/enhanced-music-player";
import { MobilePlayer } from "@/components/audio/mobile-player";
import { Equalizer } from "@/components/audio/equalizer";
import { AudioVisualizer } from "@/components/audio/audio-visualizer";
import { EnhancedQueue } from "@/components/queue/enhanced-queue";
import { useKeyboardShortcuts, useKeyboardShortcutsHelp } from "@/hooks/use-keyboard-shortcuts";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AdjustmentsHorizontalIcon,
  ChartBarSquareIcon,
  QueueListIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CompleteAudioPlayerProps {
  className?: string;
}

type ActivePanel = "equalizer" | "visualizer" | "queue" | "shortcuts" | null;

export function CompleteAudioPlayer({ className }: CompleteAudioPlayerProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  
  const { currentTrack, isEqualizerEnabled, isVisualizerEnabled } = usePlayerStore();
  const { categories } = useKeyboardShortcutsHelp();

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    ignoreInputs: true,
  });

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.audio-panel') && !target.closest('.panel-toggle')) {
        setActivePanel(null);
      }
    };

    if (activePanel) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [activePanel]);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleShortcutsHelp = () => {
    setShowShortcutsHelp(true);
    setActivePanel(null);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Mobile Player */}
      <MobilePlayer className="md:hidden" />
      
      {/* Desktop Player */}
      <div className={cn("complete-audio-player hidden md:block", className)}>
      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowShortcutsHelp(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-6">
              {Object.entries(categories).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-white mb-3 capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded"
                      >
                        <span className="text-sm text-gray-300">
                          {shortcut.description}
                        </span>
                        <code className="text-xs bg-gray-600 px-2 py-1 rounded text-white">
                          {shortcut.key}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audio Panels */}
      {activePanel && (
        <div className="audio-panel fixed bottom-24 left-4 right-4 z-50 max-w-4xl mx-auto">
          {activePanel === "equalizer" && (
            <Equalizer
              className="w-full"
              onClose={() => setActivePanel(null)}
            />
          )}
          
          {activePanel === "visualizer" && (
            <AudioVisualizer
              className="w-full"
              height={250}
              barCount={128}
              style="bars"
              onClose={() => setActivePanel(null)}
            />
          )}
          
          {activePanel === "queue" && (
            <EnhancedQueue
              className="w-full"
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}

      {/* Enhanced Music Player */}
      <div className="relative">
        <EnhancedMusicPlayer className="bg-gray-900 border-t border-gray-700" />
        
        {/* Additional Panel Controls */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex items-center space-x-2">
          {/* Equalizer Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "panel-toggle h-11 px-3 text-xs border border-gray-600 bg-gray-800/80 backdrop-blur-sm min-h-[44px] min-w-[44px]",
              activePanel === "equalizer" ? "text-spotify-green border-spotify-green" : "text-gray-300 hover:text-white"
            )}
            onClick={() => togglePanel("equalizer")}
            disabled={!isEqualizerEnabled}
            aria-label={`${activePanel === "equalizer" ? "Close" : "Open"} equalizer panel`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            EQ
          </Button>

          {/* Visualizer Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "panel-toggle h-11 px-3 text-xs border border-gray-600 bg-gray-800/80 backdrop-blur-sm min-h-[44px] min-w-[44px]",
              activePanel === "visualizer" ? "text-spotify-green border-spotify-green" : "text-gray-300 hover:text-white"
            )}
            onClick={() => togglePanel("visualizer")}
            disabled={!isVisualizerEnabled}
            aria-label={`${activePanel === "visualizer" ? "Close" : "Open"} audio visualizer panel`}
          >
            <ChartBarSquareIcon className="h-4 w-4 mr-1" />
            Visual
          </Button>

          {/* Queue Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "panel-toggle h-11 px-3 text-xs border border-gray-600 bg-gray-800/80 backdrop-blur-sm min-h-[44px] min-w-[44px]",
              activePanel === "queue" ? "text-spotify-green border-spotify-green" : "text-gray-300 hover:text-white"
            )}
            onClick={() => togglePanel("queue")}
            aria-label={`${activePanel === "queue" ? "Close" : "Open"} queue panel`}
          >
            <QueueListIcon className="h-4 w-4 mr-1" />
            Queue
          </Button>

          {/* Keyboard Shortcuts Help */}
          <Button
            variant="ghost"
            size="sm"
            className="panel-toggle h-11 px-3 text-xs border border-gray-600 bg-gray-800/80 backdrop-blur-sm text-gray-300 hover:text-white min-h-[44px] min-w-[44px]"
            onClick={handleShortcutsHelp}
            aria-label="Show keyboard shortcuts help"
          >
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            Help
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}