import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnemyData } from "@/types/game";

const ARENA_HALF = 36;

interface EnemyMeshProps {
  enemy: EnemyData;
  onUpdate: (
    id: number,
    pos: [number, number, number],
    vel: [number, number],
    timer: number
  ) => void;
}

export function EnemyMesh({ enemy, onUpdate }: EnemyMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);

  const posRef = useRef<[number, number, number]>([...enemy.position]);
  const velRef = useRef<[number, number]>([...enemy.velocity]);
  const timerRef = useRef(enemy.changeTimer);
  const syncTimerRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    walkPhaseRef.current += dt * 9;

    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      velRef.current = [Math.cos(angle) * speed, Math.sin(angle) * speed];
      timerRef.current = 1.5 + Math.random() * 2.5;
    }

    let nx = posRef.current[0] + velRef.current[0] * dt;
    let nz = posRef.current[2] + velRef.current[1] * dt;

    if (nx > ARENA_HALF || nx < -ARENA_HALF) {
      velRef.current[0] *= -1;
      nx = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, nx));
    }
    if (nz > ARENA_HALF || nz < -ARENA_HALF) {
      velRef.current[1] *= -1;
      nz = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, nz));
    }

    posRef.current = [nx, 0.75, nz];
    groupRef.current.position.set(nx, 0.75, nz);

    const angle = Math.atan2(velRef.current[0], velRef.current[1]);
    groupRef.current.rotation.y = angle;

    syncTimerRef.current += dt;
    if (syncTimerRef.current > 0.1) {
      syncTimerRef.current = 0;
      onUpdate(enemy.id, posRef.current, velRef.current, timerRef.current);
    }
  });

  return (
    <group ref={groupRef} position={enemy.position}>
      {/* Enemy body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshLambertMaterial color={enemy.color} />
      </mesh>

      {/* Enemy head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={enemy.color} emissive={enemy.color} emissiveIntensity={0.12} />
      </mesh>

      {/* Enemy helmet */}
      <mesh position={[0, 0.83, 0]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshLambertMaterial color="#111111" />
      </mesh>

      {/* Glowing eyes */}
      <mesh position={[-0.11, 0.63, -0.22]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 0.63, -0.22]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={enemy.color} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={enemy.color} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={enemy.color} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={enemy.color} />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.74, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" opacity={0.22} transparent />
      </mesh>
    </group>
  );
}
