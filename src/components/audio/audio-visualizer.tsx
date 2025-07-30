"use client";

import { useRef, useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AudioAnalyzerData } from "@/lib/audio/advanced-audio-engine";

interface AudioVisualizerProps {
  className?: string;
  style?: "bars" | "wave" | "circular" | "waveform";
  height?: number;
  width?: number;
  barCount?: number;
  onClose?: () => void;
}

export function AudioVisualizer({
  className,
  style = "bars",
  height = 200,
  width,
  barCount = 64,
  onClose,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [analyzerData, setAnalyzerData] = useState<AudioAnalyzerData | null>(null);
  const [visualizerStyle, setVisualizerStyle] = useState(style);
  
  const { isPlaying, isVisualizerEnabled } = usePlayerStore();

  // Simulate analyzer data for demo purposes
  // In real implementation, this would come from the audio engine
  useEffect(() => {
    if (!isPlaying || !isVisualizerEnabled) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const generateMockData = (): AudioAnalyzerData => {
      const frequencyData = new Uint8Array(barCount);
      const timeDomainData = new Uint8Array(barCount);
      
      // Generate realistic frequency data
      for (let i = 0; i < barCount; i++) {
        // Simulate music frequency distribution (more energy in lower frequencies)
        const baseLevel = Math.random() * 50;
        const frequencyWeight = Math.pow(1 - (i / barCount), 1.5);
        const musicLevel = baseLevel + (Math.random() * 100 * frequencyWeight);
        const rhythmBoost = Math.sin(Date.now() * 0.01 + i * 0.1) * 30;
        
        frequencyData[i] = Math.min(255, Math.max(0, musicLevel + rhythmBoost));
        timeDomainData[i] = 128 + Math.sin(Date.now() * 0.005 + i * 0.2) * 50;
      }
      
      // Calculate RMS and peak
      let rms = 0;
      let peak = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        const sample = timeDomainData[i];
        if (sample === undefined) continue;
        const value = (sample - 128) / 128;
        rms += value * value;
        peak = Math.max(peak, Math.abs(value));
      }
      rms = Math.sqrt(rms / timeDomainData.length);
      
      return { frequencyData, timeDomainData, rms, peak };
    };

    const animate = () => {
      setAnalyzerData(generateMockData());
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isVisualizerEnabled, barCount]);

  // Draw visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzerData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { frequencyData, timeDomainData, rms, peak } = analyzerData;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.fillStyle = "rgba(15, 23, 42, 0.3)"; // Dark blue with transparency for trail effect
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    switch (visualizerStyle) {
      case "bars":
        drawBars(ctx, frequencyData, canvasWidth, canvasHeight);
        break;
      case "wave":
        drawWave(ctx, timeDomainData, canvasWidth, canvasHeight);
        break;
      case "circular":
        drawCircular(ctx, frequencyData, canvasWidth, canvasHeight);
        break;
      case "waveform":
        drawWaveform(ctx, timeDomainData, canvasWidth, canvasHeight, rms, peak);
        break;
    }
  }, [analyzerData, visualizerStyle]);

  const drawBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    const barWidth = width / data.length;
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, "#1DB954");
    gradient.addColorStop(0.5, "#1ED760");
    gradient.addColorStop(1, "#4ADE80");

    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      if (sample === undefined) continue;
      const barHeight = (sample / 255) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      // Create glow effect
      ctx.shadowColor = "#1DB954";
      ctx.shadowBlur = 10;
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Reset shadow
      ctx.shadowBlur = 0;
    }
  };

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#1DB954";
    ctx.shadowColor = "#1DB954";
    ctx.shadowBlur = 5;
    
    ctx.beginPath();
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      if (sample === undefined) continue;
      const v = sample / 128;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    ctx.lineWidth = 2;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
    gradient.addColorStop(0, "#1DB954");
    gradient.addColorStop(1, "#065F46");
    
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2;
      const sample = data[i];
      if (sample === undefined) continue;
      const barHeight = (sample / 255) * radius;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);
      
      ctx.strokeStyle = gradient;
      ctx.shadowColor = "#1DB954";
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  };

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    width: number,
    height: number,
    rms: number,
    peak: number
  ) => {
    const centerY = height / 2;
    
    // Draw waveform
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#1DB954";
    ctx.shadowColor = "#1DB954";
    ctx.shadowBlur = 3;
    
    ctx.beginPath();
    const sliceWidth = width / data.length;
    
    for (let i = 0; i < data.length; i++) {
      const x = i * sliceWidth;
      const sample = data[i];
      if (sample === undefined) continue;
      const v = (sample - 128) / 128;
      const y = centerY + v * (height / 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw RMS level
    ctx.fillStyle = "rgba(29, 185, 84, 0.2)";
    ctx.fillRect(0, centerY - (rms * height / 2), width, rms * height);
    
    // Draw peak level
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY - (peak * height / 2));
    ctx.lineTo(width, centerY - (peak * height / 2));
    ctx.moveTo(0, centerY + (peak * height / 2));
    ctx.lineTo(width, centerY + (peak * height / 2));
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  };

  const handleStyleChange = (newStyle: typeof visualizerStyle) => {
    setVisualizerStyle(newStyle);
  };

  if (!isVisualizerEnabled) {
    return (
      <div className={cn(
        "audio-visualizer bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center",
        className
      )}>
        <div className="text-center text-gray-400">
          <p className="text-sm">Audio visualizer is disabled</p>
          <p className="text-xs mt-1">Enable it from the player controls</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "audio-visualizer bg-gray-800 rounded-lg border border-gray-700 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-white">Audio Visualizer</h3>
          {!isPlaying && (
            <span className="text-xs text-gray-400">(Paused)</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Style selector */}
          <select
            value={visualizerStyle}
            onChange={(e) => handleStyleChange(e.target.value as typeof visualizerStyle)}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value="bars">Bars</option>
            <option value="wave">Wave</option>
            <option value="circular">Circular</option>
            <option value="waveform">Waveform</option>
          </select>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white h-6 w-6 p-0"
              onClick={onClose}
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width || 400}
          height={height}
          className="w-full block bg-gray-900"
          style={{ height: `${height}px` }}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="text-center text-gray-400">
              <div className="w-12 h-12 border-2 border-gray-600 rounded-full mb-2 mx-auto" />
              <p className="text-xs">Play music to see visualization</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-700">
        Style: {visualizerStyle.charAt(0).toUpperCase() + visualizerStyle.slice(1)} • 
        Bars: {barCount} • 
        Rate: 60fps
      </div>
    </div>
  );
}