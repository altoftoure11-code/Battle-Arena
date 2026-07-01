import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BulletData, EnemyData } from "@/types/game";

const BULLET_SPEED = 35;
const BULLET_HIT_RADIUS = 1.2;
const BULLET_MAX_LIFE = 2.5;

interface BulletMeshProps {
  bullet: BulletData;
  enemies: EnemyData[];
  onHit: (bulletId: number, enemyId: number) => void;
  onExpire: (bulletId: number) => void;
}

export function BulletMesh({ bullet, enemies, onHit, onExpire }: BulletMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const trailRef = useRef<THREE.Mesh>(null!);
  const pos = useRef(new THREE.Vector3(...bullet.position));
  const dir = useRef(new THREE.Vector3(...bullet.direction));
  const life = useRef(0);
  const dead = useRef(false);

  useFrame((_, delta) => {
    if (dead.current) return;
    const dt = Math.min(delta, 0.05);
    life.current += dt;

    if (life.current > BULLET_MAX_LIFE) {
      dead.current = true;
      onExpire(bullet.id);
      return;
    }

    pos.current.addScaledVector(dir.current, BULLET_SPEED * dt);

    if (meshRef.current) {
      meshRef.current.position.copy(pos.current);
    }
    if (trailRef.current) {
      trailRef.current.position.copy(pos.current).sub(
        dir.current.clone().multiplyScalar(0.25)
      );
      trailRef.current.lookAt(pos.current.clone().add(dir.current));
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const ep = new THREE.Vector3(...enemy.position);
      const dist = pos.current.distanceTo(ep);
      if (dist < BULLET_HIT_RADIUS) {
        dead.current = true;
        onHit(bullet.id, enemy.id);
        return;
      }
    }
  });

  return (
    <group>
      {/* Bullet core */}
      <mesh ref={meshRef} position={bullet.position}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshBasicMaterial color="#ffee44" />
      </mesh>

      {/* Muzzle/trail glow */}
      <mesh ref={trailRef} position={bullet.position}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 4]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.7} />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight
        position={bullet.position}
        color="#ffaa00"
        intensity={2}
        distance={4}
      />
    </group>
  );
}
