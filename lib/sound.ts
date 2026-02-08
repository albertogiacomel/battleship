// Simple synth engine to avoid loading external assets (Cloud optimization)
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

const createNoise = (duration: number, vol: number = 0.1) => {
  const ctx = initAudio();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  
  // Lowpass filter for explosion/splash feel
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + duration);

  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start();
};

export const playGameSound = (type: 'hit' | 'miss' | 'sunk' | 'start' | 'click') => {
  try {
    switch (type) {
      case 'miss':
        // Splash sound (filtered noise)
        createNoise(0.3, 0.2); 
        break;
      case 'hit':
        // Explosion (noise + low osc)
        createNoise(0.4, 0.3);
        createOscillator('sawtooth', 50, 0.4, 0.2);
        break;
      case 'sunk':
        // Big explosion + Fanfare
        createNoise(0.8, 0.4);
        createOscillator('square', 40, 0.8, 0.3);
        setTimeout(() => createOscillator('sine', 440, 0.2, 0.1), 100);
        setTimeout(() => createOscillator('sine', 554, 0.2, 0.1), 200);
        setTimeout(() => createOscillator('sine', 659, 0.4, 0.1), 300);
        break;
      case 'start':
        // UI sci-fi startup
        createOscillator('sine', 220, 0.1, 0.1);
        setTimeout(() => createOscillator('sine', 440, 0.1, 0.1), 100);
        setTimeout(() => createOscillator('sine', 880, 0.3, 0.1), 200);
        break;
      case 'click':
        // Simple blip
        createOscillator('sine', 800, 0.05, 0.05);
        break;
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};
