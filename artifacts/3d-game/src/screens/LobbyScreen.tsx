import { useState } from "react";
import { CHARACTERS, WEAPONS, MODES, type GameMode } from "@/gameData";

interface LobbyScreenProps {
  gold:           number;
  diamonds:       number;
  level:          number;
  username:       string;
  selectedChar:   number;
  selectedWeapon: number;
  gameMode:       GameMode;
  ownedWeapons:   number[];
  onNavigate: (screen: string) => void;
  onStart:    () => void;
  onLogout:   () => void;
}

const MODE_ICONS = ['⚡','🏆','👥','🎯','🗡️','🛡️','💀','🌙','🏝️','⚔️'];

export function LobbyScreen({
  gold, diamonds, level, username, selectedChar, selectedWeapon,
  gameMode, onNavigate, onStart, onLogout,
}: LobbyScreenProps) {
  const [showModePopup, setShowModePopup] = useState(false);
  const char   = CHARACTERS[selectedChar] ?? CHARACTERS[0];
  const weapon = WEAPONS[selectedWeapon]  ?? WEAPONS[0];
  const mode   = MODES.find((m) => m.id === gameMode) ?? MODES[0];

  return (
    <div className="lobby-ff">
      {/* Ocean background animation */}
      <div className="lobby-ocean-bg" />
      <div className="lobby-bubbles">
        {Array.from({length:14},(_,i)=>(
          <div key={i} className="lobby-bubble" style={{ left:`${(i*7+3)%100}%`, width:i%4===0?10:6, height:i%4===0?10:6, animationDuration:`${4+i%3}s`, animationDelay:`${i*0.35}s` }} />
        ))}
      </div>

      {/* ── Top bar ── */}
      <div className="lff-topbar">
        <div className="lff-player">
          <div className="lff-avatar" style={{ background: char.color }}>{(username?.[0] ?? '?').toUpperCase()}</div>
          <div>
            <div className="lff-name">{username}</div>
            <div className="lff-level">
              <div className="lff-xp-bar"><div style={{ width:`${(level%10)*10}%` }} /></div>
              <span>Niv. {level}</span>
            </div>
          </div>
        </div>

        <div className="lff-currencies">
          <div className="lff-currency lff-currency--gold">
            <span>🪙</span><span>{gold}</span>
          </div>
          <div className="lff-currency lff-currency--dia">
            <span>💎</span><span>{diamonds}</span>
          </div>
        </div>

        <div className="lff-topright">
          <button className="lff-icon-btn" title="Paramètres">⚙️</button>
          <button className="lff-icon-btn" onClick={onLogout} title="Déconnexion">🚪</button>
        </div>
      </div>

      {/* ── Left sidebar ── */}
      <div className="lff-sidebar">
        {[
          { icon:'🛒', label:'Boutique',  screen:'shop' },
          { icon:'🎽', label:'Vestiaire', screen:'wardrobe' },
          { icon:'👤', label:'Perso',     screen:'characters' },
          { icon:'👥', label:'Amis',      screen:'friends' },
          { icon:'⚙️', label:'HUD',       screen:'settings' },
        ].map((item) => (
          <button key={item.screen} className="lff-side-btn" onClick={() => onNavigate(item.screen)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Center: character preview ── */}
      <div className="lff-center">
        <div className="lff-year">2026</div>

        {/* 3D-ish character preview */}
        <div className="lff-char-preview">
          <div className="lff-char-shadow" />
          <div className="lff-char-body" style={{ background: char.color }}>
            <div className="lff-char-helmet" style={{ background: char.helmetColor }} />
            <div className="lff-char-head" />
            <div className="lff-char-torso" style={{ background: char.color }} />
            <div className="lff-char-arms" style={{ background: char.color }}>
              <div style={{ background: char.color }} />
              <div style={{ background: char.color }} />
            </div>
            <div className="lff-char-legs" style={{ background: char.helmetColor }}>
              <div /><div />
            </div>
          </div>
          <div className="lff-char-platform" />
        </div>

        <div className="lff-char-name-badge">
          <span style={{ color: char.color }}>▶</span> {char.name}
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginLeft:6 }}>Niv. {level}</span>
        </div>

        {/* Equipped weapon badge */}
        <div className="lff-weapon-badge">
          {weapon.icon} <strong>{weapon.name}</strong> · {weapon.description}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="lff-bottom">
        <div className="lff-bottom-left">
          <button className="lff-bottom-btn" onClick={() => onNavigate('modes')}>
            <span>{mode.icon}</span><span>{mode.name}</span>
          </button>
          <button className="lff-bottom-btn" onClick={() => onNavigate('characters')}>
            <span>👤</span><span>Perso</span>
          </button>
          <button className="lff-bottom-btn" onClick={() => onNavigate('shop')}>
            <span>🛒</span><span>Armes</span>
          </button>
        </div>

        <button className="lff-start-btn" onClick={onStart}>
          <span>START</span>
          <span style={{ fontSize:11, opacity:0.8 }}>{mode.name}</span>
        </button>
      </div>

      {/* Mode badge */}
      <div className="lff-mode-badge" style={{ borderColor: mode.color }}>
        <span style={{ fontSize:20 }}>{mode.icon}</span>
        <span style={{ color: mode.color, fontWeight:800 }}>{mode.name}</span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{mode.description}</span>
      </div>
    </div>
  );
}
