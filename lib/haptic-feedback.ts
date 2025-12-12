class HapticFeedback {
  private isEnabled: boolean = true;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  playPop() {
    if (!this.isEnabled || !this.isSupported()) return;
    navigator.vibrate(10);
  }

  playCompletion() {
    if (!this.isEnabled || !this.isSupported()) return;
    navigator.vibrate([50, 30, 50]);
  }

  playCelebration() {
    if (!this.isEnabled || !this.isSupported()) return;
    navigator.vibrate([50, 30, 50, 30, 100]);
  }

  playLevelClear() {
    if (!this.isEnabled || !this.isSupported()) return;
    navigator.vibrate([100, 50, 100, 50, 150]);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isHapticEnabled(): boolean {
    return this.isEnabled && this.isSupported();
  }
}

export const hapticFeedback = new HapticFeedback();
