import { useRef, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { VehicleState } from "@/types/game";
import { VEHICLES } from "@/gameData";
import { resolveObstacleCollision } from "@/lib/obstacles";

enum Controls { forward="forward", back="back", left="left", right="right" }

interface VehicleMeshProps {
  vehicleState: VehicleState;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerYawRef: React.MutableRefObject<number>;
  isOccupied: boolean;
  enemies: { id:number; position:[number,number,number]; alive:boolean }[];
  onUpdate: (pos:[number,number,number], rot:number, speed:number) => void;
  onCrushEnemy: (enemyId:number) => void;
  onVehicleDamage: (dmg:number) => void;
}

const ARENA_HALF = 38;

export function VehicleMesh({
  vehicleState, playerPosRef, playerYawRef, isOccupied,
  enemies, onUpdate, onCrushEnemy, onVehicleDamage,
}: VehicleMeshProps) {
  const groupRef   = useRef<THREE.Group>(null!);
  const [, getCtrl] = useKeyboardControls<Controls>();

  const posRef   = useRef(new THREE.Vector3(...vehicleState.position));
  const rotRef   = useRef(vehicleState.rotation);
  const speedRef = useRef(0);
  const crushedRef = useRef<Set<number>>(new Set());

  const def = VEHICLES.find((v) => v.id === vehicleState.vehicleId) ?? VEHICLES[0];
  const maxSpeed = def.speed;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (isOccupied) {
      const ctrl = getCtrl();
      const ACCEL = maxSpeed * 3;
      const BRAKE_FORCE = maxSpeed * 4;
      const STEER_SPEED = 1.8;

      if (ctrl.forward)  speedRef.current = Math.min(speedRef.current + ACCEL * dt, maxSpeed);
      else if (ctrl.back) speedRef.current = Math.max(speedRef.current - BRAKE_FORCE * dt, -maxSpeed * 0.5);
      else speedRef.current *= (1 - 4 * dt);

      if (Math.abs(speedRef.current) > 0.2) {
        const steerDir = speedRef.current > 0 ? 1 : -1;
        if (ctrl.left)  rotRef.current += STEER_SPEED * dt * steerDir;
        if (ctrl.right) rotRef.current -= STEER_SPEED * dt * steerDir;
      }

      const prevX = posRef.current.x;
      const prevZ = posRef.current.z;
      const nx = posRef.current.x + Math.sin(rotRef.current) * speedRef.current * dt;
      const nz = posRef.current.z + Math.cos(rotRef.current) * speedRef.current * dt;
      const resolved = resolveObstacleCollision({ x: nx, z: nz, y: posRef.current.y }, { x: prevX, z: prevZ });
      if (resolved.x === prevX && resolved.z === prevZ) speedRef.current *= 0.3;
      posRef.current.x = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, resolved.x));
      posRef.current.z = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, resolved.z));

      playerPosRef.current.set(posRef.current.x, 1.2, posRef.current.z);
      playerYawRef.current = rotRef.current;

      for (const e of enemies) {
        if (!e.alive || crushedRef.current.has(e.id)) continue;
        const ep = new THREE.Vector3(...e.position);
        const dist = posRef.current.distanceTo(ep);
        if (dist < 2.5 && Math.abs(speedRef.current) > 2) {
          crushedRef.current.add(e.id);
          onCrushEnemy(e.id);
          onVehicleDamage(30);
          speedRef.current *= 0.6;
        }
      }

      onUpdate([posRef.current.x, posRef.current.y, posRef.current.z], rotRef.current, speedRef.current);
    }

    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = rotRef.current;
  });

  const bodyColor = def.color;

  return (
    <group ref={groupRef} position={vehicleState.position}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 0.6, 3.6]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 1.0, -0.2]} castShadow>
        <boxGeometry args={[1.6, 0.55, 2.0]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 1.0, -1.15]}>
        <boxGeometry args={[1.5, 0.5, 0.06]} />
        <meshBasicMaterial color="#aaddff" transparent opacity={0.5} />
      </mesh>
      {/* Wheels */}
      {[[-0.95, 0, 1.2], [0.95, 0, 1.2], [-0.95, 0, -1.2], [0.95, 0, -1.2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.38, 0.38, 0.3, 10]} />
          <meshStandardMaterial color="#111" metalness={0.3} roughness={0.9} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[0.5, 0.5, -1.82]}>
        <boxGeometry args={[0.3, 0.18, 0.05]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      <mesh position={[-0.5, 0.5, -1.82]}>
        <boxGeometry args={[0.3, 0.18, 0.05]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      {isOccupied && (
        <>
          <pointLight position={[0.5, 0.5, -2]} color="#ffffaa" intensity={3} distance={12} />
          <pointLight position={[-0.5, 0.5, -2]} color="#ffffaa" intensity={3} distance={12} />
        </>
      )}
    </group>
  );
}
