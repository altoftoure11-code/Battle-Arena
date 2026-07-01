import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CollectibleData {
  id: number;
  type: "health" | "ammo";
  position: [number, number, number];
  collected: boolean;
}

interface CollectibleProps {
  item: CollectibleData;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onCollect: (id: number, type: "health" | "ammo") => void;
}

const COLLECT_RADIUS = 1.6;

export function Collectible({ item, playerPos, onCollect }: CollectibleProps) {
  const groupRef  = useRef<THREE.Group>(null!);
  const collectedRef = useRef(false);

  useFrame((_, delta) => {
    if (collectedRef.current || item.collected) return;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.5;
      groupRef.current.position.y = item.position[1] + Math.sin(Date.now() * 0.002) * 0.12;
    }
    const dx = playerPos.current.x - item.position[0];
    const dz = playerPos.current.z - item.position[2];
    if (Math.sqrt(dx*dx + dz*dz) < COLLECT_RADIUS) {
      collectedRef.current = true;
      onCollect(item.id, item.type);
    }
  });

  if (item.collected) return null;

  return (
    <group ref={groupRef} position={item.position}>
      {item.type === "health" ? <HealthKit /> : <AmmoCrate />}
      {/* glow ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
        <ringGeometry args={[0.55, 0.7, 16]} />
        <meshBasicMaterial
          color={item.type === "health" ? "#ff3333" : "#ffcc00"}
          transparent opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function HealthKit() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshLambertMaterial color="#cc2222" />
      </mesh>
      {/* cross horizontal */}
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[0.4, 0.12, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* cross vertical */}
      <mesh position={[0, 0, 0.28]}>
        <boxGeometry args={[0.12, 0.4, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function AmmoCrate() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.45, 0.45]} />
        <meshLambertMaterial color="#aa8800" />
      </mesh>
      {/* lid accent */}
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[0.62, 0.06, 0.47]} />
        <meshLambertMaterial color="#ddaa00" />
      </mesh>
      {/* stripes */}
      <mesh position={[0, 0, 0.23]}>
        <boxGeometry args={[0.5, 0.3, 0.02]} />
        <meshBasicMaterial color="#ffdd00" />
      </mesh>
    </group>
  );
}
