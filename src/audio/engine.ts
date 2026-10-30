import { el, type NodeRepr_t } from '@elemaudio/core';
import WebRenderer from '@elemaudio/web-renderer';
import { useAppStore, type EmitterPosition } from '../store/useAppStore';

const FADE_MS = 1200;
/** Swell rates (Hz) — each source breathes on its own 13–23 s cycle */
const SWELL_RATES = [0.043, 0.061, 0.077, 0.052];
/** Output trim per source; higher voices sit lower in the mix */
const TRIMS = [0.11, 0.08, 0.06, 0.05];
/** Filter headroom per source so high voices are not filtered away when far */
const CUTOFF_SCALE = [1, 1.3, 2.5, 3.5];

let ctx: AudioContext | null = null;
let core: WebRenderer | null = null;
let unsubscribe: (() => void) | null = null;
let gainTarget = 0;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Smoothed control signal; keyed so re-renders only update the value. */
const param = (key: string, value: number) => el.sm(el.const({ key, value }));

/** Slow drift multiplier around 1 */
const drift = (rate: number, depth: number) => el.add(1, el.mul(el.cycle(rate), depth));

/**
 * Four distinct drones, each normalized to peak around 1 (before the swell):
 * 0  A1 — deep, detuned saws with a sub
 * 1  E2 — hollow, beating squares
 * 2  B3 — soft triangles with a slow vibrato
 * 3  F#4 — glassy sine partials with a shimmer tremolo
 */
const VOICES: (() => NodeRepr_t)[] = [
  () => {
    const f = el.mul(55, drift(0.07, 0.004));
    return el.add(
      el.mul(el.blepsaw(f), 0.4),
      el.mul(el.blepsaw(el.mul(f, 1.0035)), 0.4),
      el.mul(el.cycle(el.mul(f, 0.5)), 0.2),
    );
  },
  () => {
    const f = el.mul(82.41, drift(0.05, 0.003));
    return el.add(el.mul(el.blepsquare(f), 0.5), el.mul(el.blepsquare(el.mul(f, 1.0021)), 0.5));
  },
  () => {
    const f = el.mul(246.94, drift(4.5, 0.006), drift(0.09, 0.003));
    return el.add(el.mul(el.bleptriangle(f), 0.6), el.mul(el.bleptriangle(el.mul(f, 2.003)), 0.4));
  },
  () => {
    const f = el.mul(369.99, drift(0.11, 0.002));
    const partials = el.add(el.cycle(f), el.mul(el.cycle(el.mul(f, 2.01)), 0.3), el.mul(el.cycle(el.mul(f, 3.003)), 0.15));
    return el.mul(partials, drift(6.2, 0.25), 1 / 1.45 / 1.25);
  },
];

/** 0.08..1 slow swell; this is the source's own volume, shown as its altitude */
const swell = (rate: number) => el.add(0.54, el.mul(el.cycle(rate), 0.46));

/**
 * Head-relative spatialization per emitter (position is in listener space, -z = ahead):
 * azimuth -> equal-power stereo pan, sources behind -> duller (head shadow), distance -> level, brightness
 * and delay send (far sources are quieter, darker and wetter).
 */
function spatial(p: EmitterPosition) {
  const dist = Math.max(0.5, Math.hypot(p.x, p.y, p.z));
  const pan = clamp(p.x / Math.max(0.5, Math.hypot(p.x, p.z)), -1, 1);
  const theta = ((pan + 1) * Math.PI) / 4;
  const behind = clamp(p.z / dist, 0, 1);
  const near = clamp((14 - dist) / 10, 0, 1);
  return {
    left: Math.cos(theta),
    right: Math.sin(theta),
    gain: clamp(4.5 / dist, 0.15, 1) * (1 - behind * 0.3),
    cutoff: 260 * Math.pow(4200 / 260, near) * (1 - behind * 0.6),
    send: lerp(0.75, 0.15, near),
  };
}

function buildGraph(positions: EmitterPosition[], gain: number) {
  const amp = el.smooth(el.tau2pole(FADE_MS / 1000 / 3), el.const({ key: 'gain', value: gain }));
  const breathe = el.add(1, el.mul(el.cycle(0.05), 0.25));

  const dryL: NodeRepr_t[] = [];
  const dryR: NodeRepr_t[] = [];
  const sendL: NodeRepr_t[] = [];
  const sendR: NodeRepr_t[] = [];

  VOICES.forEach((voice, i) => {
    const s = spatial(positions[i] ?? { x: 0, y: 0, z: -6 });
    const fc = el.min(12000, el.mul(param(`fc${i}`, s.cutoff * CUTOFF_SCALE[i]), breathe));
    // Meter before spatialization: it reports the source's own volume, independent of where you listen from
    const source = el.meter({ name: `v${i}` }, el.mul(voice(), swell(SWELL_RATES[i])));
    const mono = el.mul(el.lowpass(fc, 0.9, source), param(`g${i}`, s.gain), TRIMS[i]);
    const l = el.mul(mono, param(`l${i}`, s.left));
    const r = el.mul(mono, param(`r${i}`, s.right));
    const send = param(`s${i}`, s.send);
    dryL.push(el.mul(l, el.sub(1, el.mul(send, 0.5))));
    dryR.push(el.mul(r, el.sub(1, el.mul(send, 0.5))));
    sendL.push(el.mul(l, send));
    sendR.push(el.mul(r, send));
  });

  // Feedback delays of different lengths per side for a wide, spacious tail
  const wet = (inputs: NodeRepr_t[], ms: number) =>
    el.delay({ size: 48000 * 2 }, el.ms2samps(ms), 0.62, el.lowpass(2400, 0.7, el.add(...inputs)));

  const left = el.mul(el.add(...dryL, wet(sendL, 431)), amp);
  const right = el.mul(el.add(...dryR, wet(sendR, 557)), amp);
  return [el.meter({ name: 'out' }, el.tanh(left)), el.tanh(right)];
}

function render() {
  if (!core) return;
  core.render(...buildGraph(useAppStore.getState().emitters, gainTarget));
}

async function init() {
  ctx = new AudioContext({ latencyHint: 'playback' });
  core = new WebRenderer();
  const node = await core.initialize(ctx, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  node.connect(ctx.destination);

  core.on('meter', (e: { source?: string; max: number; min: number }) => {
    const peak = Math.max(Math.abs(e.max), Math.abs(e.min));
    const store = useAppStore.getState();
    if (e.source === 'out') {
      store.setLevel(lerp(store.level, Math.min(1, peak * 2.2), 0.35));
    } else if (e.source?.startsWith('v')) {
      const i = Number(e.source.slice(1));
      store.setVoiceLevel(i, lerp(store.voiceLevels[i] ?? 0, Math.min(1, peak), 0.35));
    }
  });

  unsubscribe = useAppStore.subscribe((s, prev) => {
    if (s.emitters !== prev.emitters) render();
  });
}

let stopTimer: number | undefined;

export async function startAudio() {
  const { setAudioState } = useAppStore.getState();
  window.clearTimeout(stopTimer);
  try {
    setAudioState('starting');
    if (!core) await init();
    await ctx!.resume();
    gainTarget = 1;
    render();
    setAudioState('on');
  } catch (err) {
    console.error(err);
    setAudioState('error');
  }
}

export function stopAudio() {
  const { setAudioState, setLevel } = useAppStore.getState();
  gainTarget = 0;
  render();
  setAudioState('off');
  stopTimer = window.setTimeout(() => {
    setLevel(0);
    useAppStore.setState({ voiceLevels: [0, 0, 0, 0] });
    void ctx?.suspend();
  }, FADE_MS + 200);
}

export function disposeAudio() {
  unsubscribe?.();
  void ctx?.close();
  ctx = null;
  core = null;
}
