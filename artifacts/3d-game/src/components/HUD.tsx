import { useEffect, useState } from "react";
import { WEAPONS } from "@/gameData";
import type { KillEntry } from "./Game";

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
}

const EMOTES = ['🕺','💃','🤸','🙏','🎉','✌️','💪','👋'];

export function HUD({
  score, enemiesAlive, kills, hp, maxHp, gold, diamonds,
  showDamageFlash, zoneRadius, zoneMaxRadius, isTouch,
  loadout, activeSlot, onSwitchSlot, gameMode, isZoomed,
  onCreateGloo, onToggleZoom,
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

  const hpPct   = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 60 ? "#44ee44" : hpPct > 30 ? "#ffaa00" : "#ff3333";
  const zoneWarn = zoneRadius !== undefined && zoneMaxRadius !== undefined && zoneRadius < zoneMaxRadius * 0.45;

  return (
    <div className="hud">
      {showDamageFlash && <div className="damage-flash" />}

      {/* Zone warning */}
      {zoneWarn && <div className="zone-warning">⚠️ LA ZONE SE RÉTRÉCIT !</div>}

      {/* Emote popup */}
      {activeEmote && (
        <div className="emote-popup">{activeEmote}</div>
      )}

      {/* ── TOP LEFT: score + minimap placeholder ── */}
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

      {/* ── BOTTOM: HP / EP bars ── */}
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

      {/* ── RIGHT SIDE: action buttons ── */}
      {isTouch && (
        <div className="hud-actions">
          <button
            className={`hud-action-btn hud-action-btn--scope ${isZoomed?"hud-action-btn--active":""}`}
            onClick={onToggleZoom}
          >
            <span>🔭</span>
            <span>VISÉE</span>
          </button>
          <button className="hud-action-btn hud-action-btn--gloo" onClick={onCreateGloo}>
            <span>🧊</span>
            <span>GLOO</span>
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
                  style={{ left: `calc(50% + ${Math.cos(angle)*r}px - 20px)`, top: `calc(50% + ${Math.sin(angle)*r}px - 20px)` }}
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
