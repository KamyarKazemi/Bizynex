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
  /**
   * Which opening is playing. Only meaningful while `intro` is `playing`.
   * The overture is the WebGL room; the curtain is the typed panel that needs
   * nothing but CSS. See useIntroGate for which device gets which.
   */
  introMode: IntroMode;
  /**
   * Mirrors the `data-theme` attribute, which the inline boot script sets before
   * first paint. React never decides the theme — it only reads back what is
   * already on screen, so there is nothing to flash.
   */
  theme: Theme;
};

export type Theme = 'light' | 'dark';

export type IntroMode = 'overture' | 'curtain';

const initialState: CapabilityState = {
  hasPainted: false,
  // Assume the most conservative environment until the browser tells us
  // otherwise, so the static fallback is what renders if detection never runs.
  prefersReducedMotion: true,
  supportsWebgl: false,
  isLowMemory: true,
  intro: 'undecided',
  introMode: 'curtain',
  theme: 'light',
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
    /** `null` means this visitor gets no opening at all. */
    resolveIntro: (state, action: PayloadAction<IntroMode | null>) => {
      if (action.payload === null) {
        state.intro = 'done';
        return;
      }
      state.intro = 'playing';
      state.introMode = action.payload;
    },
    finishIntro: (state) => {
      state.intro = 'done';
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  markPainted,
  setReducedMotion,
  setDeviceSupport,
  resolveIntro,
  finishIntro,
  setTheme,
} = capabilitySlice.actions;
export const capabilityReducer = capabilitySlice.reducer;

export const selectIntroPlaying = (state: { capability: CapabilityState }) =>
  state.capability.intro === 'playing';

export const selectIntroMode = (state: { capability: CapabilityState }) =>
  state.capability.introMode;

export const selectTheme = (state: { capability: CapabilityState }) => state.capability.theme;

/** Every condition in CLAUDE.md section 7 that must hold before WebGL mounts. */
export const selectCanvasEnabled = (state: { capability: CapabilityState }) =>
  state.capability.hasPainted &&
  state.capability.supportsWebgl &&
  !state.capability.isLowMemory &&
  !state.capability.prefersReducedMotion;
