import { useMemo } from "react";
import * as THREE from "three";
import { OBSTACLES } from "@/lib/obstacles";

const ARENA_SIZE = 80;

const treeTrunkPositions: [number, number][] = [
  [-30, -30], [30, -25], [-25, 30], [28, 28],
  [-32, 5], [32, 10], [-10, -35], [12, 35],
  [35, -5], [-35, -15], [20, -32], [-22, 32],
];

export function Environment() {
  const treeData = useMemo(() => {
    return treeTrunkPositions.map(([x, z], i) => ({
      key: i, x, z,
      trunkH: 2 + Math.sin(i * 13.7) * 0.8,
      leafScale: 0.8 + Math.sin(i * 7.3) * 0.3,
      leafColor: `hsl(${115 + Math.sin(i * 5.1) * 20}, 45%, ${25 + Math.sin(i * 3.3) * 8}%)`,
    }));
  }, []);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE, 20, 20]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} />
      </mesh>

      {/* Ground grid overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE, 20, 20]} />
        <meshBasicMaterial color="#265022" wireframe opacity={0.12} transparent />
      </mesh>

      <BorderWalls />

      {/* Obstacles */}
      {OBSTACLES.map((obs, i) => (
        <group key={i}>
          <mesh position={obs.pos} castShadow receiveShadow>
            <boxGeometry args={obs.size} />
            <meshStandardMaterial color={obs.color} roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Rooftop */}
          <mesh
            position={[obs.pos[0], obs.pos[1] + obs.size[1] / 2 + 0.05, obs.pos[2]]}
            receiveShadow
          >
            <boxGeometry args={[obs.size[0] + 0.1, 0.1, obs.size[2] + 0.1]} />
            <meshStandardMaterial color="#3a4a3a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Trees */}
      {treeData.map((t) => (
        <Tree key={t.key} x={t.x} z={t.z} trunkH={t.trunkH} leafScale={t.leafScale} leafColor={t.leafColor} />
      ))}

      {/* Center circle marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.8, 4, 32]} />
        <meshBasicMaterial color="#44aa44" opacity={0.35} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* King-of-hill zone marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[4, 32]} />
        <meshBasicMaterial color="#ffdd00" opacity={0.08} transparent side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function BorderWalls() {
  const half = 40;
  const height = 6;
  const thickness = 1;
  const wallColor = "#2a3a2a";

  return (
    <>
      {[
        [0, height / 2, half,  [ARENA_SIZE + thickness * 2, height, thickness]],
        [0, height / 2, -half, [ARENA_SIZE + thickness * 2, height, thickness]],
        [half,  height / 2, 0, [thickness, height, ARENA_SIZE]],
        [-half, height / 2, 0, [thickness, height, ARENA_SIZE]],
      ].map(([x, y, z, size], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <boxGeometry args={size as [number, number, number]} />
          <meshStandardMaterial color={wallColor} roughness={0.85} />
        </mesh>
      ))}
    </>
  );
}

interface TreeProps {
  x: number; z: number;
  trunkH: number; leafScale: number; leafColor: string;
}

function Tree({ x, z, trunkH, leafScale, leafColor }: TreeProps) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, trunkH, 6]} />
        <meshStandardMaterial color="#6b4c2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, trunkH + leafScale, 0]} castShadow>
        <coneGeometry args={[leafScale * 1.2, leafScale * 2.5, 7]} />
        <meshStandardMaterial color={leafColor} roughness={0.95} />
      </mesh>
      <mesh position={[0, trunkH + leafScale * 2.2, 0]} castShadow>
        <coneGeometry args={[leafScale * 0.8, leafScale * 1.8, 7]} />
        <meshStandardMaterial color={leafColor} roughness={0.95} />
      </mesh>
    </group>
  );
}
