import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { ALTITUDE, BOUNDS, COLORS, FIELD_Y, cue, emitters, wander, xScale, type Emitter as EmitterState } from './emitterState';

const PUSH_INTERVAL = 1 / 15;
/** Emitter that carries the "drag me" cue until the first interaction */
const CUE_INDEX = 2;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPulse;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float core = exp(-r * r * 220.0) * 2.0;
    float mid = exp(-r * r * 30.0) * 0.8;
    float halo = exp(-r * r * 5.0) * 0.35;
    // Expanding ring that hints the source is "live" and touchable
    float ring = smoothstep(0.05, 0.0, abs(r - uPulse)) * (1.0 - uPulse) * 0.9;
    float a = (core + mid + halo) * uIntensity + ring;
    gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.95, 0.85), clamp(core, 0.0, 1.0)), a);
  }
`;

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float f = 1.0 - abs(vUv.y - 0.5) * 2.0;
    gl_FragColor = vec4(uColor, f * f * 0.8 * uIntensity);
  }
`;

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
const projected = new THREE.Vector3();

function EmitterView({ state, index }: { state: EmitterState; index: number }) {
  const group = useRef<THREE.Group>(null);
  const clock = useRef(0);
  const squeeze = useRef(1);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const interacted = useAppStore((s) => s.interacted);

  const glowUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(COLORS[index]) }, uIntensity: { value: 1 }, uPulse: { value: 0 } }),
    [index],
  );
  const beamUniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(COLORS[index]) }, uIntensity: { value: 1 } }),
    [index],
  );

  const controls = useThree((s) => s.controls) as { enabled: boolean } | null;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (controls) controls.enabled = false;
    // Drag on a horizontal plane at the source's current altitude
    if (group.current) dragPlane.constant = -group.current.position.y;
    (e.target as Element).setPointerCapture(e.pointerId);
    state.dragging = true;
    setDragging(true);
    document.body.style.cursor = 'grabbing';
    useAppStore.getState().setInteracted();
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    // Re-anchor so the wander continues from where the source was dropped
    const w = wander(state, clock.current);
    state.homeX = state.x - w.x;
    state.homeZ = state.z - w.z;
    state.dragging = false;
    setDragging(false);
    if (controls) controls.enabled = true;
    document.body.style.cursor = hovered ? 'grab' : '';
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!state.dragging || !e.ray.intersectPlane(dragPlane, hit)) return;
    state.x = THREE.MathUtils.clamp(hit.x / squeeze.current, BOUNDS.minX, BOUNDS.maxX);
    state.z = THREE.MathUtils.clamp(hit.z, BOUNDS.minZ, BOUNDS.maxZ);
  };

  useFrame((frame, delta) => {
    const g = group.current;
    if (!g) return;
    const time = frame.clock.elapsedTime;
    clock.current = time;
    squeeze.current = xScale(frame.viewport.aspect);

    if (!state.dragging) {
      const w = wander(state, time);
      const k = 1 - Math.pow(0.05, delta);
      state.x = THREE.MathUtils.lerp(state.x, THREE.MathUtils.clamp(state.homeX + w.x, BOUNDS.minX, BOUNDS.maxX), k);
      state.z = THREE.MathUtils.lerp(state.z, THREE.MathUtils.clamp(state.homeZ + w.z, BOUNDS.minZ, BOUNDS.maxZ), k);
    }
    state.hovered = hovered;

    const level = useAppStore.getState().voiceLevels[index] ?? 0;
    const active = state.dragging ? 1 : hovered ? 0.6 : 0;
    // Altitude shows the source's own volume; held steady while dragging so the plane stays put
    if (!state.dragging) {
      const target = ALTITUDE.min + level * (ALTITUDE.max - ALTITUDE.min);
      state.y = THREE.MathUtils.lerp(state.y, target, 1 - Math.pow(0.15, delta));
    }
    g.position.set(state.x * squeeze.current, FIELD_Y + state.y + Math.sin(time * 0.9 + state.seed) * 0.04, state.z);

    const intensity = 0.8 + level * 0.9 + active * 0.6;
    glowUniforms.uIntensity.value = THREE.MathUtils.lerp(glowUniforms.uIntensity.value, intensity, 0.15);
    beamUniforms.uIntensity.value = glowUniforms.uIntensity.value;
    glowUniforms.uPulse.value = ((time * 0.45 + state.seed) % 1) * (hovered || !interacted ? 1 : 0.0);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1 + active * 0.25 + level * 0.2, 0.15));

    if (index === CUE_INDEX) {
      projected.copy(g.position).project(frame.camera);
      cue.x = (projected.x * 0.5 + 0.5) * frame.size.width;
      cue.y = (-projected.y * 0.5 + 0.5) * frame.size.height;
      cue.visible = !useAppStore.getState().interacted;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <cylinderGeometry args={[0.012, 0.012, 2.4, 6, 1, true]} />
        <shaderMaterial
          vertexShader={glowVertex}
          fragmentShader={beamFragment}
          uniforms={beamUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <Billboard>
        <mesh>
          <planeGeometry args={[2.2, 2.2]} />
          <shaderMaterial
            vertexShader={glowVertex}
            fragmentShader={glowFragment}
            uniforms={glowUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Generous invisible hit area, easier to grab on touch screens */}
        <mesh
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerMove={onMove}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            if (!dragging) document.body.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            setHovered(false);
            if (!dragging) document.body.style.cursor = '';
          }}
        >
          <planeGeometry args={[1.2, 1.6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

const local = new THREE.Vector3();

/**
 * Draggable sound sources. Also pushes their positions *relative to the camera* to the store: the camera is
 * the listener's head, so orbiting the view re-pans every source.
 */
export default function Emitters() {
  const acc = useRef(PUSH_INTERVAL);

  useFrame(({ camera, viewport }, delta) => {
    acc.current += delta;
    if (acc.current < PUSH_INTERVAL) return;
    acc.current = 0;
    const squeeze = xScale(viewport.aspect);
    useAppStore.getState().setEmitters(
      emitters.map(({ x, y, z }) => {
        local.set(x * squeeze, FIELD_Y + y, z).applyMatrix4(camera.matrixWorldInverse);
        return { x: local.x, y: local.y, z: local.z };
      }),
    );
  });

  return (
    <>
      {emitters.map((e, i) => (
        <EmitterView key={i} state={e} index={i} />
      ))}
    </>
  );
}
