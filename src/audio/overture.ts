/**
 * Sound for the opening room, synthesised the same way the typewriter is.
 *
 * Same reasoning as src/audio/typewriter.ts and it applies harder here: this
 * screen would otherwise want six or seven samples — a switch, a hum, rope
 * creak, a tear, a shimmer, a whoosh — which is a couple of hundred kilobytes of
 * audio in front of a visitor CONTEXT.md section 8 tells us to assume is on a
 * bad connection. All of it below is oscillators and filtered noise. Nothing is
 * fetched, so nothing can fail to arrive.
 *
 * Nothing starts an AudioContext until a real gesture has happened. On this
 * screen that is guaranteed: the first sound is the switch, and the switch is
 * the visitor pulling the cord.
 */

/** Long enough to sweep a filter across for the tear and the exit. */
const NOISE_SECONDS = 2;

/** Everything is mixed against this, so one number sets the overall level. */
const MASTER_LEVEL = 0.6;

export type OvertureAudio = {
  /** Call from a genuine user gesture. Safe to call repeatedly. */
  unlock: () => void;
  /** The switch, on and off. */
  click: (on: boolean) => void;
  /** The bulb's drone. Held until called with false. */
  hum: (on: boolean) => void;
  /**
   * Rope under strain, 0 to 1. Pass 0 to let go — the sound stops rather than
   * fading, because a released cord is silent immediately.
   */
  strain: (tension: number) => void;
  /** The wordmark coming apart. */
  tear: () => void;
  /** The particles finding their places. */
  shimmer: () => void;
  /**
   * The room sweeping past on the way out. `direction` is -1 for a move toward
   * the left of the screen and +1 toward the right; the sound travels with it.
   */
  whoosh: (direction: number) => void;
  /** The wordmark arriving in the page. A full stop, not a flourish. */
  settle: () => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

export const createOvertureAudio = (): OvertureAudio => {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;

  /** The bulb drone, built once and then left running at whatever level. */
  let humGain: GainNode | null = null;
  /** The rope, rebuilt per grab — a looping source is not worth keeping idle. */
  let strainSource: AudioBufferSourceNode | null = null;
  let strainGain: GainNode | null = null;
  let strainFilter: BiquadFilterNode | null = null;

  const ready = () => context !== null && master !== null && context.state === 'running';

  const unlock = () => {
    if (context === null) {
      const Constructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      context = new Constructor();

      master = context.createGain();
      master.gain.value = muted ? 0 : MASTER_LEVEL;
      master.connect(context.destination);

      noise = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * NOISE_SECONDS),
        context.sampleRate,
      );
      const channel = noise.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = Math.random() * 2 - 1;
      }
    }

    if (context.state === 'suspended') {
      void context.resume();
    }
  };

  /** A one-shot burst of noise through a filter, which is most of what follows. */
  const burst = (options: {
    type: BiquadFilterType;
    from: number;
    to: number;
    peak: number;
    duration: number;
    q?: number;
    /** Stereo position at the start and end, -1 left to +1 right. */
    panFrom?: number;
    panTo?: number;
  }) => {
    if (!ready() || context === null || master === null || noise === null) return;
    const now = context.currentTime;
    const end = now + options.duration;

    const source = context.createBufferSource();
    source.buffer = noise;
    // Starting at a random point stops repeated plays sounding identical.
    const offset = Math.random() * (NOISE_SECONDS - options.duration);

    const filter = context.createBiquadFilter();
    filter.type = options.type;
    filter.Q.value = options.q ?? 1;
    filter.frequency.setValueAtTime(options.from, now);
    filter.frequency.exponentialRampToValueAtTime(options.to, end);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(options.peak, now + options.duration * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(filter).connect(gain);

    // Panning is only ever an enhancement here — on a phone speaker there is no
    // stereo field to place anything in, and the sound has to work anyway.
    if (options.panFrom !== undefined && typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner();
      panner.pan.setValueAtTime(options.panFrom, now);
      panner.pan.linearRampToValueAtTime(options.panTo ?? options.panFrom, end);
      gain.connect(panner).connect(master);
    } else {
      gain.connect(master);
    }

    source.start(now, offset, options.duration);
    source.stop(end);
  };

  const click = (on: boolean) => {
    if (!ready() || context === null || master === null) return;
    const now = context.currentTime;

    // The contact: a hard, tiny band of noise. Switching off is the same
    // mechanism releasing, which is duller and a touch lower.
    burst({
      type: 'bandpass',
      from: on ? 2600 : 1900,
      to: on ? 1500 : 900,
      peak: on ? 0.3 : 0.22,
      duration: 0.05,
      q: 2.4,
    });

    // The body of the switch housing.
    const thump = context.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(on ? 190 : 150, now);
    thump.frequency.exponentialRampToValueAtTime(70, now + 0.07);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    thump.connect(gain).connect(master);
    thump.start(now);
    thump.stop(now + 0.1);
  };

  const hum = (on: boolean) => {
    if (!ready() || context === null || master === null) return;
    const now = context.currentTime;

    if (humGain === null) {
      humGain = context.createGain();
      humGain.gain.value = 0.0001;

      // Mains hum is the fundamental and its octave; the filter takes the buzz
      // off the top so it sits under everything rather than on top of it.
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      filter.connect(humGain);

      [50, 100, 150].forEach((frequency, index) => {
        const oscillator = context!.createOscillator();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;

        const level = context!.createGain();
        level.gain.value = [0.5, 1, 0.35][index];

        oscillator.connect(level).connect(filter);
        oscillator.start(now);
      });

      humGain.connect(master);
    }

    humGain.gain.cancelScheduledValues(now);
    humGain.gain.setValueAtTime(Math.max(humGain.gain.value, 0.0001), now);
    // Filaments take a moment to settle, and cut out the instant they lose power.
    humGain.gain.exponentialRampToValueAtTime(on ? 0.05 : 0.0001, now + (on ? 0.5 : 0.12));
  };

  const strain = (tension: number) => {
    if (!ready() || context === null || master === null || noise === null) return;
    const now = context.currentTime;

    if (tension <= 0) {
      strainSource?.stop(now + 0.02);
      strainSource = null;
      strainGain = null;
      strainFilter = null;
      return;
    }

    if (strainSource === null) {
      strainSource = context.createBufferSource();
      strainSource.buffer = noise;
      strainSource.loop = true;

      strainFilter = context.createBiquadFilter();
      strainFilter.type = 'bandpass';
      strainFilter.Q.value = 7;

      strainGain = context.createGain();
      strainGain.gain.value = 0.0001;

      strainSource.connect(strainFilter).connect(strainGain).connect(master);
      strainSource.start(now);
    }

    // Both the pitch and the level climb with the pull, which is what makes it
    // read as fibre under load rather than as static.
    strainFilter!.frequency.setTargetAtTime(300 + tension * 1400, now, 0.04);
    strainGain!.gain.setTargetAtTime(0.0001 + tension * 0.06, now, 0.05);
  };

  const tear = () =>
    burst({ type: 'bandpass', from: 4200, to: 320, peak: 0.34, duration: 0.42, q: 1.6 });

  const shimmer = () => {
    if (!ready() || context === null || master === null) return;
    const now = context.currentTime;

    // Air first — the sound of a lot of small things moving at once.
    burst({ type: 'highpass', from: 900, to: 5200, peak: 0.09, duration: 1.4 });

    // Then a cluster of partials that arrive in sequence, so the settling has a
    // shape instead of being one swell. Not a chord, deliberately: this is the
    // sound of the name resolving, and a chord would make it a fanfare.
    [523.25, 783.99, 1046.5].forEach((frequency, index) => {
      const start = now + index * 0.12;
      const tone = context!.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;

      const gain = context!.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.05, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);

      tone.connect(gain).connect(master!);
      tone.start(start);
      tone.stop(start + 1.7);
    });
  };

  // Crosses the stereo field against the direction of travel, which is how a
  // room actually sounds going past you: it starts on the side you are leaving.
  const whoosh = (direction: number) =>
    burst({
      type: 'bandpass',
      from: 190,
      to: 2600,
      peak: 0.3,
      duration: 1.4,
      q: 0.7,
      panFrom: -direction,
      panTo: direction,
    });

  const settle = () => {
    if (!ready() || context === null || master === null) return;
    const now = context.currentTime;

    // Low, short, and slightly detuned against itself so it lands as weight
    // rather than as a note. This is the sound of something arriving.
    [58, 87].forEach((frequency, index) => {
      const tone = context!.createOscillator();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(frequency * 1.5, now);
      tone.frequency.exponentialRampToValueAtTime(frequency, now + 0.18);

      const gain = context!.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.16 : 0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      tone.connect(gain).connect(master!);
      tone.start(now);
      tone.stop(now + 0.75);
    });
  };

  const setMuted = (next: boolean) => {
    muted = next;
    if (context === null || master === null) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_LEVEL, now + 0.12);
  };

  const dispose = () => {
    void context?.close();
    context = null;
    master = null;
    noise = null;
    humGain = null;
    strainSource = null;
    strainGain = null;
    strainFilter = null;
  };

  return { unlock, click, hum, strain, tear, shimmer, whoosh, settle, setMuted, dispose };
};
