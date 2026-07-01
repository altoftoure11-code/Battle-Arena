import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { EnemyData, BulletData, GameState, EnemyBulletData, FlightPhase, VehicleState, BloodEntry } from "@/types/game";
import type { CharacterDef, WeaponDef, GameMode } from "@/gameData";
import { Environment }     from "./Environment";
import { PlayerMesh }      from "./PlayerMesh";
import { EnemyMesh }       from "./EnemyMesh";
import { BulletMesh }      from "./BulletMesh";
import { AllyMesh }        from "./AllyMesh";
import { EnemyBullet }     from "./EnemyBullet";
import { Collectible, type CollectibleData } from "./Collectible";
import { GlooWall, type GlooWallData } from "./GlooWall";
import { AirplaneMesh, getAirplanePosition } from "./AirplaneMesh";
import { VehicleMesh }     from "./VehicleMesh";
import { BloodParticles }  from "./BloodParticles";
import { resolveObstacleCollision } from "@/lib/obstacles";
import type { GameInputRef } from "./MobileControls";

enum Controls { forward="forward", back="back", left="left", right="right", jump="jump" }

interface GameSceneProps {
  gameStateRef:     React.MutableRefObject<GameState>;
  enemies:          EnemyData[];
  bullets:          BulletData[];
  enemyBullets:     EnemyBulletData[];
  collectibles:     CollectibleData[];
  glooWalls:        GlooWallData[];
  bloodEntries:     BloodEntry[];
  inputRef:         React.MutableRefObject<GameInputRef>;
  isTouch:          boolean;
  hp:               number;
  character:        CharacterDef;
  weapon:           WeaponDef;
  gameMode:         GameMode;
  zoneRadius?:      number;
  playerPosRef:     React.MutableRefObject<THREE.Vector3>;
  playerYawRef:     React.MutableRefObject<number>;
  playerBodyColor:  string;
  playerLegsColor:  string;
  isZoomed:         boolean;
  flightPhase:      FlightPhase;
  airplaneProgress: number;
  vehicleState:     VehicleState | null;
  inVehicle:        boolean;
  safeZoneActive:   boolean;
  onShoot:          (pos:[number,number,number], dir:[number,number,number]) => void;
  onBulletHit:      (bulletId:number, enemyId:number) => void;
  onBulletExpire:   (bulletId:number) => void;
  onEnemyUpdate:    (id:number, pos:[number,number,number], vel:[number,number], timer:number) => void;
  onPlayerDamage:   (dmg:number) => void;
  onAllyKill:       (enemyId:number) => void;
  onCollect:        (id:number, type:"health"|"ammo") => void;
  onAddEnemyBullet: (pos:[number,number,number], dir:[number,number,number]) => void;
  onEnemyBulletHit: (id:number) => void;
  onEnemyBulletExp: (id:number) => void;
  onBloodExpire:    (id:number) => void;
  onGlooDamage:     (wallId:number, dmg:number) => void;
  onVehicleUpdate:  (pos:[number,number,number], rot:number, spd:number) => void;
  onCrushEnemy:     (enemyId:number) => void;
  onVehicleDmg:     (dmg:number) => void;
}

const ARENA_HALF      = 38;
const CAM_DISTANCE    = 6;
const CAM_HEIGHT      = 3.5;
const MOUSE_SENS      = 0.0025;
const TOUCH_SENS      = 0.007;
const JUMP_FORCE      = 10;
const GRAVITY         = -22;
const ENEMY_DMG       = 20;
const ENEMY_DMG_RANGE = 1.8;
const ENEMY_DMG_CD    = 1.5;
const ENEMY_SHOOT_MIN = 2.5;
const ENEMY_SHOOT_MAX = 24;
const ENEMY_SHOOT_CD  = 3.0;
const ZONE_DMG_CD     = 1.0;
const ZONE_DMG        = 3;
const GLOO_PUSH_R     = 1.45;

export function GameScene({
  gameStateRef, enemies, bullets, enemyBullets, collectibles, glooWalls,
  bloodEntries, inputRef, isTouch, hp, character, weapon, gameMode, zoneRadius,
  playerPosRef, playerYawRef, playerBodyColor, playerLegsColor, isZoomed,
  flightPhase, airplaneProgress, vehicleState, inVehicle, safeZoneActive,
  onShoot, onBulletHit, onBulletExpire, onEnemyUpdate,
  onPlayerDamage, onAllyKill, onCollect,
  onAddEnemyBullet, onEnemyBulletHit, onEnemyBulletExp,
  onBloodExpire, onGlooDamage, onVehicleUpdate, onCrushEnemy, onVehicleDmg,
}: GameSceneProps) {
  const { gl, camera } = useThree();
  const [, getControls] = useKeyboardControls<Controls>();

  const yawRef           = useRef(0);
  const pitchRef         = useRef(-0.25);
  const isLockedRef      = useRef(false);
  const lastShootRef     = useRef(0);
  const wasShootRef      = useRef(false);
  const wasJumpRef       = useRef(false);
  const jumpVelRef       = useRef(0);
  const isGroundedRef    = useRef(true);
  const jumpCountRef     = useRef(0);
  const hpRef            = useRef(hp);
  const dmgTimers        = useRef<Record<number,number>>({});
  const lastZoneDmgRef   = useRef(0);
  const enemyShootTimers = useRef<Record<number,number>>({});

  hpRef.current = hp;
  const moveSpeed = 6 * character.speedBonus;
  const cam = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    cam.position.set(0, CAM_HEIGHT + 3, -CAM_DISTANCE);
    cam.lookAt(0, 1.2, 0);
  }, [cam]);

  useEffect(() => {
    if (isTouch) return;
    const canvas = gl.domElement;
    const onClick = () => {
      if (!isLockedRef.current && gameStateRef.current === "playing" && !inVehicle)
        canvas.requestPointerLock();
    };
    const onLock  = () => { isLockedRef.current = document.pointerLockElement === canvas; };
    const onMove  = (e: MouseEvent) => {
      if (!isLockedRef.current) return;
      yawRef.current   -= e.movementX * MOUSE_SENS;
      pitchRef.current -= e.movementY * MOUSE_SENS;
      pitchRef.current  = Math.max(-0.6, Math.min(0.5, pitchRef.current));
    };
    const onDown  = (e: MouseEvent) => {
      if (e.button === 0 && isLockedRef.current && gameStateRef.current === "playing" && !safeZoneActive) fireShot();
    };
    const noCtx   = (e: Event) => e.preventDefault();
    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLock);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("contextmenu", noCtx);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLock);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("contextmenu", noCtx);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [gl, isTouch, inVehicle, safeZoneActive]);

  function fireShot() {
    if (safeZoneActive) return;
    const now = performance.now();
    if (now - lastShootRef.current < weapon.cooldown) return;
    lastShootRef.current = now;
    const yaw = yawRef.current, pitch = pitchRef.current;
    const makeDir = (offset = 0): [number, number, number] => {
      const y2 = yaw + offset;
      const dx = Math.sin(y2) * Math.cos(pitch), dy = Math.sin(pitch), dz = Math.cos(y2) * Math.cos(pitch);
      const m = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return [dx / m, dy / m, dz / m];
    };
    const pp = playerPosRef.current;
    const spawn = (d: [number, number, number]): [number, number, number] =>
      [pp.x + d[0] * 1.2, pp.y + 0.5 + d[1] * 1.2, pp.z + d[2] * 1.2];
    const count = weapon.spreadCount ?? (weapon.spread ? 3 : 1);
    if (weapon.spread) {
      const step = 0.18 / Math.max(1, count - 1);
      for (let i = 0; i < count; i++) { const d = makeDir(-0.09 + i * step); onShoot(spawn(d), d); }
    } else {
      const d = makeDir(); onShoot(spawn(d), d);
    }
  }

  function resolveGlooCollision(nx: number, nz: number, py: number): { x: number; z: number } {
    let rx = nx, rz = nz;
    for (const gw of glooWalls) {
      const gwx = gw.position[0], gwz = gw.position[2];
      const dx = rx - gwx, dz = rz - gwz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < GLOO_PUSH_R && py < 2.5) {
        const push = GLOO_PUSH_R - dist;
        const len = Math.max(dist, 0.001);
        rx += (dx / len) * push;
        rz += (dz / len) * push;
      }
    }
    return { x: rx, z: rz };
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const isPlaying = gameStateRef.current === "playing";

    // Smooth FOV
    const targetFov = isZoomed ? 22 : 70;
    if (Math.abs(cam.fov - targetFov) > 0.5) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.18);
      cam.updateProjectionMatrix();
    }

    // Airplane phase camera
    if (flightPhase === "airplane" || flightPhase === "freefall" || flightPhase === "parachute") {
      const planePos = getAirplanePosition(airplaneProgress);
      const camOffset = new THREE.Vector3(0, 5, 12);
      cam.position.lerp(planePos.clone().add(camOffset), 0.05);
      cam.lookAt(planePos);
      if (flightPhase === "freefall" || flightPhase === "parachute") {
        cam.position.lerp(playerPosRef.current.clone().add(new THREE.Vector3(0, 10, 8)), 0.08);
        cam.lookAt(playerPosRef.current);
      }
      return;
    }

    if (!isPlaying) {
      yawRef.current += dt * 0.3;
      cam.position.set(Math.sin(yawRef.current) * 14, 8, Math.cos(yawRef.current) * 14);
      cam.lookAt(0, 1, 0);
      return;
    }

    if (inVehicle) {
      const yaw = playerYawRef.current;
      const camOff = new THREE.Vector3(-Math.sin(yaw) * 10, 5, -Math.cos(yaw) * 10);
      cam.position.lerp(playerPosRef.current.clone().add(camOff), 0.12);
      cam.lookAt(playerPosRef.current.clone().add(new THREE.Vector3(0, 1, 0)));
      yawRef.current = playerYawRef.current;
      return;
    }

    // Touch look
    const inp = inputRef.current;
    if (inp.lookDelta.x !== 0 || inp.lookDelta.y !== 0) {
      yawRef.current   -= inp.lookDelta.x * TOUCH_SENS;
      pitchRef.current -= inp.lookDelta.y * TOUCH_SENS;
      pitchRef.current  = Math.max(-0.6, Math.min(0.5, pitchRef.current));
      inp.lookDelta.x = inp.lookDelta.y = 0;
    }

    if (inp.shoot && !wasShootRef.current && !safeZoneActive) fireShot();
    wasShootRef.current = inp.shoot;

    // Jump
    const ctrl = getControls();
    const wantJump = inp.jump || ctrl.jump;
    const maxJumps = character.doubleJump ? 2 : 1;
    if (wantJump && !wasJumpRef.current && jumpCountRef.current < maxJumps) {
      jumpVelRef.current = JUMP_FORCE;
      isGroundedRef.current = false;
      jumpCountRef.current++;
    }
    wasJumpRef.current = wantJump;
    if (inp.jump) inp.jump = false;

    // Gravity
    if (!isGroundedRef.current) {
      jumpVelRef.current     += GRAVITY * dt;
      playerPosRef.current.y += jumpVelRef.current * dt;
      if (playerPosRef.current.y <= 0.75) {
        playerPosRef.current.y = 0.75;
        jumpVelRef.current     = 0;
        isGroundedRef.current  = true;
        jumpCountRef.current   = 0;
      }
    }

    // Move with ANTI-CLIP
    const yaw = yawRef.current;
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const rgt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const dir = new THREE.Vector3();
    if (ctrl.forward) dir.add(fwd);
    if (ctrl.back)    dir.sub(fwd);
    if (ctrl.right)   dir.add(rgt);
    if (ctrl.left)    dir.sub(rgt);
    if (inp.move.y !== 0) dir.addScaledVector(fwd, -inp.move.y);
    if (inp.move.x !== 0) dir.addScaledVector(rgt, inp.move.x);

    const spd = isZoomed ? moveSpeed * 0.4 : moveSpeed;
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(spd * dt);
      const prev = { x: playerPosRef.current.x, z: playerPosRef.current.z };
      const proposed = {
        x: playerPosRef.current.x + dir.x,
        z: playerPosRef.current.z + dir.z,
        y: playerPosRef.current.y,
      };
      // Obstacle collision
      let resolved = resolveObstacleCollision(proposed, prev);
      // Gloo wall collision
      resolved = resolveGlooCollision(resolved.x, resolved.z, proposed.y);
      // Arena bounds
      playerPosRef.current.x = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, resolved.x));
      playerPosRef.current.z = Math.max(-ARENA_HALF, Math.min(ARENA_HALF, resolved.z));
    }

    playerYawRef.current = yawRef.current;

    // Enemy melee + shooting
    if (hpRef.current > 0 && !safeZoneActive) {
      const pp = playerPosRef.current;
      const nowSec = performance.now() / 1000;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const [ex, , ez] = enemy.position;
        const dist = Math.sqrt((pp.x - ex) ** 2 + (pp.z - ez) ** 2);
        if (dist < ENEMY_DMG_RANGE) {
          const last = dmgTimers.current[enemy.id] ?? 0;
          if (nowSec - last > ENEMY_DMG_CD) {
            dmgTimers.current[enemy.id] = nowSec;
            onPlayerDamage(Math.round(ENEMY_DMG * (1 - (character.dmgReduce ?? 0))));
          }
        }
        if (dist > ENEMY_SHOOT_MIN && dist < ENEMY_SHOOT_MAX) {
          const lastShot = enemyShootTimers.current[enemy.id] ?? (Math.random() * 3);
          if (nowSec - lastShot > ENEMY_SHOOT_CD + Math.random() * 2) {
            enemyShootTimers.current[enemy.id] = nowSec;
            const d = new THREE.Vector3(pp.x - ex, 0, pp.z - ez).normalize();
            onAddEnemyBullet([ex, 0.75 + 0.3, ez], [d.x, d.y, d.z]);
          }
        }
      }
    }

    // Zone damage
    if (zoneRadius !== undefined && hpRef.current > 0) {
      const pp = playerPosRef.current;
      const d = Math.sqrt(pp.x * pp.x + pp.z * pp.z);
      if (d > zoneRadius) {
        const nowSec = performance.now() / 1000;
        if (nowSec - lastZoneDmgRef.current > ZONE_DMG_CD) {
          lastZoneDmgRef.current = nowSec;
          onPlayerDamage(ZONE_DMG);
        }
      }
    }

    // Camera follow player
    const pitch = pitchRef.current;
    const camOff = new THREE.Vector3(
      -Math.sin(yaw) * CAM_DISTANCE,
      CAM_HEIGHT + Math.sin(pitch) * CAM_DISTANCE * 0.5,
      -Math.cos(yaw) * CAM_DISTANCE
    );
    cam.position.lerp(playerPosRef.current.clone().add(camOff), 0.2);
    cam.lookAt(playerPosRef.current.clone().add(new THREE.Vector3(0, 1.2, 0)));
  });

  const isPlaying = gameStateRef.current === "playing";

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[30, 50, 20]} intensity={1.3} castShadow={!isTouch}
        shadow-mapSize={isTouch ? [512, 512] : [1024, 1024]}
        shadow-camera-far={150} shadow-camera-left={-60}
        shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60}
      />
      <hemisphereLight args={["#87ceeb", "#3d7a3d", 0.4]} />

      <Environment />

      {/* Airplane phase */}
      {(flightPhase === "airplane" || flightPhase === "freefall" || flightPhase === "parachute") && (
        <AirplaneMesh progress={airplaneProgress} />
      )}

      {/* Parachute visual */}
      {flightPhase === "parachute" && (
        <group position={[playerPosRef.current.x, playerPosRef.current.y + 3, playerPosRef.current.z]}>
          <mesh>
            <sphereGeometry args={[1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ff6600" side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
          {/* Parachute lines */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.8, -1.5, Math.sin(angle) * 0.8]}>
                <cylinderGeometry args={[0.01, 0.01, 3, 3]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Zone ring (BR) */}
      {zoneRadius !== undefined && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[zoneRadius - 0.4, zoneRadius, 64]} />
          <meshBasicMaterial color="#3399ff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Player */}
      {!inVehicle && (
        <PlayerMesh
          posRef={playerPosRef}
          yawRef={yawRef}
          color={playerBodyColor}
          helmetColor={playerLegsColor}
          auraColor={character.auraColor}
        />
      )}

      {/* Vehicle */}
      {vehicleState && (
        <VehicleMesh
          vehicleState={vehicleState}
          playerPosRef={playerPosRef}
          playerYawRef={playerYawRef}
          isOccupied={inVehicle}
          enemies={enemies}
          onUpdate={onVehicleUpdate}
          onCrushEnemy={onCrushEnemy}
          onVehicleDamage={onVehicleDmg}
        />
      )}

      {/* Enemies */}
      {isPlaying && enemies.map((e) => e.alive ? (
        <EnemyMesh key={e.id} enemy={e} onUpdate={onEnemyUpdate} />
      ) : null)}

      {/* Ally */}
      {isPlaying && gameMode === "multiplayer" && (
        <AllyMesh enemies={enemies} onKillEnemy={onAllyKill} />
      )}

      {/* Player bullets */}
      {isPlaying && bullets.map((b) => (
        <BulletMesh
          key={b.id} bullet={b} enemies={enemies}
          glooWalls={glooWalls}
          onHit={onBulletHit} onExpire={onBulletExpire}
        />
      ))}

      {/* Enemy bullets */}
      {isPlaying && enemyBullets.map((b) => (
        <EnemyBullet
          key={b.id} bullet={b} playerPos={playerPosRef}
          onHit={onEnemyBulletHit} onExpire={onEnemyBulletExp}
        />
      ))}

      {/* Collectibles */}
      {isPlaying && collectibles.map((c) => !c.collected ? (
        <Collectible key={c.id} item={c} playerPos={playerPosRef} onCollect={onCollect} />
      ) : null)}

      {/* Gloo walls */}
      {glooWalls.map((gw) => (
        <GlooWall key={gw.id} wall={gw} bullets={bullets} onDamage={onGlooDamage} />
      ))}

      {/* Blood particles */}
      <BloodParticles entries={bloodEntries} onExpire={onBloodExpire} />
    </>
  );
}
