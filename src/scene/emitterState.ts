/**
 * Sound sources floating above the field. Positions live in this mutable array (written every frame by the
 * scene) and are pushed to the store at a lower rate for the audio engine.
 */
export interface Emitter {
  /** Current world position on the ground plane */
  x: number;
  z: number;
  /** Current altitude above the field, driven by the source's volume */
  y: number;
  /** Anchor the emitter wanders around when not dragged */
  homeX: number;
  homeZ: number;
  seed: number;
  dragging: boolean;
  hovered: boolean;
}

export const FIELD_Y = -1.4;
/** Altitude range above the field: silent sources rest low, loud ones float high */
export const ALTITUDE = { min: 0.25, max: 2.0 };
/** Low tones glow deep orange, high tones pale amber */
export const COLORS = ['#ff5a14', '#ff8a3d', '#ffb060', '#ffd9a0'];
export const BOUNDS = { minX: -5, maxX: 5, minZ: -3.5, maxZ: 2.2 };

// Spread across the open foreground, below the title
const initial: [number, number][] = [
  [-3.4, 0.6],
  [-1.0, 1.0],
  [1.3, 1.4],
  [3.5, -0.6],
];

export const emitters: Emitter[] = initial.map(([x, z], i) => ({
  x,
  z,
  y: 0,
  homeX: x,
  homeZ: z,
  seed: i * 1.7 + 0.3,
  dragging: false,
  hovered: false,
}));

/** Autonomous wander offset around the anchor. */
export const wander = (e: Emitter, t: number) => ({
  x: Math.sin(t * 0.11 + e.seed) * 0.9 + Math.sin(t * 0.043 + e.seed * 2.1) * 0.5,
  z: Math.cos(t * 0.083 + e.seed * 1.3) * 0.7,
});

/** Screen position (CSS px) of the emitter carrying the onboarding cue; written by the scene, read by the overlay. */
export const cue = { x: 0, y: 0, visible: false };

/** Horizontal squeeze for narrow (portrait) screens so all sources stay in view; audio uses unsqueezed x. */
export const xScale = (aspect: number) => Math.min(1, aspect / 1.5);
