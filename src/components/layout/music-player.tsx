"use client";

import { usePlayerStore } from "@/stores/player-store";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { CompactSkipCounter } from "@/components/subscription/skip-counter";
import { AdPlayer, MiniAdPlayer } from "@/components/subscription/ad-player";
import { TierBadge } from "@/components/subscription/tier-badge";
import { UpgradePrompt, useUpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { CompactEqualizerToggle } from "@/components/premium/premium-equalizer";
import { CompactCrossfadeToggle } from "@/components/premium/crossfade-control";
import { DownloadButton } from "@/components/premium/offline-downloads";
import { TierManager } from "@/lib/subscription/tier-manager";
import { Settings } from "lucide-react";

interface MusicPlayerProps {
  className?: string;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
  const { user } = useAuthStore();
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    shuffleMode,
    crossfadeDuration,
    isEqualizerEnabled,
    togglePlayPause,
    nextTrack: _nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    setRepeatMode,
    toggleShuffle,
    setCrossfadeDuration,
    toggleEqualizer,
    attemptSkip,
    // getSkipStatus,
    getCurrentAd,
  } = usePlayerStore();

  const [isLiked, setIsLiked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showExpandedAd, setShowExpandedAd] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const { showUpgradePrompt, hideUpgradePrompt, ...upgradePromptState } = useUpgradePrompt();
  
  // Check if currently playing an ad
  const currentAd = getCurrentAd();
  const qualityInfo = { quality: 'high' as const, isLimited: false, isDowngraded: false };

  // Handle progress bar click and drag
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    seekTo(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || duration === 0) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;

      seekTo(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, seekTo]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleRepeatClick = () => {
    const modes: Array<"off" | "context" | "track"> = ["off", "context", "track"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length] || "off";
    setRepeatMode(nextMode);
  };

  const handleNextTrack = async () => {
    const skipResult = await attemptSkip(user);
    if (!skipResult) {
      showUpgradePrompt({
        featureId: 'unlimited_skips',
        title: 'Skip Limit Reached',
        description: 'You\'ve reached your hourly skip limit. Upgrade to Premium for unlimited skips.',
        ctaText: 'Get Unlimited Skips'
      });
    }
  };

  const handlePreviousTrack = () => {
    previousTrack();
  };

  const handleEqualizerToggle = () => {
    if (!TierManager.hasFeatureAccess(user, 'equalizer_access')) {
      showUpgradePrompt({
        featureId: 'equalizer_access',
        title: 'Premium Equalizer',
        description: 'Fine-tune your audio with our advanced equalizer',
        ctaText: 'Unlock Equalizer'
      });
      return;
    }
    toggleEqualizer();
  };

  const handleCrossfadeToggle = () => {
    if (!TierManager.hasFeatureAccess(user, 'crossfade')) {
      showUpgradePrompt({
        featureId: 'crossfade',
        title: 'Crossfade',
        description: 'Seamless transitions between tracks',
        ctaText: 'Enable Crossfade'
      });
      return;
    }
    // Toggle crossfade by setting duration to 0 or default value
    setCrossfadeDuration(crossfadeDuration > 0 ? 0 : 3);
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  // Show ad player if ad is playing
  if (currentAd) {
    return (
      <>
        {showExpandedAd ? (
          <AdPlayer
            user={user}
            onAdComplete={() => setShowExpandedAd(false)}
            className="fixed bottom-0 left-0 right-0 z-50"
          />
        ) : (
          <MiniAdPlayer
            user={user}
            onExpand={() => setShowExpandedAd(true)}
            className="fixed bottom-0 left-0 right-0 z-50"
          />
        )}
        
        <UpgradePrompt
          isOpen={upgradePromptState.isOpen}
          onClose={hideUpgradePrompt}
          user={user}
          featureId={upgradePromptState.featureId}
          title={upgradePromptState.title}
          description={upgradePromptState.description}
          ctaText={upgradePromptState.ctaText}
          targetTier={upgradePromptState.targetTier}
        />
      </>
    );
  }

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "music-player-bar fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-4 bg-gray-900 border-t border-gray-800",
          className,
        )}
      >
      {/* Left Section - Current Track Info */}
      <div className="flex w-1/4 items-center space-x-3">
        <div className="relative h-12 w-12 overflow-hidden rounded">
          {currentTrack.imageUrl ? (
            <Image
              src={currentTrack.imageUrl}
              alt={currentTrack.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          
          {/* Settings indicator */}
          {qualityInfo && (
            <div className="absolute -top-1 -right-1">
              <div className={`text-xs px-1 rounded text-white ${
                qualityInfo.quality === 'high' ? 'bg-green-500' :
                qualityInfo.quality === 'medium' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}>
                {qualityInfo.quality === 'high' ? 'HD' :
                 qualityInfo.quality === 'medium' ? 'MQ' : 'LQ'}
              </div>
            </div>
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="truncate text-sm font-medium text-white">
              {currentTrack.title}
            </h4>
            <TierBadge user={user} size="sm" />
          </div>
          <p className="truncate text-xs text-gray-300">
            {currentTrack.artist.name}
          </p>
          
          {/* Skip counter for free users */}
          <CompactSkipCounter 
            user={user} 
            onUpgradeClick={() => showUpgradePrompt({
              featureId: 'unlimited_skips'
            })} 
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <DownloadButton 
            track={currentTrack} 
            user={user} 
            size="sm" 
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-300 hover:text-white"
            onClick={() => setIsLiked(!isLiked)}
          >
            {isLiked ? (
              <HeartIconSolid className="h-4 w-4 text-spotify-green" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Center Section - Player Controls */}
      <div className="flex w-1/2 flex-col items-center space-y-2">
        {/* Control Buttons */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-11 w-11 text-gray-300 hover:text-white", // Increased for touch targets
              shuffleMode && "text-spotify-green",
            )}
            onClick={toggleShuffle}
            aria-label={shuffleMode ? "Disable shuffle" : "Enable shuffle"}
            aria-pressed={shuffleMode}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-gray-300 hover:text-white" // Increased for touch targets
            onClick={handlePreviousTrack}
            aria-label="Previous track"
          >
            <BackwardIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

          <Button
            variant="spotify"
            size="icon"
            className="h-12 w-12" // Increased for touch targets
            onClick={togglePlayPause}
            aria-label={
              isPlaying 
                ? `Pause ${currentTrack.title} by ${currentTrack.artist.name}` 
                : `Play ${currentTrack.title} by ${currentTrack.artist.name}`
            }
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <PlayIcon className="h-6 w-6 ml-0.5" aria-hidden="true" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-gray-300 hover:text-white" // Increased for touch targets
            onClick={handleNextTrack}
            aria-label="Next track"
          >
            <ForwardIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-11 w-11 text-gray-300 hover:text-white", // Increased for touch targets
              repeatMode !== "off" && "text-spotify-green",
            )}
            onClick={handleRepeatClick}
            aria-label={
              repeatMode === "off" ? "Enable repeat" :
              repeatMode === "context" ? "Repeat playlist" :
              "Repeat current track"
            }
            aria-pressed={repeatMode !== "off"}
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            {repeatMode === "track" && (
              <span 
                className="absolute -bottom-1 -right-1 h-1.5 w-1.5 rounded-full bg-spotify-green"
                aria-hidden="true"
              ></span>
            )}
          </Button>
        </div>

        {/* Premium Controls Row */}
        <div className="flex items-center space-x-2">
          <CompactEqualizerToggle
            user={user}
            enabled={isEqualizerEnabled}
            onToggle={handleEqualizerToggle}
          />
          
          <CompactCrossfadeToggle
            user={user}
            enabled={crossfadeDuration > 0}
            duration={crossfadeDuration}
            onToggle={handleCrossfadeToggle}
            onDurationChange={setCrossfadeDuration}
          />
          
          {qualityInfo && qualityInfo.isDowngraded && (
            <button
              onClick={() => showUpgradePrompt({
                featureId: 'high_quality_audio',
                title: 'High Settings Audio',
                description: 'Upgrade to Premium for crystal clear 320kbps audio',
                ctaText: 'Upgrade Audio Settings'
              })}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <Settings className="w-3 h-3" />
              <span>Settings Limited</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex w-full max-w-lg items-center space-x-2 text-xs text-gray-300">
          <span className="w-10 text-right" aria-label={`Elapsed time: ${formatDuration(progress)}`}>
            {formatDuration(progress)}
          </span>
          
          <div
            ref={progressBarRef}
            className="relative flex-1 h-2 bg-gray-600 rounded-full cursor-pointer" // Increased height for touch
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            role="progressbar"
            aria-label="Track progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={progress}
            aria-valuetext={`${formatDuration(progress)} of ${formatDuration(duration)}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                seekTo(Math.max(0, progress - 10));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                seekTo(Math.min(duration, progress + 10));
              }
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            {(isDragging || document.activeElement === progressBarRef.current) && (
              <div
                className="absolute top-1/2 h-4 w-4 bg-white rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
                style={{ left: `${progressPercentage}%` }}
              />
            )}
          </div>
          
          <span className="w-10" aria-label={`Total duration: ${formatDuration(duration)}`}>
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Right Section - Volume Control */}
      <div className="flex w-1/4 items-center justify-end space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-gray-300 hover:text-white" // Increased for touch targets
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          aria-label={volume === 0 ? "Unmute" : "Mute"}
          aria-pressed={volume === 0}
        >
          {volume === 0 ? (
            <SpeakerXMarkIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider" // Increased height
            aria-label="Volume control"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            aria-valuetext={`Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>
      </div>
      
      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={upgradePromptState.isOpen}
        onClose={hideUpgradePrompt}
        user={user}
        featureId={upgradePromptState.featureId}
        title={upgradePromptState.title}
        description={upgradePromptState.description}
        ctaText={upgradePromptState.ctaText}
        targetTier={upgradePromptState.targetTier}
      />
    </>
  );
}

// Custom slider styles
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .slider:hover::-webkit-slider-thumb {
    opacity: 1;
  }
  
  .slider::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    border: none;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .slider:hover::-moz-range-thumb {
    opacity: 1;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = sliderStyles;
  document.head.appendChild(style);
}