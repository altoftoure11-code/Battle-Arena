import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BulletData, EnemyData } from "@/types/game";
import type { GlooWallData } from "./GlooWall";

const BULLET_SPEED    = 35;
const BULLET_HIT_R    = 1.2;
const BULLET_MAX_LIFE = 2.5;
const GLOO_BLOCK_R    = 1.6;

interface BulletMeshProps {
  bullet:    BulletData;
  enemies:   EnemyData[];
  glooWalls: GlooWallData[];
  onHit:     (bulletId:number, enemyId:number) => void;
  onExpire:  (bulletId:number) => void;
}

export function BulletMesh({ bullet, enemies, glooWalls, onHit, onExpire }: BulletMeshProps) {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const trailRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const pos      = useRef(new THREE.Vector3(...bullet.position));
  const dir      = useRef(new THREE.Vector3(...bullet.direction));
  const life     = useRef(0);
  const dead     = useRef(false);

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

    if (meshRef.current)  meshRef.current.position.copy(pos.current);
    if (trailRef.current) {
      trailRef.current.position.copy(pos.current).sub(dir.current.clone().multiplyScalar(0.25));
      trailRef.current.lookAt(pos.current.clone().add(dir.current));
    }
    if (lightRef.current) lightRef.current.position.copy(pos.current);

    // Gloo wall blocking — bullet dies on contact with any gloo wall
    for (const gw of glooWalls ?? []) {
      const gwPos = new THREE.Vector3(...gw.position).add(new THREE.Vector3(0, 1.1, 0));
      if (pos.current.distanceTo(gwPos) < GLOO_BLOCK_R) {
        dead.current = true;
        onExpire(bullet.id);
        return;
      }
    }

    // Enemy hit check
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const ep = new THREE.Vector3(...enemy.position);
      if (pos.current.distanceTo(ep) < BULLET_HIT_R) {
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
      {/* Trail */}
      <mesh ref={trailRef} position={bullet.position}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 4]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.7} />
      </mesh>
      {/* Glow light */}
      <pointLight ref={lightRef} position={bullet.position} color="#ffaa00" intensity={2} distance={4} />
    </group>
  );
}
