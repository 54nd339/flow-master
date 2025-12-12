/**
 * Musical note frequencies (Hz) mapped to color IDs.
 * Uses C major scale: C4 (261.63), D4 (293.66), E4 (329.63), F4 (349.23), G4 (392.00),
 * A4 (440.00), B4 (493.88), C5 (523.25), D5 (587.33), E5 (659.25).
 * Each color produces a distinct musical note when connecting dots.
 */
const COLOR_NOTES: Record<number, number> = {
  0: 261.63,
  1: 293.66,
  2: 329.63,
  3: 349.23,
  4: 392.00,
  5: 440.00,
  6: 493.88,
  7: 523.25,
  8: 587.33,
  9: 659.25,
};

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
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

  async playPopSound(colorId: number = 0) {
    if (!this.isEnabled) return;

    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const frequency = COLOR_NOTES[colorId % Object.keys(COLOR_NOTES).length] || 440;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    // Quick attack (1ms) with exponential decay for percussive "pop" sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    if (this.masterGain) {
      gainNode.connect(this.masterGain);
    }

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  async playGlissando(colors: number[] = [0, 1, 2, 3, 4]) {
    if (!this.isEnabled) return;

    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const duration = 0.6;
    const noteDuration = duration / colors.length;

    // Play notes in sequence with slight overlap for smooth glissando effect
    colors.forEach((colorId, index) => {
      const frequency = COLOR_NOTES[colorId % Object.keys(COLOR_NOTES).length] || 440;
      const startTime = this.audioContext!.currentTime + (index * noteDuration);

      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      // Smooth attack and release with sustained middle for legato effect
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + noteDuration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + noteDuration);

      oscillator.connect(gainNode);
      if (this.masterGain) {
        gainNode.connect(this.masterGain);
      }

      oscillator.start(startTime);
      oscillator.stop(startTime + noteDuration);
    });
  }

  async playColorNote(colorId: number, duration: number = 0.2) {
    if (!this.isEnabled) return;

    await this.ensureAudioContext();
    if (!this.audioContext || !this.masterGain) return;

    const frequency = COLOR_NOTES[colorId % Object.keys(COLOR_NOTES).length] || 440;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    if (this.masterGain) {
      gainNode.connect(this.masterGain);
    }

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled && this.audioContext !== null;
  }
}

export const audioEngine = new AudioEngine();
