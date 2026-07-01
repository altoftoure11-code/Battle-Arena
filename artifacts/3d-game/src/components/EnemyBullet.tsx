import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnemyBulletData } from "@/types/game";

const BULLET_SPEED = 18;
const MAX_LIFE     = 1.8;
const HIT_RADIUS   = 0.55;

interface EnemyBulletProps {
  bullet:    EnemyBulletData;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onHit:     (id: number) => void;
  onExpire:  (id: number) => void;
}

export function EnemyBullet({ bullet, playerPos, onHit, onExpire }: EnemyBulletProps) {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const lifeRef  = useRef(0);
  const deadRef  = useRef(false);
  const posRef   = useRef(new THREE.Vector3(...bullet.position));
  const dir      = useRef(new THREE.Vector3(...bullet.direction));

  useFrame((_, delta) => {
    if (deadRef.current) return;
    const dt = Math.min(delta, 0.05);
    lifeRef.current += dt;

    if (lifeRef.current > MAX_LIFE) {
      deadRef.current = true;
      onExpire(bullet.id);
      return;
    }

    posRef.current.addScaledVector(dir.current, BULLET_SPEED * dt);
    if (meshRef.current) meshRef.current.position.copy(posRef.current);

    if (posRef.current.distanceTo(playerPos.current) < HIT_RADIUS) {
      deadRef.current = true;
      onHit(bullet.id);
    }
  });

  return (
    <mesh ref={meshRef} position={bullet.position}>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshBasicMaterial color="#ff6600" />
      {/* glow */}
      <pointLight color="#ff4400" intensity={0.6} distance={2} />
    </mesh>
  );
}
