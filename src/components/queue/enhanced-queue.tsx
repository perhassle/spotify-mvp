"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  ClockIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon as PlayIconSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import type { Track } from "@/types";

interface EnhancedQueueProps {
  className?: string;
  onClose?: () => void;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
}

export function EnhancedQueue({ className, onClose }: EnhancedQueueProps) {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    play,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  } = usePlayerStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  });
  
  const [showOptions, setShowOptions] = useState<number | null>(null);
  const queueRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragState({
      isDragging: true,
      dragIndex: index,
      dropIndex: null,
    });
    
    // Set drag data
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
    
    // Add drag image
    const dragElement = e.currentTarget as HTMLElement;
    const dragImage = dragElement.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = "0.5";
    dragImage.style.transform = "rotate(2deg)";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    setDragState(prev => ({
      ...prev,
      dropIndex: index,
    }));
  };

  // Handle drag drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    
    if (!isNaN(dragIndex) && dragIndex !== dropIndex) {
      reorderQueue(dragIndex, dropIndex);
    }
    
    setDragState({
      isDragging: false,
      dragIndex: null,
      dropIndex: null,
    });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragIndex: null,
      dropIndex: null,
    });
  };

  // Handle track play
  const handleTrackPlay = (track: Track, index: number) => {
    if (currentIndex === index && currentTrack?.id === track.id) {
      // Same track, just toggle play/pause
      const { togglePlayPause } = usePlayerStore.getState();
      togglePlayPause();
    } else {
      // Different track, play it
      play(track);
    }
  };

  // Handle remove from queue
  const handleRemoveTrack = (index: number) => {
    removeFromQueue(index);
    setShowOptions(null);
  };

  // Handle play from here
  const handlePlayFromHere = (index: number) => {
    const track = queue[index];
    if (track) {
      // Update current index and play
      const { setQueue } = usePlayerStore.getState();
      setQueue(queue, index);
      play(track);
    }
    setShowOptions(null);
  };

  // Calculate queue stats
  const totalDuration = queue.reduce((total, track) => total + track.duration, 0);
  const upcomingTracks = queue.slice(currentIndex + 1);
  const previousTracks = queue.slice(0, currentIndex);

  if (queue.length === 0) {
    return (
      <div className={cn(
        "enhanced-queue bg-gray-800 rounded-lg border border-gray-700 p-6",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <QueueListIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Queue</h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <MusicalNoteIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-white mb-2">No tracks in queue</h4>
          <p className="text-gray-400 mb-6">
            Add songs to your queue to get started
          </p>
          <Button variant="spotify" size="sm">
            Browse Music
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "enhanced-queue bg-gray-800 rounded-lg border border-gray-700 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <QueueListIcon className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Queue</h3>
            <p className="text-xs text-gray-400">
              {queue.length} tracks • {formatDuration(totalDuration)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white text-xs"
            onClick={clearQueue}
          >
            Clear all
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Queue Content */}
      <div ref={queueRef} className="max-h-96 overflow-y-auto">
        {/* Currently Playing */}
        {currentTrack && (
          <div className="p-3 bg-gray-700/50 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 overflow-hidden rounded">
                {currentTrack.imageUrl ? (
                  <Image
                    src={currentTrack.imageUrl}
                    alt={currentTrack.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-600 flex items-center justify-center">
                    <MusicalNoteIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white"
                    onClick={() => handleTrackPlay(currentTrack, currentIndex)}
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-3 w-3" />
                    ) : (
                      <PlayIcon className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {isPlaying ? (
                      <div className="flex space-x-1">
                        <div className="w-1 h-3 bg-spotify-green animate-pulse"></div>
                        <div className="w-1 h-2 bg-spotify-green animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-4 bg-spotify-green animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <PlayIconSolid className="h-3 w-3 text-spotify-green" />
                    )}
                    <span className="text-xs text-spotify-green font-medium">Now Playing</span>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-gray-300 truncate">
                  {currentTrack.artist.name}
                </p>
              </div>
              
              <div className="text-xs text-gray-400">
                {formatDuration(currentTrack.duration)}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Tracks */}
        {upcomingTracks.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <h4 className="text-sm font-medium text-gray-300">Next Up</h4>
            </div>
            
            {upcomingTracks.map((track, index) => {
              const actualIndex = currentIndex + 1 + index;
              const isDragSource = dragState.dragIndex === actualIndex;
              const isDropTarget = dragState.dropIndex === actualIndex;
              
              return (
                <div
                  key={`${track.id}-${actualIndex}`}
                  className={cn(
                    "group flex items-center space-x-3 p-3 hover:bg-gray-700/50 transition-colors relative",
                    isDragSource && "opacity-50",
                    isDropTarget && "bg-spotify-green/10 border-l-2 border-spotify-green"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, actualIndex)}
                  onDragOver={(e) => handleDragOver(e, actualIndex)}
                  onDrop={(e) => handleDrop(e, actualIndex)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag Handle */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <Bars3Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  {/* Track Number */}
                  <div className="w-4 text-xs text-gray-400 text-right">
                    {index + 1}
                  </div>
                  
                  {/* Track Image */}
                  <div className="relative h-10 w-10 overflow-hidden rounded group">
                    {track.imageUrl ? (
                      <Image
                        src={track.imageUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-600 flex items-center justify-center">
                        <MusicalNoteIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white"
                        onClick={() => handleTrackPlay(track, actualIndex)}
                      >
                        <PlayIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-spotify-green transition-colors">
                      {track.title}
                    </h4>
                    <p className="text-xs text-gray-300 truncate">
                      {track.artist.name}
                    </p>
                  </div>
                  
                  {/* Duration */}
                  <div className="text-xs text-gray-400">
                    {formatDuration(track.duration)}
                  </div>
                  
                  {/* Options Menu */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setShowOptions(showOptions === actualIndex ? null : actualIndex)}
                    >
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </Button>
                    
                    {showOptions === actualIndex && (
                      <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-10 min-w-48">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left text-white hover:bg-gray-700 rounded-none rounded-t-lg"
                          onClick={() => handlePlayFromHere(actualIndex)}
                        >
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Play from here
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left text-white hover:bg-gray-700 rounded-none rounded-b-lg"
                          onClick={() => handleRemoveTrack(actualIndex)}
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Remove from queue
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Previously Played */}
        {previousTracks.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <h4 className="text-sm font-medium text-gray-300">Recently Played</h4>
            </div>
            
            {previousTracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="group flex items-center space-x-3 p-3 hover:bg-gray-700/50 transition-colors opacity-60"
              >
                {/* Track Number */}
                <div className="w-4 text-xs text-gray-500 text-right">
                  {index + 1}
                </div>
                
                {/* Track Image */}
                <div className="relative h-10 w-10 overflow-hidden rounded">
                  {track.imageUrl ? (
                    <Image
                      src={track.imageUrl}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-600 flex items-center justify-center">
                      <MusicalNoteIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-400 truncate">
                    {track.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {track.artist.name}
                  </p>
                </div>
                
                {/* Duration */}
                <div className="text-xs text-gray-500">
                  {formatDuration(track.duration)}
                </div>
                
                {/* Played indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drop zones for reordering */}
      {dragState.isDragging && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-2 bg-spotify-green/20 opacity-0 hover:opacity-100 transition-opacity"
            onDragOver={(e) => handleDragOver(e, 0)}
            onDrop={(e) => handleDrop(e, 0)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-spotify-green/20 opacity-0 hover:opacity-100 transition-opacity"
            onDragOver={(e) => handleDragOver(e, queue.length)}
            onDrop={(e) => handleDrop(e, queue.length)}
          />
        </>
      )}
    </div>
  );
}