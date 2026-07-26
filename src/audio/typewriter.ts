/**
 * Typewriter sound, synthesised rather than loaded.
 *
 * A sampled .mp3 would be 20-40 KB from our own origin, need a licence, and add
 * a request that CONTEXT.md section 8 says to assume is slow. This is a filtered
 * noise burst and a low thump built at runtime: zero bytes over the wire, no
 * third party, and it still works with the network gone.
 *
 * Nothing here starts an AudioContext until a real user gesture has happened —
 * browsers block audio before one, and a page that tries anyway just logs
 * errors.
 */

type KeySound = {
  /** Call from a genuine user gesture. Safe to call repeatedly. */
  unlock: () => void;
  /** Silent until unlock() has succeeded. */
  key: () => void;
  /** The carriage-return bell, for the end of the line. */
  bell: () => void;
  dispose: () => void;
};

const NOISE_SECONDS = 0.06;

export const createKeySound = (): KeySound => {
  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;

  const ready = () => context !== null && context.state === 'running';

  const unlock = () => {
    if (context === null) {
      const Constructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      context = new Constructor();

      noise = context.createBuffer(1, Math.ceil(context.sampleRate * NOISE_SECONDS), context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = Math.random() * 2 - 1;
      }
    }

    if (context.state === 'suspended') {
      void context.resume();
    }
  };

  const key = () => {
    if (!ready() || context === null || noise === null) return;
    const now = context.currentTime;

    // The strike: a short band of noise around 2 kHz, gone in 40ms.
    const source = context.createBufferSource();
    source.buffer = noise;

    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    // Jittered per keypress so a run of characters does not sound mechanical.
    band.frequency.value = 1800 + Math.random() * 900;
    band.Q.value = 1.1;

    const strike = context.createGain();
    strike.gain.setValueAtTime(0.0001, now);
    strike.gain.exponentialRampToValueAtTime(0.16, now + 0.002);
    strike.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    source.connect(band).connect(strike).connect(context.destination);
    source.start(now);
    source.stop(now + NOISE_SECONDS);

    // The body: a low thump so it reads as a machine, not a click track.
    const thump = context.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(70, now + 0.05);

    const thumpGain = context.createGain();
    thumpGain.gain.setValueAtTime(0.0001, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.07, now + 0.004);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    thump.connect(thumpGain).connect(context.destination);
    thump.start(now);
    thump.stop(now + 0.08);
  };

  const bell = () => {
    if (!ready() || context === null) return;
    const now = context.currentTime;

    const tone = context.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = 1620;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    tone.connect(gain).connect(context.destination);
    tone.start(now);
    tone.stop(now + 1);
  };

  const dispose = () => {
    void context?.close();
    context = null;
    noise = null;
  };

  return { unlock, key, bell, dispose };
};
