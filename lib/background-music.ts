/**
 * Zen ambient background music generator
 * Creates peaceful, minimal soundscapes using Web Audio API
 */
class BackgroundMusic {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private loopTimeoutId: NodeJS.Timeout | null = null;
  private isStarting: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];

  // Simple pentatonic scale for zen feel (C, D, E, G, A)
  private readonly scale = [261.63, 293.66, 329.63, 392.00, 440.00];
  private currentNoteIndex: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
      this.isEnabled = false;
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      await this.initAudioContext();
    }
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async start() {
    // Prevent concurrent starts
    if (this.isStarting || this.isPlaying) {
      return;
    }

    this.isStarting = true;
    
    // Force stop any existing playback completely
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (!this.isEnabled) {
      this.isStarting = false;
      return;
    }
    
    await this.ensureAudioContext();
    if (!this.audioContext) {
      this.isStarting = false;
      return;
    }

    // Double check after delay
    if (this.isPlaying) {
      this.stop();
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    this.isPlaying = true;
    this.isStarting = false;
    this.currentNoteIndex = 0;

    // Create master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.08;
    this.masterGain.connect(this.audioContext.destination);

    // Start zen ambient loop
    this.playZenLoop();
  }

  private playZenLoop() {
    if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const noteDuration = 4.0; // Slow, meditative notes
    
    // Select note from pentatonic scale with gentle progression
    const noteFreq = this.scale[this.currentNoteIndex];
    
    // Create soft sine wave tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = noteFreq;
    
    // Very gentle attack and release for zen feel
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    gain.gain.linearRampToValueAtTime(0.15, now + noteDuration - 1.5);
    gain.gain.linearRampToValueAtTime(0, now + noteDuration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + noteDuration);
    
    this.activeOscillators.push(osc);
    this.activeGains.push(gain);

    // Move to next note in scale (with some randomness for variation)
    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.scale.length;
    
    // Occasionally skip a note for more variation
    if (Math.random() < 0.2) {
      this.currentNoteIndex = (this.currentNoteIndex + 1) % this.scale.length;
    }

    // Schedule next note
    if (this.isPlaying) {
      this.loopTimeoutId = setTimeout(() => {
        if (this.isPlaying) {
          this.playZenLoop();
        }
      }, noteDuration * 1000);
    }
  }

  stop() {
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    this.isStarting = false;
    
    // Cancel scheduled operations
    if (this.loopTimeoutId) {
      clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }
    
    // Mute master gain immediately
    if (this.masterGain && this.audioContext) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
      } catch (e) {}
    }
    
    // Stop all oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
    
    // Disconnect all gain nodes
    this.activeGains.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) {}
    });
    this.activeGains = [];
    
    // Disconnect master gain
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isMusicEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const backgroundMusic = new BackgroundMusic();
