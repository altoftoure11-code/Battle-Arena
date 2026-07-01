import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";

enum Controls { forward="forward", back="back", left="left", right="right" }

interface PlayerMeshProps {
  posRef:      React.MutableRefObject<THREE.Vector3>;
  yawRef:      React.MutableRefObject<number>;
  color:       string;
  helmetColor: string;
  auraColor?:  string;
  isInVehicle?: boolean;
}

export function PlayerMesh({ posRef, yawRef, color, helmetColor, auraColor, isInVehicle }: PlayerMeshProps) {
  const groupRef  = useRef<THREE.Group>(null!);
  const bodyRef   = useRef<THREE.Mesh>(null!);
  const lArmRef   = useRef<THREE.Mesh>(null!);
  const rArmRef   = useRef<THREE.Mesh>(null!);
  const lLegRef   = useRef<THREE.Mesh>(null!);
  const rLegRef   = useRef<THREE.Mesh>(null!);
  const walkPhase = useRef(0);
  const auraRef   = useRef<THREE.Mesh>(null!);
  const [, getCtrl] = useKeyboardControls<Controls>();

  useFrame((_, delta) => {
    if (!groupRef.current || isInVehicle) return;
    const dt = Math.min(delta, 0.05);
    const c  = getCtrl();
    const moving = c.forward || c.back || c.left || c.right;
    if (moving) walkPhase.current += dt * 10;

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = yawRef.current + Math.PI;

    if (bodyRef.current) {
      bodyRef.current.position.y = 0.55 + (moving ? Math.sin(walkPhase.current) * 0.05 : 0);
    }
    const swing = moving ? Math.sin(walkPhase.current) * 0.4 : 0;
    if (lArmRef.current) lArmRef.current.rotation.x = swing;
    if (rArmRef.current) rArmRef.current.rotation.x = -swing;
    if (lLegRef.current) lLegRef.current.rotation.x = -swing;
    if (rLegRef.current) rLegRef.current.rotation.x = swing;

    if (auraRef.current && auraColor) {
      auraRef.current.rotation.y += dt * 2;
      const s = 1 + Math.sin(walkPhase.current * 0.5) * 0.08;
      auraRef.current.scale.setScalar(s);
    }
  });

  if (isInVehicle) return null;

  return (
    <group ref={groupRef}>
      {/* Aura ring (if skin has aura) */}
      {auraColor && (
        <mesh ref={auraRef} position={[0, 0.1, 0]} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.55, 0.06, 8, 20]} />
          <meshBasicMaterial color={auraColor} transparent opacity={0.75} />
        </mesh>
      )}

      {/* Helmet */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <boxGeometry args={[0.48, 0.24, 0.48]} />
        <meshStandardMaterial color={helmetColor} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.16, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#f5c878" roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 1.18, -0.22]}>
        <boxGeometry args={[0.08, 0.07, 0.02]} />
        <meshBasicMaterial color="#222244" />
      </mesh>
      <mesh position={[0.1, 1.18, -0.22]}>
        <boxGeometry args={[0.08, 0.07, 0.02]} />
        <meshBasicMaterial color="#222244" />
      </mesh>
      {/* Eye shine */}
      <mesh position={[-0.09, 1.2, -0.23]}>
        <boxGeometry args={[0.03, 0.03, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 1.2, -0.23]}>
        <boxGeometry args={[0.03, 0.03, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Body torso */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.72, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.6}
          emissive={color} emissiveIntensity={0.08} />
      </mesh>

      {/* Left arm */}
      <mesh ref={lArmRef} position={[-0.38, 0.55, 0]} castShadow>
        <boxGeometry args={[0.19, 0.58, 0.19]} />
        <meshStandardMaterial color={color} roughness={0.7}
          emissive={color} emissiveIntensity={0.06} />
      </mesh>

      {/* Right arm */}
      <mesh ref={rArmRef} position={[0.38, 0.55, 0]} castShadow>
        <boxGeometry args={[0.19, 0.58, 0.19]} />
        <meshStandardMaterial color={color} roughness={0.7}
          emissive={color} emissiveIntensity={0.06} />
      </mesh>

      {/* Gun */}
      <mesh position={[0.42, 0.55, -0.38]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.52]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0.42, 0.55, -0.68]}>
        <boxGeometry args={[0.05, 0.05, 0.16]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left leg */}
      <mesh ref={lLegRef} position={[-0.16, -0.04, 0]} castShadow>
        <boxGeometry args={[0.21, 0.52, 0.21]} />
        <meshStandardMaterial color={helmetColor} roughness={0.8} />
      </mesh>

      {/* Right leg */}
      <mesh ref={rLegRef} position={[0.16, -0.04, 0]} castShadow>
        <boxGeometry args={[0.21, 0.52, 0.21]} />
        <meshStandardMaterial color={helmetColor} roughness={0.8} />
      </mesh>

      {/* Shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.29, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" opacity={0.22} transparent />
      </mesh>
    </group>
  );
}
