import { useState } from "react";
import { WEAPONS, WEAPON_CATEGORIES, type WeaponCategory } from "@/gameData";

interface ShopScreenProps {
  gold: number;
  ownedWeapons: number[];
  selectedWeapon: number;
  onBuy: (weaponId: number) => void;
  onSelect: (weaponId: number) => void;
  onBack: () => void;
}

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height:5,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden' }}>
      <div style={{ height:'100%',width:`${Math.min(100,value)}%`,background:color,borderRadius:3 }} />
    </div>
  );
}

export function ShopScreen({ gold, ownedWeapons, selectedWeapon, onBuy, onSelect, onBack }: ShopScreenProps) {
  const [cat, setCat] = useState<WeaponCategory>('pistol');

  const filtered = WEAPONS.filter((w) => w.category === cat);

  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">🛒 Boutique</h2>
        <div className="shop-gold"><span>🪙</span> {gold}</div>
      </div>

      <div style={{ padding:'0 20px 10px', color:'rgba(255,255,255,0.4)', fontSize:12 }}>
        Gagne de l'or : 20🪙/kill · 50🪙 victoire rapide · 200🪙 Battle Royale
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', gap:6, padding:'0 16px 14px', overflowX:'auto' }}>
        {WEAPON_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            style={{
              flexShrink:0,
              background: cat === c.id ? 'rgba(255,140,0,0.3)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${cat === c.id ? 'rgba(255,140,0,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:20, padding:'7px 14px',
              color: cat === c.id ? '#ffaa00' : 'rgba(255,255,255,0.6)',
              fontWeight:700, fontSize:12, cursor:'pointer',
              WebkitTapHighlightColor:'transparent',
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Weapon cards */}
      <div className="weapon-grid">
        {filtered.map((w) => {
          const owned    = ownedWeapons.includes(w.id);
          const equipped = selectedWeapon === w.id;
          const canBuy   = gold >= w.price && !owned;
          const cooldownBar = 100 - (w.cooldown / 2200) * 90;
          const dmgBar      = Math.min(100, ((w.dmgMult ?? 1) / 5) * 100);
          const rangeBar    = Math.min(100, ((w.rangeMult ?? 1) / 3) * 100);

          return (
            <div
              key={w.id}
              className={`weapon-card ${equipped ? 'weapon-card--selected' : ''}`}
              style={{ borderColor: equipped ? '#ffd700' : 'rgba(255,255,255,0.1)' }}
            >
              <div style={{ fontSize:30 }}>{w.icon}</div>
              <div className="wc-name">{w.name}</div>
              <div className="wc-desc">{w.description}</div>

              <div className="wc-stats">
                <div className="wc-stat">
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:2 }}>
                    <span>Cadence</span><span>{Math.round(cooldownBar)}%</span>
                  </div>
                  <StatBar value={cooldownBar} color="#44aaff" />
                </div>
                <div className="wc-stat">
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:2 }}>
                    <span>Dégâts</span><span>{Math.round(dmgBar)}%</span>
                  </div>
                  <StatBar value={dmgBar} color="#ff4444" />
                </div>
                <div className="wc-stat">
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:2 }}>
                    <span>Portée</span><span>{Math.round(rangeBar)}%</span>
                  </div>
                  <StatBar value={rangeBar} color="#44ff88" />
                </div>
              </div>

              {owned ? (
                equipped ? (
                  <div className="wc-btn wc-btn--equipped">✓ Équipé</div>
                ) : (
                  <button className="wc-btn wc-btn--select" onClick={() => onSelect(w.id)}>Équiper</button>
                )
              ) : (
                <button
                  className={`wc-btn ${canBuy ? 'wc-btn--buy' : 'wc-btn--locked'}`}
                  onClick={() => canBuy && onBuy(w.id)}
                  disabled={!canBuy}
                >
                  {w.price === 0 ? 'Gratuit' : `🪙 ${w.price}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Collectibles reminder */}
      <div style={{ padding:'16px 20px 24px', textAlign:'center' }}>
        <div className="shop-section-title">Objets sur la carte</div>
        <div className="map-items-grid">
          <div className="map-item">
            <div style={{ fontSize:26 }}>❤️</div>
            <div className="mi-name">Kit de soin</div>
            <div className="mi-desc">+30 HP</div>
          </div>
          <div className="map-item">
            <div style={{ fontSize:26 }}>📦</div>
            <div className="mi-name">Caisse munitions</div>
            <div className="mi-desc">+50 🪙</div>
          </div>
        </div>
      </div>
    </div>
  );
}
