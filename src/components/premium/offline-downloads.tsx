'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Check, X, Wifi, WifiOff, HardDrive, Clock } from 'lucide-react';
import { Track, User, OfflineTrack, OfflinePlaylist } from '@/types';
import { featureGate } from '@/lib/subscription/feature-gate';
import { TierManager } from '@/lib/subscription/tier-manager';
import { Button } from '@/components/ui/button';

interface OfflineDownloadsProps {
  user: User | null;
  tracks?: Track[];
  className?: string;
}

// Mock offline storage
class OfflineStorageService {
  private downloads: Map<string, OfflineTrack> = new Map();
  private offlinePlaylists: Map<string, OfflinePlaylist> = new Map();

  downloadTrack(track: Track, quality: 'low' | 'medium' | 'high' = 'high'): Promise<OfflineTrack> {
    return new Promise((resolve) => {
      // Simulate download time
      setTimeout(() => {
        const offlineTrack: OfflineTrack = {
          trackId: track.id,
          downloadedAt: new Date(),
          quality,
          size: this.calculateSize(track.duration, quality),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
        
        this.downloads.set(track.id, offlineTrack);
        resolve(offlineTrack);
      }, Math.random() * 3000 + 1000); // 1-4 second download
    });
  }

  removeDownload(trackId: string): boolean {
    return this.downloads.delete(trackId);
  }

  isDownloaded(trackId: string): boolean {
    return this.downloads.has(trackId);
  }

  getDownload(trackId: string): OfflineTrack | null {
    return this.downloads.get(trackId) || null;
  }

  getAllDownloads(): OfflineTrack[] {
    return Array.from(this.downloads.values());
  }

  getTotalSize(): number {
    return Array.from(this.downloads.values()).reduce((total, track) => total + track.size, 0);
  }

  private calculateSize(durationSeconds: number, quality: 'low' | 'medium' | 'high'): number {
    const bitrates = { low: 96, medium: 160, high: 320 };
    const bitrate = bitrates[quality];
    return (bitrate * durationSeconds) / 8 / 1024; // Convert to MB
  }
}

const offlineStorage = new OfflineStorageService();

export function OfflineDownloads({ user, tracks = [], className = '' }: OfflineDownloadsProps) {
  const [downloads, setDownloads] = useState<Map<string, 'downloading' | 'downloaded' | 'error'>>(new Map());
  const [totalSize, setTotalSize] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialize download states
    const initialStates = new Map();
    tracks.forEach(track => {
      if (offlineStorage.isDownloaded(track.id)) {
        initialStates.set(track.id, 'downloaded');
      }
    });
    setDownloads(initialStates);
    setTotalSize(offlineStorage.getTotalSize());

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tracks]);

  const handleDownload = async (track: Track) => {
    if (!user) return;

    // Check feature access
    const accessResult = await featureGate.useFeature(user, 'offline_downloads', track);
    
    if (!accessResult.success) {
      // Show upgrade prompt or error
      console.log('Download not allowed:', accessResult.error);
      return;
    }

    // Start download
    setDownloads(prev => new Map(prev.set(track.id, 'downloading')));
    
    try {
      await offlineStorage.downloadTrack(track);
      setDownloads(prev => new Map(prev.set(track.id, 'downloaded')));
      setTotalSize(offlineStorage.getTotalSize());
    } catch (error) {
      setDownloads(prev => new Map(prev.set(track.id, 'error')));
      console.error('Download failed:', error);
    }
  };

  const handleRemoveDownload = (track: Track) => {
    const removed = offlineStorage.removeDownload(track.id);
    if (removed) {
      setDownloads(prev => {
        const newMap = new Map(prev);
        newMap.delete(track.id);
        return newMap;
      });
      setTotalSize(offlineStorage.getTotalSize());
    }
  };

  const getDownloadButton = (track: Track) => {
    const downloadState = downloads.get(track.id);
    
    switch (downloadState) {
      case 'downloading':
        return (
          <Button
            disabled
            variant="ghost"
            size="sm"
            className="text-blue-600"
          >
            <Clock className="w-4 h-4 animate-spin mr-1" />
            Downloading...
          </Button>
        );
        
      case 'downloaded':
        return (
          <Button
            onClick={() => handleRemoveDownload(track)}
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-red-600"
          >
            <Check className="w-4 h-4 mr-1" />
            Downloaded
          </Button>
        );
        
      case 'error':
        return (
          <Button
            onClick={() => handleDownload(track)}
            variant="ghost"
            size="sm"
            className="text-red-600"
          >
            <X className="w-4 h-4 mr-1" />
            Retry
          </Button>
        );
        
      default:
        return (
          <Button
            onClick={() => handleDownload(track)}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600"
            disabled={!TierManager.hasFeatureAccess(user, 'offline_downloads')}
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        );
    }
  };

  if (!user) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Offline Downloads</h3>
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {totalSize.toFixed(1)} MB used
        </div>
      </div>

      {/* Premium Gate */}
      {!TierManager.hasFeatureAccess(user, 'offline_downloads') && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-full">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800">
                Offline Downloads - Premium Feature
              </h4>
              <p className="text-sm text-yellow-700">
                Download your favorite music and listen offline anywhere, anytime.
              </p>
            </div>
          </div>
          <Button
            className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => {
              // Show upgrade prompt
              console.log('Show upgrade prompt for offline downloads');
            }}
          >
            Upgrade to Premium
          </Button>
        </div>
      )}

      {/* Track List */}
      <div className="space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {track.imageUrl && (
                <Image
                  src={track.imageUrl}
                  alt={track.title}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{track.title}</p>
                <p className="text-sm text-gray-600">{track.artist.name}</p>
              </div>
            </div>
            
            {getDownloadButton(track)}
          </div>
        ))}
      </div>

      {/* Download Management */}
      {downloads.size > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">
            Download Management
          </h4>
          
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Total downloads:</span>
              <span>{downloads.size} tracks</span>
            </div>
            <div className="flex justify-between">
              <span>Storage used:</span>
              <span>{totalSize.toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Expires:</span>
              <span>In 30 days</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-blue-600 border-blue-200"
            onClick={() => {
              // Clear all downloads
              tracks.forEach(track => {
                if (offlineStorage.isDownloaded(track.id)) {
                  handleRemoveDownload(track);
                }
              });
            }}
          >
            Clear All Downloads
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact download button for individual tracks
interface DownloadButtonProps {
  track: Track;
  user: User | null;
  size?: 'sm' | 'md';
  showText?: boolean;
}

export function DownloadButton({ 
  track, 
  user, 
  size = 'md', 
  showText = false 
}: DownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'downloaded' | 'error'>('idle');
  
  useEffect(() => {
    if (offlineStorage.isDownloaded(track.id)) {
      setDownloadState('downloaded');
    }
  }, [track.id]);

  const handleDownload = async () => {
    if (!user || !TierManager.hasFeatureAccess(user, 'offline_downloads')) {
      // Show upgrade prompt
      return;
    }

    setDownloadState('downloading');
    
    try {
      await offlineStorage.downloadTrack(track);
      setDownloadState('downloaded');
    } catch (_error) {
      setDownloadState('error');
    }
  };

  const handleRemove = () => {
    offlineStorage.removeDownload(track.id);
    setDownloadState('idle');
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'p-1' : 'p-2';

  const getButtonContent = () => {
    switch (downloadState) {
      case 'downloading':
        return (
          <>
            <Clock className={`${iconSize} animate-spin`} />
            {showText && <span>Downloading</span>}
          </>
        );
        
      case 'downloaded':
        return (
          <>
            <Check className={iconSize} />
            {showText && <span>Downloaded</span>}
          </>
        );
        
      case 'error':
        return (
          <>
            <X className={iconSize} />
            {showText && <span>Retry</span>}
          </>
        );
        
      default:
        return (
          <>
            <Download className={iconSize} />
            {showText && <span>Download</span>}
          </>
        );
    }
  };

  return (
    <button
      onClick={downloadState === 'downloaded' ? handleRemove : handleDownload}
      disabled={downloadState === 'downloading'}
      className={`
        ${buttonSize} rounded-full transition-colors
        ${downloadState === 'downloaded' 
          ? 'text-green-600 hover:text-red-600' 
          : 'text-gray-600 hover:text-blue-600'
        }
        ${downloadState === 'downloading' ? 'opacity-50 cursor-not-allowed' : ''}
        ${showText ? 'px-3 flex items-center space-x-1' : ''}
      `}
      title={
        downloadState === 'downloaded' ? 'Remove download' : 
        downloadState === 'downloading' ? 'Downloading...' : 
        'Download for offline listening'
      }
    >
      {getButtonContent()}
    </button>
  );
}