// Simple script to generate tone-based audio for testing
// This creates sine wave audio files of different frequencies

const fs = require('fs');
const path = require('path');

function generateTone(frequency, duration, sampleRate = 44100) {
  const samples = duration * sampleRate;
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    buffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
  }
  
  return buffer;
}

function floatTo16BitPCM(input) {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return buffer;
}

function writeWAV(samples, sampleRate = 44100) {
  const buffer = floatTo16BitPCM(samples);
  const length = buffer.byteLength;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);
  
  const samples16 = new Uint8Array(buffer);
  for (let i = 0; i < samples16.length; i++) {
    view.setUint8(44 + i, samples16[i]);
  }
  
  return arrayBuffer;
}

// Generate test audio files
const audioDir = path.join(__dirname, '..', 'public', 'audio');

// Create different tones for testing
const tracks = [
  { name: 'track-1.wav', frequency: 440, duration: 30 }, // A4
  { name: 'track-2.wav', frequency: 523.25, duration: 30 }, // C5
  { name: 'track-3.wav', frequency: 659.25, duration: 30 }, // E5
  { name: 'track-4.wav', frequency: 783.99, duration: 30 }, // G5
  { name: 'track-5.wav', frequency: 880, duration: 30 }, // A5
];

tracks.forEach(track => {
  console.log(`Generating ${track.name}...`);
  const samples = generateTone(track.frequency, track.duration);
  const wavBuffer = writeWAV(samples);
  const filePath = path.join(audioDir, track.name);
  
  fs.writeFileSync(filePath, Buffer.from(wavBuffer));
  console.log(`Generated ${track.name} (${track.frequency}Hz, ${track.duration}s)`);
});

console.log('All test audio files generated successfully!');