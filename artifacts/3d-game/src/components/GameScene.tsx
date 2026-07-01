import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import type { EnemyData, BulletData, GameState, EnemyBulletData } from "@/types/game";
import type { CharacterDef, WeaponDef, GameMode } from "@/gameData";
import { Environment }  from "./Environment";
import { PlayerMesh }   from "./PlayerMesh";
import { EnemyMesh }    from "./EnemyMesh";
import { BulletMesh }   from "./BulletMesh";
import { AllyMesh }     from "./AllyMesh";
import { EnemyBullet }  from "./EnemyBullet";
import { Collectible, type CollectibleData } from "./Collectible";
import type { GameInputRef } from "./MobileControls";

enum Controls { forward="forward", back="back", left="left", right="right", jump="jump" }

interface GameSceneProps {
  gameStateRef:     React.MutableRefObject<GameState>;
  enemies:          EnemyData[];
  bullets:          BulletData[];
  enemyBullets:     EnemyBulletData[];
  collectibles:     CollectibleData[];
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

export function GameScene({
  gameStateRef, enemies, bullets, enemyBullets, collectibles,
  inputRef, isTouch, hp, character, weapon, gameMode, zoneRadius,
  playerPosRef, playerYawRef, playerBodyColor, playerLegsColor, isZoomed,
  onShoot, onBulletHit, onBulletExpire, onEnemyUpdate,
  onPlayerDamage, onAllyKill, onCollect,
  onAddEnemyBullet, onEnemyBulletHit, onEnemyBulletExp,
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
    cam.position.set(0, CAM_HEIGHT+3, -CAM_DISTANCE);
    cam.lookAt(0,1.2,0);
  }, [cam]);

  useEffect(() => {
    if (isTouch) return;
    const canvas = gl.domElement;
    const onClick  = () => { if (!isLockedRef.current && gameStateRef.current==="playing") canvas.requestPointerLock(); };
    const onLock   = () => { isLockedRef.current = document.pointerLockElement===canvas; };
    const onMove   = (e:MouseEvent) => {
      if (!isLockedRef.current) return;
      yawRef.current   -= e.movementX * MOUSE_SENS;
      pitchRef.current -= e.movementY * MOUSE_SENS;
      pitchRef.current  = Math.max(-0.6, Math.min(0.5, pitchRef.current));
    };
    const onDown   = (e:MouseEvent) => {
      if (e.button===0 && isLockedRef.current && gameStateRef.current==="playing") fireShot();
    };
    const noCtx = (e:Event) => e.preventDefault();
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
      if (document.pointerLockElement===canvas) document.exitPointerLock();
    };
  }, [gl, isTouch]);

  function fireShot() {
    const now = performance.now();
    if (now - lastShootRef.current < weapon.cooldown) return;
    lastShootRef.current = now;
    const yaw = yawRef.current, pitch = pitchRef.current;
    const makeDir = (offset=0): [number,number,number] => {
      const y2=yaw+offset;
      const dx=Math.sin(y2)*Math.cos(pitch), dy=Math.sin(pitch), dz=Math.cos(y2)*Math.cos(pitch);
      const m=Math.sqrt(dx*dx+dy*dy+dz*dz); return [dx/m,dy/m,dz/m];
    };
    const pp = playerPosRef.current;
    const spawn = (d:[number,number,number]):[number,number,number] => [pp.x+d[0]*1.2, pp.y+0.5+d[1]*1.2, pp.z+d[2]*1.2];
    const count = weapon.spreadCount ?? (weapon.spread ? 3 : 1);
    if (weapon.spread) {
      const step = 0.18/Math.max(1,count-1);
      for (let i=0;i<count;i++) { const d=makeDir(-0.09+i*step); onShoot(spawn(d),d); }
    } else {
      const d = makeDir(); onShoot(spawn(d),d);
    }
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const isPlaying = gameStateRef.current==="playing";
    const inp = inputRef.current;

    // Smooth FOV transition for sniper zoom
    const targetFov = isZoomed ? 22 : 70;
    if (Math.abs(cam.fov - targetFov) > 0.5) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.18);
      cam.updateProjectionMatrix();
    }

    if (!isPlaying) {
      yawRef.current += dt*0.3;
      cam.position.set(Math.sin(yawRef.current)*14, 8, Math.cos(yawRef.current)*14);
      cam.lookAt(0,1,0);
      return;
    }

    // Touch look
    if (inp.lookDelta.x!==0||inp.lookDelta.y!==0) {
      yawRef.current   -= inp.lookDelta.x * TOUCH_SENS;
      pitchRef.current -= inp.lookDelta.y * TOUCH_SENS;
      pitchRef.current  = Math.max(-0.6,Math.min(0.5,pitchRef.current));
      inp.lookDelta.x = inp.lookDelta.y = 0;
    }

    if (inp.shoot && !wasShootRef.current) fireShot();
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

    // Move
    const yaw = yawRef.current;
    const fwd = new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
    const rgt = new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const dir = new THREE.Vector3();
    if (ctrl.forward) dir.add(fwd);
    if (ctrl.back)    dir.sub(fwd);
    if (ctrl.right)   dir.add(rgt);
    if (ctrl.left)    dir.sub(rgt);
    if (inp.move.y!==0) dir.addScaledVector(fwd,-inp.move.y);
    if (inp.move.x!==0) dir.addScaledVector(rgt, inp.move.x);
    const spd = isZoomed ? moveSpeed*0.4 : moveSpeed;
    if (dir.lengthSq()>0) {
      dir.normalize().multiplyScalar(spd*dt);
      playerPosRef.current.x = Math.max(-ARENA_HALF,Math.min(ARENA_HALF,playerPosRef.current.x+dir.x));
      playerPosRef.current.z = Math.max(-ARENA_HALF,Math.min(ARENA_HALF,playerPosRef.current.z+dir.z));
    }

    // Sync yaw to external ref (for gloo wall placement)
    playerYawRef.current = yawRef.current;

    // Enemy melee + shooting
    if (hpRef.current>0) {
      const pp = playerPosRef.current;
      const nowSec = performance.now()/1000;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const [ex,,ez] = enemy.position;
        const dist = Math.sqrt((pp.x-ex)**2+(pp.z-ez)**2);
        // Melee
        if (dist < ENEMY_DMG_RANGE) {
          const last = dmgTimers.current[enemy.id]??0;
          if (nowSec-last>ENEMY_DMG_CD) {
            dmgTimers.current[enemy.id]=nowSec;
            onPlayerDamage(Math.round(ENEMY_DMG*(1-(character.dmgReduce??0))));
          }
        }
        // Shoot
        if (dist>ENEMY_SHOOT_MIN&&dist<ENEMY_SHOOT_MAX) {
          const lastShot=enemyShootTimers.current[enemy.id]??(Math.random()*3);
          if (nowSec-lastShot>ENEMY_SHOOT_CD+Math.random()*2) {
            enemyShootTimers.current[enemy.id]=nowSec;
            const d=new THREE.Vector3(pp.x-ex,0,pp.z-ez).normalize();
            onAddEnemyBullet([ex,0.75+0.3,ez],[d.x,d.y,d.z]);
          }
        }
      }
    }

    // Zone damage
    if (zoneRadius!==undefined&&hpRef.current>0) {
      const pp=playerPosRef.current;
      const d=Math.sqrt(pp.x*pp.x+pp.z*pp.z);
      if (d>zoneRadius) {
        const nowSec=performance.now()/1000;
        if (nowSec-lastZoneDmgRef.current>ZONE_DMG_CD) {
          lastZoneDmgRef.current=nowSec;
          onPlayerDamage(ZONE_DMG);
        }
      }
    }

    // Camera
    const pitch = pitchRef.current;
    const camOff = new THREE.Vector3(-Math.sin(yaw)*CAM_DISTANCE, CAM_HEIGHT+Math.sin(pitch)*CAM_DISTANCE*0.5, -Math.cos(yaw)*CAM_DISTANCE);
    cam.position.lerp(playerPosRef.current.clone().add(camOff), 0.2);
    cam.lookAt(playerPosRef.current.clone().add(new THREE.Vector3(0,1.2,0)));
  });

  const isPlaying = gameStateRef.current==="playing";

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[30,50,20]} intensity={1.2} castShadow={!isTouch} shadow-mapSize={isTouch?[512,512]:[1024,1024]} shadow-camera-far={150} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} />
      <hemisphereLight args={["#87ceeb","#3d7a3d",0.4]} />

      <Environment />

      {zoneRadius!==undefined && (
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.05,0]}>
          <ringGeometry args={[zoneRadius-0.4,zoneRadius,64]} />
          <meshBasicMaterial color="#3399ff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      <PlayerMesh posRef={playerPosRef} yawRef={yawRef} color={playerBodyColor} helmetColor={playerLegsColor} />

      {isPlaying && enemies.map((e)=>e.alive?(
        <EnemyMesh key={e.id} enemy={e} onUpdate={onEnemyUpdate} />
      ):null)}

      {isPlaying && gameMode==="multiplayer" && (
        <AllyMesh enemies={enemies} onKillEnemy={onAllyKill} />
      )}

      {isPlaying && bullets.map((b)=>(
        <BulletMesh key={b.id} bullet={b} enemies={enemies} onHit={onBulletHit} onExpire={onBulletExpire} />
      ))}

      {isPlaying && enemyBullets.map((b)=>(
        <EnemyBullet key={b.id} bullet={b} playerPos={playerPosRef} onHit={onEnemyBulletHit} onExpire={onEnemyBulletExp} />
      ))}

      {isPlaying && collectibles.map((c)=>!c.collected?(
        <Collectible key={c.id} item={c} playerPos={playerPosRef} onCollect={onCollect} />
      ):null)}
    </>
  );
}
