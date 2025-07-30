'use client';

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  Play, 
  Pause, 
  Heart, 
  X, 
  Clock, 
  GripVertical,
  Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePlaylistStore from '@/stores/playlist-store';
import usePlayerStore from '@/stores/player-store';
import { PlaylistTrack } from '@/types';
import { formatDuration } from '@/lib/format-utils';

interface DraggableTrackListProps {
  playlistId: string;
  tracks: PlaylistTrack[];
  isOwner: boolean;
  selectedTracks: string[];
  onTrackSelect: (trackId: string) => void;
  onPlayTrack: (track: PlaylistTrack, index: number) => void;
  onRemoveTrack: (trackId: string) => void;
  showSelection: boolean;
}

export default function DraggableTrackList({
  playlistId,
  tracks,
  isOwner,
  selectedTracks,
  onTrackSelect,
  onPlayTrack,
  onRemoveTrack,
  showSelection
}: DraggableTrackListProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const { reorderTracks } = usePlaylistStore();
  const { isPlaying, currentTrack } = usePlayerStore();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    const { destination, source } = result;
    
    if (!destination || !isOwner) {
      return;
    }

    if (destination.index === source.index) {
      return;
    }

    try {
      await reorderTracks(playlistId, source.index, destination.index);
    } catch (error) {
      console.error('Failed to reorder tracks:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="playlist-tracks" isDropDisabled={!isOwner}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              space-y-1 transition-all duration-200
              ${snapshot.isDraggingOver ? 'bg-white/5 rounded-lg p-2' : ''}
            `}
          >
            {tracks.map((playlistTrack, index) => {
              const track = playlistTrack.track;
              const isCurrentTrack = currentTrack?.id === track.id;
              const isSelected = selectedTracks.includes(track.id);

              return (
                <Draggable
                  key={playlistTrack.id}
                  draggableId={playlistTrack.id}
                  index={index}
                  isDragDisabled={!isOwner}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        group grid grid-cols-12 gap-4 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
                        ${snapshot.isDragging ? 'bg-white/20 shadow-2xl scale-105 rotate-1' : 'hover:bg-white/5'}
                        ${isSelected ? 'bg-white/10' : ''}
                        ${isCurrentTrack ? 'bg-green-500/10' : ''}
                        ${isDragging && !snapshot.isDragging ? 'opacity-50' : ''}
                      `}
                      onClick={() => !snapshot.isDragging && onPlayTrack(playlistTrack, index)}
                    >
                      {/* Drag Handle & Index */}
                      <div className="col-span-1 flex items-center space-x-2">
                        {isOwner && (
                          <div
                            {...provided.dragHandleProps}
                            className={`
                              flex items-center justify-center w-4 h-4 transition-opacity
                              ${snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                          >
                            <GripVertical className="w-3 h-3 text-zinc-400" />
                          </div>
                        )}
                        
                        {showSelection ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onTrackSelect(track.id)}
                            className="w-4 h-4 text-green-500 bg-zinc-800 border-zinc-600 rounded focus:ring-green-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            {isCurrentTrack && isPlaying ? (
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-1 h-3 bg-green-500 animate-pulse mr-0.5"></div>
                                <div className="w-1 h-2 bg-green-500 animate-pulse delay-75 mr-0.5"></div>
                                <div className="w-1 h-4 bg-green-500 animate-pulse delay-150"></div>
                              </div>
                            ) : (
                              <>
                                <span className={`text-sm ${isCurrentTrack ? 'text-green-400' : 'text-zinc-400 group-hover:hidden'}`}>
                                  {index + 1}
                                </span>
                                {!isCurrentTrack && !snapshot.isDragging && (
                                  <Play className="w-4 h-4 text-white hidden group-hover:block" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="col-span-5 flex items-center space-x-3 min-w-0">
                        <img
                          src={track.album.imageUrl || track.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop'}
                          alt={track.album.title}
                          className="w-10 h-10 rounded flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                            {track.title}
                          </h4>
                          <p className="text-sm text-zinc-400 truncate">
                            {track.artist.name}
                          </p>
                        </div>
                      </div>

                      {/* Album */}
                      <div className="col-span-2 hidden md:flex items-center">
                        <span className="text-sm text-zinc-400 truncate hover:text-white cursor-pointer">
                          {track.album.title}
                        </span>
                      </div>

                      {/* Date Added */}
                      <div className="col-span-2 hidden lg:flex items-center">
                        <span className="text-sm text-zinc-400">
                          {formatDate(playlistTrack.addedAt)}
                        </span>
                      </div>

                      {/* Duration & Actions */}
                      <div className="col-span-2 flex items-center justify-between">
                        <div className={`
                          flex items-center space-x-2 transition-opacity
                          ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                        `}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 text-zinc-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle like/unlike
                            }}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTrack(track.id);
                              }}
                              className="w-8 h-8 p-0 text-zinc-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <span className={`
                          text-sm text-zinc-400 transition-opacity
                          ${snapshot.isDragging ? 'opacity-100' : 'group-hover:opacity-0'}
                        `}>
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            
            {/* Drop Zone Indicator */}
            {snapshot.isDraggingOver && (
              <div className="p-4 border-2 border-dashed border-green-500/50 rounded-lg bg-green-500/5 text-center">
                <Music className="w-8 h-8 mx-auto text-green-500/50 mb-2" />
                <p className="text-sm text-green-500/70">Drop to reorder tracks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}