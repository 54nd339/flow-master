let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainStart = 0.3,
  gainEnd = 0,
) {
  const ac = getContext();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(gainStart, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(gainEnd, 0.001),
    ac.currentTime + duration,
  );
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

function playSequence(
  notes: { freq: number; delay: number; duration: number; type?: OscillatorType; gain?: number }[],
) {
  for (const n of notes) {
    setTimeout(
      () => playTone(n.freq, n.duration, n.type ?? "sine", n.gain ?? 0.25),
      n.delay * 1000,
    );
  }
}

export const audio = {
  flowStart() {
    playTone(880, 0.06, "sine", 0.15);
  },

  cellSnap() {
    playTone(1200, 0.04, "triangle", 0.1);
  },

  flowComplete() {
    playSequence([
      { freq: 660, delay: 0, duration: 0.1, gain: 0.2 },
      { freq: 880, delay: 0.08, duration: 0.12, gain: 0.2 },
    ]);
  },

  puzzleComplete() {
    playSequence([
      { freq: 523, delay: 0, duration: 0.15, gain: 0.25 },
      { freq: 659, delay: 0.12, duration: 0.15, gain: 0.25 },
      { freq: 784, delay: 0.24, duration: 0.15, gain: 0.25 },
      { freq: 1047, delay: 0.36, duration: 0.3, gain: 0.3 },
    ]);
  },

  undo() {
    playTone(440, 0.06, "triangle", 0.12);
  },
};

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const haptics = {
  flowComplete() {
    vibrate([20, 10, 20]);
  },
  puzzleComplete() {
    vibrate([50, 30, 50]);
  },
};
