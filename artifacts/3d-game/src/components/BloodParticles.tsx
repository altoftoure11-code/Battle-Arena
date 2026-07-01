import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BloodEntry } from "@/types/game";

interface BloodParticleProps {
  entry: BloodEntry;
  onExpire: (id: number) => void;
}

const PARTICLE_COUNT = 18;
const LIFETIME = 0.9;

function SingleBloodEffect({ entry, onExpire }: BloodParticleProps) {
  const meshRef = useRef<THREE.Group>(null!);
  const life = useRef(0);
  const expired = useRef(false);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI * 0.6;
      const speed = 2 + Math.random() * 4;
      return {
        vel: new THREE.Vector3(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed + 1.5,
          Math.sin(angle) * Math.cos(elevation) * speed
        ),
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ),
        size: 0.04 + Math.random() * 0.06,
      };
    });
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (expired.current) return;
    life.current += delta;
    if (life.current > LIFETIME) {
      expired.current = true;
      onExpire(entry.id);
      return;
    }
    const t = life.current / LIFETIME;
    const alpha = 1 - t;

    particles.forEach((p, i) => {
      p.vel.y -= 9.8 * delta;
      p.pos.addScaledVector(p.vel, delta);

      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.position.copy(p.pos);
      (mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
    });
  });

  return (
    <group ref={meshRef} position={entry.position}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(r) => { meshRefs.current[i] = r; }}
          position={p.pos.toArray()}
        >
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#cc0000" : "#880000"}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

interface BloodParticlesProps {
  entries: BloodEntry[];
  onExpire: (id: number) => void;
}

export function BloodParticles({ entries, onExpire }: BloodParticlesProps) {
  return (
    <>
      {entries.map((e) => (
        <SingleBloodEffect key={e.id} entry={e} onExpire={onExpire} />
      ))}
    </>
  );
}
