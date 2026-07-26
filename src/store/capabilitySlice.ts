import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type CapabilityState = {
  /** True once the page has painted. The canvas never blocks first paint. */
  hasPainted: boolean;
  prefersReducedMotion: boolean;
  supportsWebgl: boolean;
  isLowMemory: boolean;
  /**
   * `undecided` until the browser has been asked about reduced motion and
   * whether this session has already seen the curtain. Server-rendered markup is
   * always `undecided`, which renders nothing.
   */
  intro: 'undecided' | 'playing' | 'done';
};

const initialState: CapabilityState = {
  hasPainted: false,
  // Assume the most conservative environment until the browser tells us
  // otherwise, so the static fallback is what renders if detection never runs.
  prefersReducedMotion: true,
  supportsWebgl: false,
  isLowMemory: true,
  intro: 'undecided',
};

const capabilitySlice = createSlice({
  name: 'capability',
  initialState,
  reducers: {
    markPainted: (state) => {
      state.hasPainted = true;
    },
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.prefersReducedMotion = action.payload;
    },
    setDeviceSupport: (
      state,
      action: PayloadAction<{ supportsWebgl: boolean; isLowMemory: boolean }>,
    ) => {
      state.supportsWebgl = action.payload.supportsWebgl;
      state.isLowMemory = action.payload.isLowMemory;
    },
    resolveIntro: (state, action: PayloadAction<boolean>) => {
      state.intro = action.payload ? 'playing' : 'done';
    },
    finishIntro: (state) => {
      state.intro = 'done';
    },
  },
});

export const { markPainted, setReducedMotion, setDeviceSupport, resolveIntro, finishIntro } =
  capabilitySlice.actions;
export const capabilityReducer = capabilitySlice.reducer;

export const selectIntroPlaying = (state: { capability: CapabilityState }) =>
  state.capability.intro === 'playing';

/** Every condition in CLAUDE.md section 7 that must hold before WebGL mounts. */
export const selectCanvasEnabled = (state: { capability: CapabilityState }) =>
  state.capability.hasPainted &&
  state.capability.supportsWebgl &&
  !state.capability.isLowMemory &&
  !state.capability.prefersReducedMotion;
