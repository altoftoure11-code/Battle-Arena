import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AirplaneMeshProps {
  progress: number;
}

const PATH_START = new THREE.Vector3(-50, 30, -50);
const PATH_END   = new THREE.Vector3(50, 30, 50);

export function getAirplanePosition(progress: number): THREE.Vector3 {
  return PATH_START.clone().lerp(PATH_END, progress);
}

export function AirplaneMesh({ progress }: AirplaneMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!groupRef.current) return;
    const pos = getAirplanePosition(progress);
    groupRef.current.position.copy(pos);
    groupRef.current.lookAt(PATH_END);
  });

  return (
    <group ref={groupRef}>
      {/* Fuselage */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.9, 6]} />
        <meshStandardMaterial color="#445566" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, -3.2]}>
        <coneGeometry args={[0.45, 1.2, 8]} rotation-x={Math.PI / 2} />
        <meshStandardMaterial color="#334455" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Left wing */}
      <mesh position={[-4, -0.1, 0]} rotation-z={0.05}>
        <boxGeometry args={[6, 0.15, 2.5]} />
        <meshStandardMaterial color="#3a4f5a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Right wing */}
      <mesh position={[4, -0.1, 0]} rotation-z={-0.05}>
        <boxGeometry args={[6, 0.15, 2.5]} />
        <meshStandardMaterial color="#3a4f5a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Tail wing horizontal */}
      <mesh position={[0, 0.1, 2.5]}>
        <boxGeometry args={[3, 0.12, 1.2]} />
        <meshStandardMaterial color="#3a4f5a" />
      </mesh>
      {/* Tail wing vertical */}
      <mesh position={[0, 0.6, 2.5]}>
        <boxGeometry args={[0.12, 1.0, 1.0]} />
        <meshStandardMaterial color="#3a4f5a" />
      </mesh>
      {/* Left engine */}
      <mesh position={[-2.5, -0.2, -0.5]}>
        <cylinderGeometry args={[0.22, 0.22, 1.0, 8]} rotation-x={Math.PI / 2} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Right engine */}
      <mesh position={[2.5, -0.2, -0.5]}>
        <cylinderGeometry args={[0.22, 0.22, 1.0, 8]} rotation-x={Math.PI / 2} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Windows */}
      {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
        <mesh key={i} position={[-0.61, 0.15, z]}>
          <boxGeometry args={[0.04, 0.22, 0.28]} />
          <meshBasicMaterial color="#aaddff" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Nav lights */}
      <pointLight color="#ff4400" intensity={2} distance={8} position={[-5, 0, 0]} />
      <pointLight color="#00aa44" intensity={2} distance={8} position={[5, 0, 0]} />
      <pointLight color="#ffffff" intensity={1.5} distance={6} position={[0, -0.5, -3]} />
    </group>
  );
}
