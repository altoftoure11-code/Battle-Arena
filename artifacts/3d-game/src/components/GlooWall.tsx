import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface GlooWallData {
  id: number;
  position: [number, number, number];
  rotation: number;
  hp: number;
}

interface GlooWallProps {
  wall:     GlooWallData;
  bullets:  { id:number; position:[number,number,number]; direction:[number,number,number] }[];
  onDamage: (wallId:number, damage:number) => void;
}

const WALL_WIDTH  = 2.5;
const WALL_HEIGHT = 2.2;
const WALL_DEPTH  = 0.35;
const HIT_RADIUS  = 1.5;

export function GlooWall({ wall, bullets, onDamage }: GlooWallProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const hitRef  = useRef<Set<number>>(new Set());

  useFrame(() => {
    if (!meshRef.current) return;
    const wallPos = new THREE.Vector3(...wall.position).add(new THREE.Vector3(0, WALL_HEIGHT/2, 0));
    for (const b of bullets) {
      if (hitRef.current.has(b.id)) continue;
      const bPos = new THREE.Vector3(...b.position);
      if (bPos.distanceTo(wallPos) < HIT_RADIUS + 0.5) {
        hitRef.current.add(b.id);
        onDamage(wall.id, 50);
      }
    }
  });

  const hpPct = wall.hp / 300;
  const opacity = 0.3 + hpPct * 0.3;
  const emissive = hpPct < 0.3 ? "#ff2200" : "#00aaff";

  return (
    <group position={wall.position} rotation={[0, wall.rotation, 0]}>
      {/* Main wall panel */}
      <mesh ref={meshRef} position={[0, WALL_HEIGHT/2, 0]} castShadow>
        <boxGeometry args={[WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH]} />
        <meshLambertMaterial
          color="#44aaff" emissive={emissive} emissiveIntensity={0.4}
          transparent opacity={opacity} side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edge glow */}
      <mesh position={[0, WALL_HEIGHT/2, 0]}>
        <boxGeometry args={[WALL_WIDTH+0.05, WALL_HEIGHT+0.05, WALL_DEPTH+0.05]} />
        <meshBasicMaterial color="#88ddff" wireframe transparent opacity={0.25} />
      </mesh>

      {/* HP bar above wall */}
      <mesh position={[0, WALL_HEIGHT+0.2, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[WALL_WIDTH * hpPct, 0.12]} />
        <meshBasicMaterial color={hpPct > 0.5 ? "#44ff88" : hpPct > 0.25 ? "#ffaa00" : "#ff3300"} />
      </mesh>

      {/* Bottom anchor */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[WALL_WIDTH, 0.12, WALL_DEPTH + 0.2]} />
        <meshLambertMaterial color="#0044aa" transparent opacity={0.9} />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight color="#44aaff" intensity={0.6} distance={4} position={[0, WALL_HEIGHT/2, 0.5]} />
    </group>
  );
}
