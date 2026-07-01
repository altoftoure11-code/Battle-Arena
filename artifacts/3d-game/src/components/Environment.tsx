import { useMemo } from "react";
import * as THREE from "three";

const ARENA_SIZE = 80;

interface ObstacleConfig {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
}

function useObstacles(): ObstacleConfig[] {
  return useMemo(() => [
    { pos: [10, 1.5, 10], size: [4, 3, 4], color: "#5a6e5a" },
    { pos: [-12, 1, -8], size: [6, 2, 3], color: "#4a5e4a" },
    { pos: [18, 2, -15], size: [3, 4, 3], color: "#506050" },
    { pos: [-20, 1.5, 12], size: [5, 3, 2], color: "#526252" },
    { pos: [5, 1, -22], size: [4, 2, 5], color: "#4e5e4e" },
    { pos: [-8, 2.5, 20], size: [3, 5, 3], color: "#4a5a4a" },
    { pos: [22, 1, 5], size: [2, 2, 6], color: "#546454" },
    { pos: [-18, 1, -20], size: [4, 2, 4], color: "#4c5c4c" },
    { pos: [0, 1.5, 25], size: [8, 3, 3], color: "#507050" },
    { pos: [-5, 2, -5], size: [2, 4, 2], color: "#4a5a4a" },
    { pos: [28, 1, -10], size: [3, 2, 3], color: "#567056" },
    { pos: [-28, 1.5, 5], size: [3, 3, 5], color: "#4e6e4e" },
    { pos: [15, 1, 28], size: [5, 2, 3], color: "#506050" },
    { pos: [-15, 1, -28], size: [3, 2, 5], color: "#4c5c4c" },
  ], []);
}

const treeTrunkPositions: [number, number][] = [
  [-30, -30], [30, -25], [-25, 30], [28, 28],
  [-32, 5], [32, 10], [-10, -35], [12, 35],
  [35, -5], [-35, -15], [20, -32], [-22, 32],
];

export function Environment() {
  const obstacles = useObstacles();

  const treeData = useMemo(() => {
    return treeTrunkPositions.map(([x, z], i) => ({
      key: i,
      x,
      z,
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
        <meshLambertMaterial color="#2d5a27" />
      </mesh>

      {/* Ground grid overlay for visual texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[ARENA_SIZE, ARENA_SIZE, 20, 20]} />
        <meshBasicMaterial color="#265022" wireframe opacity={0.15} transparent />
      </mesh>

      {/* Arena border walls */}
      <BorderWalls />

      {/* Obstacles */}
      {obstacles.map((obs, i) => (
        <mesh key={i} position={obs.pos} castShadow receiveShadow>
          <boxGeometry args={obs.size} />
          <meshLambertMaterial color={obs.color} />
        </mesh>
      ))}

      {/* Rooftops slightly different shade */}
      {obstacles.map((obs, i) => (
        <mesh
          key={`roof-${i}`}
          position={[obs.pos[0], obs.pos[1] + obs.size[1] / 2 + 0.05, obs.pos[2]]}
          receiveShadow
        >
          <boxGeometry args={[obs.size[0] + 0.1, 0.1, obs.size[2] + 0.1]} />
          <meshLambertMaterial color="#3a4a3a" />
        </mesh>
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
    </>
  );
}

function BorderWalls() {
  const half = 40;
  const height = 5;
  const thickness = 1;
  const wallColor = "#2a3a2a";

  return (
    <>
      <mesh position={[0, height / 2, half]} castShadow>
        <boxGeometry args={[ARENA_SIZE + thickness * 2, height, thickness]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      <mesh position={[0, height / 2, -half]} castShadow>
        <boxGeometry args={[ARENA_SIZE + thickness * 2, height, thickness]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      <mesh position={[half, height / 2, 0]} castShadow>
        <boxGeometry args={[thickness, height, ARENA_SIZE]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      <mesh position={[-half, height / 2, 0]} castShadow>
        <boxGeometry args={[thickness, height, ARENA_SIZE]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
    </>
  );
}

interface TreeProps {
  x: number;
  z: number;
  trunkH: number;
  leafScale: number;
  leafColor: string;
}

function Tree({ x, z, trunkH, leafScale, leafColor }: TreeProps) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, trunkH, 6]} />
        <meshLambertMaterial color="#6b4c2a" />
      </mesh>
      <mesh position={[0, trunkH + leafScale, 0]} castShadow>
        <coneGeometry args={[leafScale * 1.2, leafScale * 2.5, 7]} />
        <meshLambertMaterial color={leafColor} />
      </mesh>
      <mesh position={[0, trunkH + leafScale * 2.2, 0]} castShadow>
        <coneGeometry args={[leafScale * 0.8, leafScale * 1.8, 7]} />
        <meshLambertMaterial color={leafColor} />
      </mesh>
    </group>
  );
}

