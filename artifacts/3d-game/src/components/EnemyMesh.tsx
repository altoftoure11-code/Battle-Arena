import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnemyData } from "@/types/game";
import { resolveObstacleCollision } from "@/lib/obstacles";

const ARENA_HALF = 36;

interface EnemyMeshProps {
  enemy:    EnemyData;
  onUpdate: (id:number, pos:[number,number,number], vel:[number,number], timer:number) => void;
}

export function EnemyMesh({ enemy, onUpdate }: EnemyMeshProps) {
  const groupRef    = useRef<THREE.Group>(null!);
  const walkPhase   = useRef(Math.random() * Math.PI * 2);
  const lArmRef     = useRef<THREE.Mesh>(null!);
  const rArmRef     = useRef<THREE.Mesh>(null!);
  const lLegRef     = useRef<THREE.Mesh>(null!);
  const rLegRef     = useRef<THREE.Mesh>(null!);

  const posRef      = useRef<[number,number,number]>([...enemy.position]);
  const velRef      = useRef<[number,number]>([...enemy.velocity]);
  const timerRef    = useRef(enemy.changeTimer);
  const syncTimer   = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    walkPhase.current += dt * 9;

    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      velRef.current = [Math.cos(angle) * speed, Math.sin(angle) * speed];
      timerRef.current = 1.5 + Math.random() * 2.5;
    }

    const nx = posRef.current[0] + velRef.current[0] * dt;
    const nz = posRef.current[2] + velRef.current[1] * dt;

    const resolved = resolveObstacleCollision({ x: nx, z: nz, y: 0.75 }, { x: posRef.current[0], z: posRef.current[2] });
    let rx = resolved.x;
    let rz = resolved.z;

    if (rx > ARENA_HALF || rx < -ARENA_HALF) { velRef.current[0] *= -1; rx = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, rx)); }
    if (rz > ARENA_HALF || rz < -ARENA_HALF) { velRef.current[1] *= -1; rz = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, rz)); }

    posRef.current = [rx, 0.75, rz];
    groupRef.current.position.set(rx, 0.75, rz);
    groupRef.current.rotation.y = Math.atan2(velRef.current[0], velRef.current[1]);

    const swing = Math.sin(walkPhase.current) * 0.5;
    if (lArmRef.current) lArmRef.current.rotation.x = swing;
    if (rArmRef.current) rArmRef.current.rotation.x = -swing;
    if (lLegRef.current) lLegRef.current.rotation.x = -swing;
    if (rLegRef.current) rLegRef.current.rotation.x = swing;

    syncTimer.current += dt;
    if (syncTimer.current > 0.1) {
      syncTimer.current = 0;
      onUpdate(enemy.id, posRef.current, velRef.current, timerRef.current);
    }
  });

  const c = enemy.color;
  const darkC = new THREE.Color(c).multiplyScalar(0.55).getStyle();

  return (
    <group ref={groupRef} position={enemy.position}>
      {/* Helmet */}
      <mesh position={[0, 0.83, 0]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color={c} roughness={0.6}
          emissive={c} emissiveIntensity={0.2} />
      </mesh>

      {/* Glowing eyes */}
      <mesh position={[-0.11, 0.63, -0.22]}>
        <boxGeometry args={[0.09, 0.09, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 0.63, -0.22]}>
        <boxGeometry args={[0.09, 0.09, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight color={c} intensity={0.5} distance={2} position={[0, 0.6, -0.3]} />

      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshStandardMaterial color={c} roughness={0.65}
          emissive={c} emissiveIntensity={0.12} />
      </mesh>

      {/* Left arm */}
      <mesh ref={lArmRef} position={[-0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.19, 0.56, 0.19]} />
        <meshStandardMaterial color={darkC} roughness={0.7} />
      </mesh>

      {/* Right arm */}
      <mesh ref={rArmRef} position={[0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.19, 0.56, 0.19]} />
        <meshStandardMaterial color={darkC} roughness={0.7} />
      </mesh>

      {/* Left leg */}
      <mesh ref={lLegRef} position={[-0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.21, 0.5, 0.21]} />
        <meshStandardMaterial color={darkC} roughness={0.8} />
      </mesh>

      {/* Right leg */}
      <mesh ref={rLegRef} position={[0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.21, 0.5, 0.21]} />
        <meshStandardMaterial color={darkC} roughness={0.8} />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.74, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" opacity={0.22} transparent />
      </mesh>
    </group>
  );
}
