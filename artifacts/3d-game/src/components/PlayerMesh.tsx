import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";

enum Controls {
  forward = "forward",
  back    = "back",
  left    = "left",
  right   = "right",
}

interface PlayerMeshProps {
  posRef:      React.MutableRefObject<THREE.Vector3>;
  yawRef:      React.MutableRefObject<number>;
  color:       string;
  helmetColor: string;
}

export function PlayerMesh({ posRef, yawRef, color, helmetColor }: PlayerMeshProps) {
  const groupRef   = useRef<THREE.Group>(null!);
  const bodyRef    = useRef<THREE.Mesh>(null!);
  const walkPhase  = useRef(0);
  const [, getCtrl] = useKeyboardControls<Controls>();

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const c  = getCtrl();
    const moving = c.forward || c.back || c.left || c.right;
    if (moving) walkPhase.current += dt * 10;

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = yawRef.current + Math.PI;
    if (bodyRef.current) {
      bodyRef.current.position.y = moving ? Math.sin(walkPhase.current) * 0.06 : 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshLambertMaterial color="#f5c878" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <boxGeometry args={[0.46, 0.22, 0.46]} />
        <meshLambertMaterial color={helmetColor} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.38, 0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.38, 0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Gun */}
      <mesh position={[0.38, 0.52, -0.38]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.5]} />
        <meshLambertMaterial color="#222222" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.16, -0.05, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={helmetColor} />
      </mesh>
      <mesh position={[0.16, -0.05, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshLambertMaterial color={helmetColor} />
      </mesh>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.29, 0]}>
        <circleGeometry args={[0.4, 12]} />
        <meshBasicMaterial color="#000000" opacity={0.22} transparent />
      </mesh>
    </group>
  );
}
