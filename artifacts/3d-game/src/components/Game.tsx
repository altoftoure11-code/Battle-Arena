import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { GameScene }     from "./GameScene";
import { HUD }           from "./HUD";
import { SniperScope }   from "./SniperScope";
import { DamageNumbers, type DmgEntry } from "./DamageNumber";
import { MobileControls, createInputRef } from "./MobileControls";
import type { GameState, EnemyData, BulletData, EnemyBulletData, FlightPhase, VehicleState, BloodEntry } from "@/types/game";
import type { GlooWallData } from "./GlooWall";
import type { CharacterDef, WeaponDef, GameMode, Outfit } from "@/gameData";
import { WEAPONS, COSMETICS, GOLD_PER_KILL, GOLD_WIN_BONUS, GOLD_BR_WIN, VEHICLES } from "@/gameData";
import type { CollectibleData } from "./Collectible";

enum Controls { forward="forward", back="back", left="left", right="right", jump="jump" }
const keyMap = [
  { name:Controls.forward, keys:["ArrowUp",  "KeyW","KeyZ"] },
  { name:Controls.back,    keys:["ArrowDown", "KeyS"] },
  { name:Controls.left,    keys:["ArrowLeft", "KeyA","KeyQ"] },
  { name:Controls.right,   keys:["ArrowRight","KeyD"] },
  { name:Controls.jump,    keys:["Space"] },
];

const BR_ZONE_START    = 35;
const BR_ZONE_END      = 9;
const BR_ZONE_DURATION = 180;
const AIRPLANE_DURATION = 20; // seconds to cross map
const SAFE_ZONE_DURATION = 45;

function makeEnemies(mode: GameMode, level: number): EnemyData[] {
  const BASE = ["#ff3333","#ff9900","#cc00ff","#00ccff","#33ff33"];
  const MORE = ["#ff4444","#ff8800","#dd22ff","#22ccff","#44ff44","#ee2222","#ee7700","#cc00ee","#00bbee","#22ee22","#dd5555","#ddaa00","#bb33ff","#33bbff","#55dd55","#cc3333","#cc7700","#aa00cc","#00aacc","#33cc33","#bb4444","#bb8800"];
  const ZOMBIE_COLORS = ["#226622","#336633","#447744","#558855","#224422","#113311","#335533","#116611","#228822","#447744","#115511","#336633","#224422","#558855","#226622"];
  const pool = mode==="battle-royale"||mode==="zombie" ? (mode==="zombie"?ZOMBIE_COLORS:MORE) : BASE;
  const countMap: Record<GameMode,number> = {
    'quick': Math.min(5+(level-1)*2,14), 'battle-royale': 20, 'multiplayer': 8,
    'lone-wolf': 1, 'training': 5, 'tdm': 12, 'zombie': 15,
    'gun-game': 8, 'diamond-race': 6, 'king-hill': 10, 'capture-flag': 8,
  };
  const count = countMap[mode] ?? 8;
  const spdMult = 1+(level-1)*0.12;
  const zombieSpd = mode==="zombie" ? 0.7 : 1;
  return Array.from({length:count},(_,i)=>{
    const angle=Math.random()*Math.PI*2, dist=8+Math.random()*26;
    const spd=(1.5+Math.random()*1.5)*spdMult*zombieSpd, va=Math.random()*Math.PI*2;
    return {
      id:i, alive:true, color:pool[i%pool.length],
      position:[Math.cos(angle)*dist,0.75,Math.sin(angle)*dist] as [number,number,number],
      velocity:[Math.cos(va)*spd,Math.sin(va)*spd] as [number,number],
      changeTimer:Math.random()*3,
    };
  });
}

const INIT_COLLECTIBLES: CollectibleData[] = [
  { id:0, type:"health", position:[-8,0.5,12],  collected:false },
  { id:1, type:"health", position:[15,0.5,-8],   collected:false },
  { id:2, type:"health", position:[-20,0.5,5],   collected:false },
  { id:3, type:"ammo",   position:[10,0.5,-15],  collected:false },
  { id:4, type:"ammo",   position:[-5,0.5,20],   collected:false },
  { id:5, type:"ammo",   position:[22,0.5,10],   collected:false },
  { id:6, type:"health", position:[5,0.5,-30],   collected:false },
  { id:7, type:"ammo",   position:[-18,0.5,18],  collected:false },
  { id:8, type:"health", position:[28,0.5,18],   collected:false },
];

export interface KillEntry { id:number; time:number; }

interface GameProps {
  character:       CharacterDef;
  loadout:         (number|null)[];
  gameMode:        GameMode;
  level:           number;
  gold:            number;
  diamonds:        number;
  outfit:          Outfit;
  activeVehicleId: string | null;
  onGameEnd:       (result:"win"|"lose", kills:number, earnedGold:number, earnedDiamonds:number) => void;
}

export default function Game({
  character, loadout, gameMode, level, gold, diamonds, outfit, activeVehicleId, onGameEnd,
}: GameProps) {
  const maxHp = 100 + character.hpBonus;

  const [gameState,      setGameState]      = useState<GameState>("start");
  const [score,          setScore]          = useState(0);
  const [enemies,        setEnemies]        = useState<EnemyData[]>(()=>makeEnemies(gameMode,level));
  const [bullets,        setBullets]        = useState<BulletData[]>([]);
  const [enemyBullets,   setEnemyBullets]   = useState<EnemyBulletData[]>([]);
  const [kills,          setKills]          = useState<KillEntry[]>([]);
  const [hp,             setHp]             = useState(maxHp);
  const [earnedGold,     setEarnedGold]     = useState(0);
  const [earnedDia,      setEarnedDia]      = useState(0);
  const [showFlash,      setShowFlash]      = useState(false);
  const [isTouch,        setIsTouch]        = useState(false);
  const [collectibles,   setCollectibles]   = useState<CollectibleData[]>(INIT_COLLECTIBLES);
  const [zoneRadius,     setZoneRadius]     = useState(BR_ZONE_START);
  const [activeSlot,     setActiveSlot]     = useState(0);
  const [isZoomed,       setIsZoomed]       = useState(false);
  const [glooWalls,      setGlooWalls]      = useState<GlooWallData[]>([]);
  const [dmgNumbers,     setDmgNumbers]     = useState<DmgEntry[]>([]);
  const [bloodEntries,   setBloodEntries]   = useState<BloodEntry[]>([]);
  const [flightPhase,    setFlightPhase]    = useState<FlightPhase>(null);
  const [airplaneProgress, setAirplaneProgress] = useState(0);
  const [safeZoneTimer,  setSafeZoneTimer]  = useState(0);
  const [vehicleState,   setVehicleState]   = useState<VehicleState|null>(null);
  const [inVehicle,      setInVehicle]      = useState(false);
  const [vehicleHealth,  setVehicleHealth]  = useState(0);

  const bulletId       = useRef(0);
  const enemyBulletId  = useRef(1_000_000);
  const bloodId        = useRef(0);
  const dmgId          = useRef(0);
  const inputRef       = useRef(createInputRef());
  const gameStateRef   = useRef<GameState>("start");
  const flashTimer     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const scoreRef       = useRef(0);
  const playerPosRef   = useRef(new THREE.Vector3(0,0.75,0));
  const playerYawRef   = useRef(0);
  const isZoomedRef    = useRef(false);
  const airplaneRef    = useRef(0);
  const safeTimerRef   = useRef(0);

  gameStateRef.current = gameState;
  isZoomedRef.current  = isZoomed;
  airplaneRef.current  = airplaneProgress;

  const activeWeapon = WEAPONS[loadout[activeSlot] ?? 0] ?? WEAPONS[0];

  useEffect(() => { setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);

  const enemiesAlive = enemies.filter((e) => e.alive).length;

  // Battle Royale zone shrink
  useEffect(() => {
    if (gameMode!=="battle-royale" || gameState!=="playing") return;
    const iv = setInterval(()=>setZoneRadius((r)=>Math.max(BR_ZONE_END,r-(BR_ZONE_START-BR_ZONE_END)/BR_ZONE_DURATION)),1000);
    return ()=>clearInterval(iv);
  }, [gameMode,gameState]);

  // Heal regen
  useEffect(() => {
    if (!character.healRegen || gameState!=="playing") return;
    const iv = setInterval(()=>setHp((h)=>Math.min(maxHp,h+2)),3000);
    return ()=>clearInterval(iv);
  }, [character.healRegen,gameState,maxHp]);

  // Airplane phase ticker (BR only)
  useEffect(() => {
    if (flightPhase!=="airplane") return;
    const iv = setInterval(()=>{
      setAirplaneProgress((p) => {
        const next = p + 1/AIRPLANE_DURATION;
        if (next >= 1) { clearInterval(iv); }
        return Math.min(next, 1);
      });
    }, 1000);
    return ()=>clearInterval(iv);
  }, [flightPhase]);

  // Safe zone countdown
  useEffect(() => {
    if (flightPhase!=="landed") return;
    setSafeZoneTimer(SAFE_ZONE_DURATION);
    safeTimerRef.current = SAFE_ZONE_DURATION;
    const iv = setInterval(()=>{
      setSafeZoneTimer((t)=>{
        const next = t - 1;
        if (next <= 0) { clearInterval(iv); return 0; }
        return next;
      });
    }, 1000);
    return ()=>clearInterval(iv);
  }, [flightPhase]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) setActiveSlot(n - 1);
      if (e.key === "g" || e.key === "G") handleCreateGloo();
      if (e.key === "v" || e.key === "V") handleSpawnVehicle();
      if (e.key === "f" || e.key === "F") handleToggleVehicle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [glooWalls, vehicleState, inVehicle, activeVehicleId]);

  const triggerFlash = useCallback(() => {
    setShowFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setShowFlash(false), 420);
  }, []);

  const addDmgNumber = useCallback((x:number,y:number,value:number,headshot=false) => {
    const id = ++dmgId.current;
    setDmgNumbers((prev) => [...prev,{id,x,y,value,headshot}]);
  }, []);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0); setHp(maxHp); setEnemies(makeEnemies(gameMode,level));
    setBullets([]); setEnemyBullets([]); setKills([]);
    setEarnedGold(0); setEarnedDia(0);
    setCollectibles(INIT_COLLECTIBLES);
    setZoneRadius(BR_ZONE_START);
    setShowFlash(false); setGlooWalls([]);
    setIsZoomed(false); setActiveSlot(0);
    setBloodEntries([]); setDmgNumbers([]);
    setVehicleState(null); setInVehicle(false);
    setVehicleHealth(0);
    playerPosRef.current.set(0, 0.75, 0);

    if (gameMode === "battle-royale") {
      setFlightPhase("airplane");
      setAirplaneProgress(0);
      requestAnimationFrame(() => setGameState("playing"));
    } else {
      setFlightPhase(null);
      setSafeZoneTimer(0);
      requestAnimationFrame(() => setGameState("playing"));
    }
  }, [gameMode,level,maxHp]);

  const handleJumpFromPlane = useCallback(() => {
    if (flightPhase !== "airplane") return;
    setFlightPhase("freefall");
    // Place player at airplane position in sky
    const planePosApprox = new THREE.Vector3(
      -50 + airplaneRef.current * 100 + (Math.random()-0.5)*10,
      25,
      -50 + airplaneRef.current * 100 + (Math.random()-0.5)*10
    );
    playerPosRef.current.copy(planePosApprox);
    // After 2s freefall → parachute
    setTimeout(() => {
      setFlightPhase("parachute");
      // After 3s parachute → land
      setTimeout(() => {
        playerPosRef.current.y = 0.75;
        setFlightPhase("landed");
        setSafeZoneTimer(SAFE_ZONE_DURATION);
      }, 3000);
    }, 2000);
  }, [flightPhase]);

  const onShoot = useCallback((pos:[number,number,number],dir:[number,number,number]) => {
    setBullets((prev) => [...prev,{id:++bulletId.current,position:pos,direction:dir,life:1}]);
  }, []);

  const onBulletHit = useCallback((bId:number,eId:number) => {
    setBullets((prev) => prev.filter((b) => b.id !== bId));
    setEnemies((prev) => prev.map((e) => e.id===eId ? {...e,alive:false} : e));
    const enemy = enemies.find((e) => e.id === eId);
    if (enemy) {
      // Blood splatter
      const bloodEntry: BloodEntry = { id: ++bloodId.current, position: [...enemy.position] };
      setBloodEntries((prev) => [...prev, bloodEntry]);
    }
    scoreRef.current++;
    setScore(scoreRef.current);
    setEarnedGold((g) => g + GOLD_PER_KILL);
    setKills((prev) => [...prev,{id:Date.now(),time:Date.now()}]);
    if (character.healOnKill) setHp((h) => Math.min(maxHp,h+(character.healOnKill??0)));
    addDmgNumber(window.innerWidth/2+(Math.random()-0.5)*60,window.innerHeight/2-60,Math.round(25*(activeWeapon.dmgMult??1)));
    if (Math.random() < 0.15) setEarnedDia((d) => d+1);
  }, [enemies,character.healOnKill,maxHp,addDmgNumber,activeWeapon]);

  const onBulletExpire = useCallback((id:number) => { setBullets((prev) => prev.filter((b) => b.id !== id)); }, []);

  const onEnemyUpdate = useCallback((id:number,pos:[number,number,number],vel:[number,number],timer:number) => {
    setEnemies((prev) => prev.map((e) => e.id===id ? {...e,position:pos,velocity:vel,changeTimer:timer} : e));
  }, []);

  const onPlayerDamage = useCallback((dmg:number) => {
    if (safeTimerRef.current > 0) return;
    triggerFlash();
    setHp((prev) => {
      const next = Math.max(0, prev-dmg);
      if (next <= 0) setGameState("gameover");
      return next;
    });
  }, [triggerFlash]);

  const onAllyKill = useCallback((eId:number) => {
    setEnemies((prev) => prev.map((e) => e.id===eId ? {...e,alive:false} : e));
    setKills((prev) => [...prev,{id:Date.now(),time:Date.now()}]);
  }, []);

  const onCollect = useCallback((id:number,type:"health"|"ammo") => {
    setCollectibles((prev) => prev.map((c) => c.id===id ? {...c,collected:true} : c));
    if (type==="health") setHp((h) => Math.min(maxHp,h+30));
    else {
      setEarnedGold((g) => g+50);
      if (Math.random() < 0.2) setEarnedDia((d) => d+5);
    }
  }, [maxHp]);

  const onAddEnemyBullet = useCallback((pos:[number,number,number],dir:[number,number,number]) => {
    setEnemyBullets((prev) => [...prev,{id:++enemyBulletId.current,position:pos,direction:dir,life:1}]);
  }, []);

  const onEnemyBulletHit = useCallback((id:number) => {
    setEnemyBullets((prev) => prev.filter((b) => b.id !== id));
    if (safeTimerRef.current > 0) return;
    const dmg = Math.round(15*(1-(character.dmgReduce??0)));
    onPlayerDamage(dmg);
    addDmgNumber(window.innerWidth/2+(Math.random()-0.5)*30,window.innerHeight/2-40,dmg);
  }, [character.dmgReduce,onPlayerDamage,addDmgNumber]);

  const onEnemyBulletExp = useCallback((id:number) => { setEnemyBullets((prev) => prev.filter((b) => b.id !== id)); }, []);

  const onBloodExpire = useCallback((id:number) => { setBloodEntries((prev) => prev.filter((b) => b.id !== id)); }, []);

  const handleCreateGloo = useCallback(() => {
    if (glooWalls.length >= 4) return;
    const yaw = playerYawRef.current;
    const pos = playerPosRef.current;
    setGlooWalls((prev) => [...prev,{
      id: Date.now(),
      position: [pos.x+Math.sin(yaw)*2.5, 0, pos.z+Math.cos(yaw)*2.5] as [number,number,number],
      rotation: yaw, hp: 300,
    }]);
  }, [glooWalls.length]);

  const handleGlooDmg = useCallback((wallId:number,dmg:number) => {
    setGlooWalls((prev) => prev.map((w) => {
      if (w.id !== wallId) return w;
      const newHp = w.hp - dmg;
      return newHp <= 0 ? null! : {...w,hp:newHp};
    }).filter(Boolean));
  }, []);

  const handleToggleZoom = useCallback(() => { setIsZoomed((z) => !z); }, []);

  const handleSpawnVehicle = useCallback(() => {
    if (!activeVehicleId || vehicleState || gameState !== "playing") return;
    const vDef = VEHICLES.find((v) => v.id === activeVehicleId);
    if (!vDef) return;
    const pos = playerPosRef.current;
    setVehicleState({
      vehicleId: activeVehicleId,
      position: [pos.x + Math.sin(playerYawRef.current)*4, 0, pos.z + Math.cos(playerYawRef.current)*4],
      rotation: playerYawRef.current,
      health: vDef.health,
      speed: 0,
      isOccupied: false,
    });
    setVehicleHealth(vDef.health);
  }, [activeVehicleId, vehicleState, gameState]);

  const handleToggleVehicle = useCallback(() => {
    if (!vehicleState) return;
    const vPos = new THREE.Vector3(...vehicleState.position);
    const pPos = playerPosRef.current;
    const dist = vPos.distanceTo(pPos);
    if (!inVehicle && dist < 4) {
      setInVehicle(true);
    } else if (inVehicle) {
      setInVehicle(false);
      // Eject player next to vehicle
      const yaw = vehicleState.rotation;
      playerPosRef.current.set(
        vehicleState.position[0] + Math.cos(yaw)*2.5,
        0.75,
        vehicleState.position[2] + Math.sin(yaw)*2.5
      );
    }
  }, [vehicleState, inVehicle]);

  const onVehicleUpdate = useCallback((pos:[number,number,number],rot:number,spd:number) => {
    setVehicleState((prev) => prev ? {...prev, position:pos, rotation:rot, speed:spd} : null);
  }, []);

  const onCrushEnemy = useCallback((enemyId:number) => {
    setEnemies((prev) => prev.map((e) => e.id===enemyId ? {...e,alive:false} : e));
    const e = enemies.find((en) => en.id === enemyId);
    if (e) setBloodEntries((prev) => [...prev,{id:++bloodId.current,position:[...e.position]}]);
    setEarnedGold((g) => g+GOLD_PER_KILL);
    scoreRef.current++;
    setScore(scoreRef.current);
    setKills((prev) => [...prev,{id:Date.now(),time:Date.now()}]);
  }, [enemies]);

  const onVehicleDmg = useCallback((dmg:number) => {
    if (!vehicleState) return;
    const newHp = vehicleState.health - dmg;
    if (newHp <= 0) {
      setVehicleState(null);
      setInVehicle(false);
      // Eject player
      playerPosRef.current.y = 0.75;
    } else {
      setVehicleState((prev) => prev ? {...prev, health:newHp} : null);
      setVehicleHealth(newHp);
    }
  }, [vehicleState]);

  // Win condition
  useEffect(() => {
    if (gameState !== "playing" || enemiesAlive > 0) return;
    if (gameMode === "training") return; // training never ends
    setGameState("win");
  }, [enemiesAlive,gameState,gameMode]);

  // Update safe timer ref for sync
  useEffect(() => { safeTimerRef.current = safeZoneTimer; }, [safeZoneTimer]);

  const handleLobby = useCallback((result:"win"|"lose") => {
    const bonus = gameMode==="battle-royale" ? GOLD_BR_WIN : GOLD_WIN_BONUS;
    onGameEnd(result,scoreRef.current,earnedGold+(result==="win"?bonus:0),earnedDia);
  }, [earnedGold,earnedDia,gameMode,onGameEnd]);

  const topItem   = COSMETICS.find((c) => c.id === outfit.topId);
  const pantsItem = COSMETICS.find((c) => c.id === outfit.pantsId);
  const playerBodyColor = topItem?.colorOverride || character.color;
  const playerLegsColor = pantsItem?.colorOverride || character.helmetColor;
  const safeZoneActive = safeZoneTimer > 0;

  const isPlaying = gameState === "playing";

  return (
    <div style={{ width:"100vw",height:"100vh",touchAction:"none",overflow:"hidden" }}>
      <Canvas
        shadows={!isTouch}
        camera={{ fov:70,near:0.1,far:500,position:[0,9,-8] }}
        style={{ position:"absolute",inset:0,background:"#1a2a3a" }}
        gl={{ antialias:!isTouch,powerPreference:"high-performance" }}
        dpr={isTouch ? Math.min(window.devicePixelRatio,1.5) : undefined}
      >
        <Sky distance={450000} sunPosition={[100,80,-100]} inclination={0.49} azimuth={0.25} />
        <KeyboardControls map={keyMap}>
          <GameScene
            gameStateRef={gameStateRef}
            enemies={enemies} bullets={bullets}
            enemyBullets={enemyBullets} collectibles={collectibles}
            glooWalls={glooWalls} bloodEntries={bloodEntries}
            inputRef={inputRef} isTouch={isTouch} hp={hp}
            character={character} weapon={activeWeapon}
            gameMode={gameMode}
            zoneRadius={gameMode==="battle-royale" ? zoneRadius : undefined}
            playerPosRef={playerPosRef} playerYawRef={playerYawRef}
            playerBodyColor={playerBodyColor} playerLegsColor={playerLegsColor}
            isZoomed={isZoomed}
            flightPhase={flightPhase} airplaneProgress={airplaneProgress}
            vehicleState={vehicleState} inVehicle={inVehicle}
            safeZoneActive={safeZoneActive}
            onShoot={onShoot} onBulletHit={onBulletHit} onBulletExpire={onBulletExpire}
            onEnemyUpdate={onEnemyUpdate} onPlayerDamage={onPlayerDamage}
            onAllyKill={onAllyKill} onCollect={onCollect}
            onAddEnemyBullet={onAddEnemyBullet}
            onEnemyBulletHit={onEnemyBulletHit} onEnemyBulletExp={onEnemyBulletExp}
            onBloodExpire={onBloodExpire} onGlooDamage={handleGlooDmg}
            onVehicleUpdate={onVehicleUpdate}
            onCrushEnemy={onCrushEnemy} onVehicleDmg={onVehicleDmg}
          />
        </KeyboardControls>
      </Canvas>

      <SniperScope isZoomed={isZoomed} />
      <DamageNumbers entries={dmgNumbers} onExpire={(id)=>setDmgNumbers((prev)=>prev.filter((d)=>d.id!==id))} />

      {/* ── Safe zone timer ── */}
      {safeZoneActive && isPlaying && (
        <div className="safezone-banner">
          🕊️ ZONE SÉCURISÉE — Aucun combat pendant <strong>{safeZoneTimer}s</strong>
          <div className="sz-bar"><div className="sz-bar-fill" style={{ width:`${(safeZoneTimer/SAFE_ZONE_DURATION)*100}%` }} /></div>
        </div>
      )}

      {/* ── Airplane jump UI ── */}
      {flightPhase === "airplane" && (
        <div className="airplane-ui">
          <div className="air-info">✈️ VOL EN COURS — CHOISISSEZ VOTRE ZONE DE SAUT</div>
          <div className="air-progress">
            <div className="air-prog-fill" style={{ width:`${airplaneProgress*100}%` }} />
          </div>
          <button className="air-jump-btn" onClick={handleJumpFromPlane}>
            🪂 SAUTER !
          </button>
        </div>
      )}

      {/* ── Freefall / Parachute UI ── */}
      {(flightPhase==="freefall"||flightPhase==="parachute") && (
        <div className="freefall-ui">
          {flightPhase==="freefall" ? "💨 EN CHUTE LIBRE..." : "🪂 PARACHUTE DÉPLOYÉ !"}
        </div>
      )}

      {/* ── Vehicle HUD ── */}
      {isPlaying && vehicleState && (
        <div className="vehicle-hud">
          <div className="vhud-row">
            🚗 {Math.abs(Math.round(vehicleState.speed))} km/h
          </div>
          <div className="vhud-row">
            🛡 {vehicleState.health} HP
            <div className="vhud-bar"><div style={{ width:`${(vehicleState.health/500)*100}%`, background:"#44aaff" }} /></div>
          </div>
          {!inVehicle && (
            <div className="vhud-hint">Approche + <strong>F</strong> pour monter</div>
          )}
          {inVehicle && (
            <div className="vhud-hint"><strong>F</strong> pour descendre · <strong>ZQSD</strong> conduire</div>
          )}
        </div>
      )}

      {/* ── Start overlay ── */}
      {gameState === "start" && (
        <div className="overlay">
          <div className="badge-label">Prêt ?</div>
          <h1>ZONE DE COMBAT</h1>
          <p className="subtitle">
            {isTouch
              ? "Joystick · Glisse pour viser · 🔥 TIRER · ⬆ SAUTER"
              : "ZQSD · Espace sauter · Clic G tirer · G=Gloo · V=Véhicule · F=Monter"
            }
          </p>
          <button className="play-btn" onClick={resetGame}>COMMENCER</button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="overlay gameover-overlay">
          <div className="badge-label" style={{ color:"rgba(255,60,60,0.9)" }}>Éliminé</div>
          <h1 style={{ color:"#ff4444" }}>GAME OVER</h1>
          <div style={{ fontSize:22,color:"#fff" }}>
            Score : <span style={{ color:"#ffd700" }}>{score}</span> · 🪙 {earnedGold}
            {earnedDia>0 && ` · 💎 ${earnedDia}`}
          </div>
          <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginTop:8 }}>
            <button className="play-btn" onClick={resetGame}>RECOMMENCER</button>
            <button className="play-btn" style={{ background:"rgba(255,255,255,0.15)" }} onClick={()=>handleLobby("lose")}>LOBBY</button>
          </div>
        </div>
      )}

      {gameState === "win" && (
        <div className="overlay win-overlay">
          <div className="badge-label" style={{ color:"rgba(255,215,0,0.9)" }}>Victoire !</div>
          <h1>BOOYAH !</h1>
          <div className="final-score">{score} KILLS</div>
          <div style={{ fontSize:18,color:"#ffd700" }}>
            🪙 +{earnedGold+(gameMode==="battle-royale"?GOLD_BR_WIN:GOLD_WIN_BONUS)} or
            {earnedDia>0 && ` · 💎 +${earnedDia}`}
          </div>
          <div style={{ display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",marginTop:8 }}>
            <button className="play-btn" onClick={resetGame}>REJOUER</button>
            <button className="play-btn" style={{ background:"rgba(255,255,255,0.15)" }} onClick={()=>handleLobby("win")}>LOBBY</button>
          </div>
        </div>
      )}

      {isPlaying && flightPhase !== "airplane" && flightPhase !== "freefall" && flightPhase !== "parachute" && (
        <>
          <HUD
            score={score} enemiesAlive={enemiesAlive} kills={kills}
            hp={hp} maxHp={maxHp} gold={gold+earnedGold} diamonds={diamonds+earnedDia}
            showDamageFlash={showFlash}
            zoneRadius={gameMode==="battle-royale" ? zoneRadius : undefined}
            zoneMaxRadius={gameMode==="battle-royale" ? BR_ZONE_START : undefined}
            isTouch={isTouch} loadout={loadout} activeSlot={activeSlot}
            onSwitchSlot={setActiveSlot} gameMode={gameMode}
            isZoomed={isZoomed} onCreateGloo={handleCreateGloo} onToggleZoom={handleToggleZoom}
          />
          <MobileControls inputRef={inputRef} />
        </>
      )}
    </div>
  );
}
