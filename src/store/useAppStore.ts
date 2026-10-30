import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Lang = 'de' | 'en';
export type AudioState = 'off' | 'starting' | 'on' | 'error';

/** Source position in listener (camera) space: +x right, +y up, -z straight ahead. */
export interface EmitterPosition {
  x: number;
  y: number;
  z: number;
}

interface AppState {
  lang: Lang;
  audioState: AudioState;
  /** Latest output peak, 0..1. Updated often — read via getState() in render loops. */
  level: number;
  /** Per-emitter output peak, 0..1. Read via getState() in render loops. */
  voiceLevels: number[];
  /** Listener-relative emitter positions for the audio engine, throttled from the scene. */
  emitters: EmitterPosition[];
  /** True once the visitor has grabbed an emitter; hides the onboarding cue. */
  interacted: boolean;
  setLang: (lang: Lang) => void;
  setAudioState: (state: AudioState) => void;
  setLevel: (level: number) => void;
  setVoiceLevel: (index: number, level: number) => void;
  setEmitters: (emitters: EmitterPosition[]) => void;
  setInteracted: () => void;
}

const detectLang = (): Lang =>
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: detectLang(),
      audioState: 'off',
      level: 0,
      voiceLevels: [0, 0, 0, 0],
      emitters: [],
      interacted: false,
      setLang: (lang) => set({ lang }),
      setAudioState: (audioState) => set({ audioState }),
      setLevel: (level) => set({ level }),
      setVoiceLevel: (index, level) =>
        set((s) => {
          const voiceLevels = s.voiceLevels.slice();
          voiceLevels[index] = level;
          return { voiceLevels };
        }),
      setEmitters: (emitters) => set({ emitters }),
      setInteracted: () => set({ interacted: true }),
    }),
    {
      name: 'raumklang',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lang: s.lang }),
    },
  ),
);
