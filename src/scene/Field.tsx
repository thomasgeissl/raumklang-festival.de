import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';
import { snoise } from './noise.glsl';
import { FIELD_Y, emitters, xScale } from './emitterState';

const ROWS = 96;
const COLS = 320;
const WIDTH = 22;
const Z_NEAR = 2;
const Z_FAR = -16;

const vertexShader = /* glsl */ `
  ${snoise}
  uniform float uTime;
  uniform float uLevel;
  uniform vec3 uEmit[${emitters.length}]; // x, z, energy
  varying float vDepth;
  varying float vHeight;
  varying float vEdge;

  void main() {
    vec3 p = position;
    float t = uTime;

    // Slow pressure field drifting toward the viewer
    float n = snoise(vec3(p.x * 0.14, p.z * 0.22 - t * 0.12, t * 0.04));
    float fine = snoise(vec3(p.x * 0.7, p.z * 0.5 + t * 0.2, t * 0.25)) * 0.18;
    float amp = 0.6 + uLevel * 1.8;

    // Each sound source lifts the field beneath it and sends out interfering ripples
    float ripple = 0.0;
    float glow = 0.0;
    for (int i = 0; i < ${emitters.length}; i++) {
      vec3 e = uEmit[i];
      float d = distance(p.xz, e.xy);
      ripple += sin(d * 2.6 - t * 3.0 + float(i) * 1.7) * exp(-d * 0.45) * (0.08 + e.z * 0.7);
      ripple += exp(-d * d * 0.9) * (0.25 + e.z * 0.6);
      glow += exp(-d * d * 0.35) * (0.3 + e.z);
    }

    p.y += n * amp + fine * (0.4 + uLevel) + ripple;

    vHeight = p.y + glow * 0.6;
    vEdge = 1.0 - smoothstep(0.7, 1.0, abs(position.x) / ${(WIDTH / 2).toFixed(1)});
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uLevel;
  uniform vec3 uLow;
  uniform vec3 uHigh;
  varying float vDepth;
  varying float vHeight;
  varying float vEdge;

  void main() {
    float h = smoothstep(-0.8, 1.2, vHeight);
    vec3 col = mix(uLow, uHigh, h);
    float fade = smoothstep(1.0, 3.0, vDepth) * (1.0 - smoothstep(11.0, 22.0, vDepth));
    float alpha = fade * vEdge * (0.5 + h * 0.75 + uLevel * 0.35);
    gl_FragColor = vec4(col, alpha);
  }
`;

function buildGeometry() {
  const positions = new Float32Array(ROWS * COLS * 3);
  const indices: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    const z = THREE.MathUtils.lerp(Z_FAR, Z_NEAR, r / (ROWS - 1));
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      positions[i * 3] = (c / (COLS - 1) - 0.5) * WIDTH;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;
      if (c > 0) indices.push(i - 1, i);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  // Displacement happens in the shader, so the static bounds would cull wrongly
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -7), 30);
  return geometry;
}

/**
 * Abstract sound field: stacked lines displaced by noise, like pressure waves moving through a room.
 * Sound sources (see Emitters) lift and ripple the field around them.
 */
export default function Field() {
  const geometry = useMemo(buildGeometry, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uEmit: { value: emitters.map(() => new THREE.Vector3()) },
      uLow: { value: new THREE.Color('#5c1f06') },
      uHigh: { value: new THREE.Color('#ffb060') },
    }),
    [],
  );
  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.02, delta);
    const { level, voiceLevels } = useAppStore.getState();
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uLevel.value = THREE.MathUtils.lerp(uniforms.uLevel.value, level, k);
    emitters.forEach((e, i) => {
      const u = uniforms.uEmit.value[i];
      const energy = (voiceLevels[i] ?? 0) + (e.dragging ? 0.6 : e.hovered ? 0.3 : 0);
      u.set(e.x * xScale(state.viewport.aspect), e.z, THREE.MathUtils.lerp(u.z, energy, k));
    });

  });

  return (
    <lineSegments geometry={geometry} position={[0, FIELD_Y, 0]}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
