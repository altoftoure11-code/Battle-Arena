import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnemyData } from "@/types/game";

interface AllyMeshProps {
  enemies: EnemyData[];
  onKillEnemy: (enemyId: number) => void;
}

const ALLY_COLOR  = "#00ccaa";
const ALLY_HELMET = "#008866";
const ALLY_SPEED  = 4.5;
const ALLY_ATK_R  = 2.2;
const ALLY_COOLDOWN = 1.2; // seconds

export function AllyMesh({ enemies, onKillEnemy }: AllyMeshProps) {
  const groupRef   = useRef<THREE.Group>(null!);
  const posRef     = useRef(new THREE.Vector3(-5, 0.75, -5));
  const lastAtkRef = useRef(0);
  const walkRef    = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    walkRef.current += dt * 9;

    // Find nearest living enemy
    let nearestEnemy: EnemyData | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const ep = new THREE.Vector3(...e.position);
      const d  = posRef.current.distanceTo(ep);
      if (d < minDist) { minDist = d; nearestEnemy = e; }
    }

    if (nearestEnemy) {
      const target = new THREE.Vector3(...nearestEnemy.position);
      const dir    = target.clone().sub(posRef.current).normalize();
      if (minDist > ALLY_ATK_R) {
        posRef.current.addScaledVector(dir, ALLY_SPEED * dt);
        posRef.current.x = Math.max(-38, Math.min(38, posRef.current.x));
        posRef.current.z = Math.max(-38, Math.min(38, posRef.current.z));
      } else {
        // Attack
        const now = performance.now() / 1000;
        if (now - lastAtkRef.current > ALLY_COOLDOWN) {
          lastAtkRef.current = now;
          onKillEnemy(nearestEnemy.id);
        }
      }
      // Face target
      if (groupRef.current) {
        groupRef.current.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }

    if (groupRef.current) {
      groupRef.current.position.copy(posRef.current);
    }
  });

  return (
    <group ref={groupRef} position={[-5, 0.75, -5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshLambertMaterial color={ALLY_COLOR} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color={ALLY_COLOR} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 0.83, 0]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshLambertMaterial color={ALLY_HELMET} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={ALLY_COLOR} />
      </mesh>
      <mesh position={[0.38, -0.02, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={ALLY_COLOR} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={ALLY_HELMET} />
      </mesh>
      <mesh position={[0.16, -0.55, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={ALLY_HELMET} />
      </mesh>
      {/* Ally indicator ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.74, 0]}>
        <ringGeometry args={[0.45, 0.58, 16]} />
        <meshBasicMaterial color={ALLY_COLOR} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
