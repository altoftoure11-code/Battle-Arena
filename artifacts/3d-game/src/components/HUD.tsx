import { useEffect, useState } from "react";
import { WEAPONS } from "@/gameData";
import type { KillEntry } from "./Game";
import type { CharacterDef, WeaponDef } from "@/gameData";

interface HUDProps {
  score:            number;
  enemiesAlive:     number;
  kills:            KillEntry[];
  hp:               number;
  maxHp:            number;
  gold:             number;
  diamonds:         number;
  showDamageFlash:  boolean;
  zoneRadius?:      number;
  zoneMaxRadius?:   number;
  isTouch?:         boolean;
  loadout:          (number|null)[];
  activeSlot:       number;
  onSwitchSlot:     (slot: number) => void;
  gameMode:         string;
  isZoomed?:        boolean;
  onCreateGloo:     () => void;
  onToggleZoom:     () => void;
  medKits:          number;
  onUseMedKit:      () => void;
  skillCooldown:    number;
  skillMaxCd:       number;
  onUseSkill:       () => void;
  character:        CharacterDef;
  activeWeapon:     WeaponDef;
}

const EMOTES = ['🕺','💃','🤸','🙏','🎉','✌️','💪','👋'];

const CATEGORY_COLOR: Record<string, string> = {
  pistol:  '#ffdd44',
  smg:     '#ff9900',
  assault: '#ff4400',
  sniper:  '#44aaff',
  shotgun: '#cc44ff',
};
const CATEGORY_LABEL: Record<string, string> = {
  pistol:  'PISTOLET',
  smg:     'MITRAILLETTE',
  assault: 'FUSIL D\'ASSAUT',
  sniper:  'SNIPER',
  shotgun: 'FUSIL À POMPE',
};

export function HUD({
  score, enemiesAlive, kills, hp, maxHp, gold, diamonds,
  showDamageFlash, zoneRadius, zoneMaxRadius, isTouch,
  loadout, activeSlot, onSwitchSlot, gameMode, isZoomed,
  onCreateGloo, onToggleZoom,
  medKits, onUseMedKit, skillCooldown, skillMaxCd, onUseSkill,
  character, activeWeapon,
}: HUDProps) {
  const [visibleKills,  setVisibleKills]  = useState<KillEntry[]>([]);
  const [showEmotes,    setShowEmotes]    = useState(false);
  const [activeEmote,   setActiveEmote]   = useState<string|null>(null);

  useEffect(() => {
    if (kills.length === 0) return;
    const latest = kills[kills.length - 1];
    setVisibleKills((prev) => [...prev, latest]);
    const t = setTimeout(() => {
      setVisibleKills((prev) => prev.filter((k) => k.id !== latest.id));
    }, 2200);
    return () => clearTimeout(t);
  }, [kills]);

  useEffect(() => {
    if (!activeEmote) return;
    const t = setTimeout(() => setActiveEmote(null), 2000);
    return () => clearTimeout(t);
  }, [activeEmote]);

  const hpPct      = Math.max(0, (hp / maxHp) * 100);
  const hpColor    = hpPct > 60 ? "#44ee44" : hpPct > 30 ? "#ffaa00" : "#ff3333";
  const zoneWarn   = zoneRadius !== undefined && zoneMaxRadius !== undefined && zoneRadius < zoneMaxRadius * 0.45;
  const skillReady = skillCooldown <= 0;
  const skillPct   = skillMaxCd > 0 ? (skillCooldown / skillMaxCd) * 100 : 0;
  const weapColor  = CATEGORY_COLOR[activeWeapon.category] ?? '#fff';
  const weapLabel  = CATEGORY_LABEL[activeWeapon.category] ?? activeWeapon.category.toUpperCase();
  const ammoLabel  = activeWeapon.cooldown < 120 ? '∞ AUTO' : activeWeapon.cooldown < 250 ? '80 / 240' : '5 / 20';

  return (
    <div className="hud">
      {showDamageFlash && <div className="damage-flash" />}

      {zoneWarn && <div className="zone-warning">⚠️ LA ZONE SE RÉTRÉCIT !</div>}

      {activeEmote && <div className="emote-popup">{activeEmote}</div>}

      {/* ── TOP LEFT: score + minimap ── */}
      <div className="hud-topleft">
        <div className="hud-minimap">
          <div className="minimap-player" />
          <div style={{ position:"absolute", bottom:4, left:4, fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:"0.05em" }}>CARTE</div>
        </div>
        <div className="hud-score-panel">
          <div className="hud-score-row"><span>🎯</span><span className="hud-score-val">{score}</span></div>
          <div className="hud-score-row"><span>👾</span><span style={{ color:"#ff4444", fontWeight:800 }}>{enemiesAlive}</span></div>
          <div className="hud-score-row"><span>🪙</span><span style={{ color:"#ffd700", fontWeight:800 }}>{gold}</span></div>
          {diamonds > 0 && <div className="hud-score-row"><span>💎</span><span style={{ color:"#44aaff", fontWeight:800 }}>{diamonds}</span></div>}
        </div>
      </div>

      {/* ── TOP RIGHT: weapon slots ── */}
      <div className="hud-weapon-slots">
        <div className="hws-label">AUTO</div>
        {loadout.map((weapId, i) => {
          const w = weapId !== null ? WEAPONS[weapId] : null;
          const isActive = i === activeSlot;
          return (
            <button
              key={i}
              className={`hws-slot ${isActive ? "hws-slot--active" : ""} ${!w ? "hws-slot--empty" : ""}`}
              onClick={() => w && onSwitchSlot(i)}
            >
              {w ? (
                <>
                  <span className="hws-icon">{w.icon}</span>
                  <div className="hws-info">
                    <div className="hws-name">{w.name}</div>
                    <div className="hws-ammo">{w.cooldown < 150 ? "∞" : "80"}</div>
                  </div>
                  {isActive && <div className="hws-active-dot" />}
                </>
              ) : (
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:18 }}>+</span>
              )}
            </button>
          );
        })}
        <div className="hws-items">
          {["Item","Item","Item","Item"].map((l,i) => (
            <div key={i} className="hws-item">{l}</div>
          ))}
        </div>
      </div>

      {/* ── CROSSHAIR ── */}
      {!isZoomed && (
        <div className="crosshair-ff">
          <div className="xhair-line xhair-top" />
          <div className="xhair-line xhair-bottom" />
          <div className="xhair-line xhair-left" />
          <div className="xhair-line xhair-right" />
          <div className="xhair-dot" />
        </div>
      )}

      {/* ── Kill feed ── */}
      <div className="kill-feed-ff">
        {visibleKills.map((k) => (
          <div key={k.id} className="kff-entry">
            <span className="kff-me">Toi</span>
            <span className="kff-elim">Éliminé</span>
            <span className="kff-enemy">Ennemi</span>
          </div>
        ))}
      </div>

      {/* ── Zone bar (BR) ── */}
      {zoneRadius !== undefined && zoneMaxRadius !== undefined && (
        <div className="zone-bar-wrap">
          <div className="zone-bar-label">🔵 Zone de sécurité</div>
          <div className="zone-bar-track">
            <div className="zone-bar-fill" style={{ width:`${(zoneRadius/zoneMaxRadius)*100}%` }} />
          </div>
        </div>
      )}

      {/* ── BOTTOM LEFT: HP/EP + Med kit + Skill ── */}
      <div className="hud-bottom-left">
        {/* HP / EP bars */}
        <div className="hud-bottom-bars">
          <div className="hbar-row">
            <span className="hbar-label">HP</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width:`${hpPct}%`, background: hpColor, boxShadow:`0 0 8px ${hpColor}88` }} />
            </div>
            <span className="hbar-val">{hp}/{maxHp}</span>
          </div>
          <div className="hbar-row">
            <span className="hbar-label" style={{ color:"#44aaff" }}>EP</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width:"100%", background:"#3388ff", boxShadow:"0 0 6px #3388ff88" }} />
            </div>
            <span className="hbar-val" style={{ color:"#88ccff" }}>250/250</span>
          </div>
        </div>

        {/* Quick-action row */}
        <div className="hud-quick-actions">
          {/* Medical Kit */}
          <button
            className={`hud-quick-btn hud-quick-btn--medkit ${medKits <= 0 ? "hud-quick-btn--disabled" : ""}`}
            onClick={onUseMedKit}
            disabled={medKits <= 0}
            title="Kit Médical [H]"
          >
            <span className="hqb-icon">🩹</span>
            <span className="hqb-label">KIT MED</span>
            <span className="hqb-count">{medKits}</span>
          </button>

          {/* Active Skill */}
          <button
            className={`hud-quick-btn hud-quick-btn--skill ${!skillReady ? "hud-quick-btn--cooldown" : ""}`}
            onClick={onUseSkill}
            disabled={!skillReady && character.skillType === 'active'}
            title={`${character.skillName} [Q]`}
          >
            <div className="hqb-cd-ring" style={{
              background: skillReady
                ? 'conic-gradient(#ffd700 100%, transparent 0%)'
                : `conic-gradient(rgba(255,255,255,0.12) ${100 - skillPct}%, #ffd700 0%)`
            }} />
            <span className="hqb-icon">⚡</span>
            <span className="hqb-label">{character.skillName.toUpperCase().slice(0,6)}</span>
            {!skillReady && <span className="hqb-cd-text">{skillCooldown}s</span>}
            {skillReady && character.skillType === 'passive' && <span className="hqb-passive-tag">PASS.</span>}
          </button>

          {/* Grenade slot */}
          <button className="hud-quick-btn hud-quick-btn--grenade" title="Grenade [G]" onClick={onCreateGloo}>
            <span className="hqb-icon">💣</span>
            <span className="hqb-label">GLOO</span>
            <span className="hqb-count">3</span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM CENTER: Weapon visual ── */}
      <div className="weapon-visual">
        <div className="wv-category" style={{ color: weapColor }}>{weapLabel}</div>
        <div className="wv-main">
          <span className="wv-icon">{activeWeapon.icon}</span>
          <div className="wv-details">
            <div className="wv-name">{activeWeapon.name}</div>
            <div className="wv-ammo">
              <span className="wv-ammo-cur" style={{ color: weapColor }}>{ammoLabel}</span>
            </div>
          </div>
        </div>
        <div className="wv-stat-row">
          <div className="wv-stat">
            <div className="wv-stat-label">DMG</div>
            <div className="wv-stat-bar">
              <div className="wv-stat-fill" style={{ width:`${Math.min(100, ((activeWeapon.dmgMult??1)*60))}%`, background: weapColor }} />
            </div>
          </div>
          <div className="wv-stat">
            <div className="wv-stat-label">VIT</div>
            <div className="wv-stat-bar">
              <div className="wv-stat-fill" style={{ width:`${Math.min(100, 100 - activeWeapon.cooldown/5)}%`, background:'#44ddff' }} />
            </div>
          </div>
          <div className="wv-stat">
            <div className="wv-stat-label">PORT</div>
            <div className="wv-stat-bar">
              <div className="wv-stat-fill" style={{ width:`${Math.min(100, ((activeWeapon.rangeMult??1)*55))}%`, background:'#44ff88' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: touch action buttons ── */}
      {isTouch && (
        <div className="hud-actions">
          <button
            className={`hud-action-btn hud-action-btn--scope ${isZoomed?"hud-action-btn--active":""}`}
            onClick={onToggleZoom}
          >
            <span>🔭</span>
            <span>VISÉE</span>
          </button>
          <button className="hud-action-btn hud-action-btn--crouch">
            <span>🦆</span>
            <span>ACCROUPIR</span>
          </button>
          <button className="hud-action-btn hud-action-btn--sprint">
            <span>💨</span>
            <span>SPRINT</span>
          </button>
        </div>
      )}

      {/* Desktop hint */}
      {!isTouch && (
        <div className="controls-hint">
          <div className="hint-pill"><span className="hint-key">ZQSD</span> Bouger</div>
          <div className="hint-pill"><span className="hint-key">Espace</span> Sauter</div>
          <div className="hint-pill"><span className="hint-key">Clic G</span> Tirer</div>
          <div className="hint-pill"><span className="hint-key">Clic D</span> Visée</div>
          <div className="hint-pill"><span className="hint-key">H</span> Kit Médical</div>
          <div className="hint-pill"><span className="hint-key">Q</span> Compétence</div>
          <div className="hint-pill"><span className="hint-key">G</span> Gloo Wall</div>
          <div className="hint-pill"><span className="hint-key">1-4</span> Armes</div>
        </div>
      )}

      {/* Emote wheel */}
      <div className="emote-container">
        <button className="emote-toggle-btn" onClick={() => setShowEmotes(!showEmotes)}>😀</button>
        {showEmotes && (
          <div className="emote-wheel">
            {EMOTES.map((e, i) => {
              const angle = (i / EMOTES.length) * Math.PI * 2 - Math.PI / 2;
              const r = 60;
              return (
                <button
                  key={i}
                  className="emote-slot"
                  style={{ left:`calc(50% + ${Math.cos(angle)*r}px - 20px)`, top:`calc(50% + ${Math.sin(angle)*r}px - 20px)` }}
                  onClick={() => { setActiveEmote(e); setShowEmotes(false); }}
                >
                  {e}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
