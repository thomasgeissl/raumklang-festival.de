import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Field from './Field';
import Emitters from './Emitters';

/** Orbit target: the middle of the area the sound sources roam. */
export const ORBIT_TARGET: [number, number, number] = [0, -0.7, -0.2];

/** Shift the rendered image down so the scene sits below the centered title (raycasting follows along). */
function ViewOffset() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.setViewOffset(size.width, size.height, 0, -size.height * 0.24, size.width, size.height);
    return () => camera.clearViewOffset();
  }, [camera, size]);
  return null;
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 6.5], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <color attach="background" args={['#0c0806']} />
      <ViewOffset />
      <OrbitControls
        makeDefault
        target={ORBIT_TARGET}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minDistance={3.5}
        maxDistance={11}
        minPolarAngle={0.55}
        maxPolarAngle={1.42}
      />
      <Field />
      <Emitters />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
