import { useState } from "react";
import { COSMETICS, CHARACTERS, type CosmeticCategory, type Outfit } from "@/gameData";

interface WardrobeScreenProps {
  gold: number;
  selectedChar: number;
  outfit: Outfit;
  ownedCosmetics: string[];
  onBuy:    (id: string, price: number) => void;
  onEquip:  (id: string, category: CosmeticCategory) => void;
  onBack:   () => void;
}

const TABS: { id: CosmeticCategory; label: string; icon: string }[] = [
  { id: 'top',         label: 'Hauts',        icon: '👕' },
  { id: 'pants',       label: 'Pantalons',     icon: '👖' },
  { id: 'weapon-skin', label: "Skins armes",   icon: '🎨' },
];

export function WardrobeScreen({
  gold, selectedChar, outfit, ownedCosmetics, onBuy, onEquip, onBack,
}: WardrobeScreenProps) {
  const [tab, setTab] = useState<CosmeticCategory>('top');
  const char = CHARACTERS[selectedChar];

  const equippedId =
    tab === 'top'         ? outfit.topId :
    tab === 'pants'       ? outfit.pantsId :
                             outfit.weaponSkinId;

  const topItem   = COSMETICS.find((c) => c.id === outfit.topId);
  const pantsItem = COSMETICS.find((c) => c.id === outfit.pantsId);

  const bodyColor   = topItem?.colorOverride   || char.color;
  const legsColor   = pantsItem?.colorOverride || char.helmetColor;

  const filtered = COSMETICS.filter((c) => c.category === tab);

  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">🎽 Vestiaire</h2>
        <div className="shop-gold"><span>🪙</span> {gold}</div>
      </div>

      {/* Preview + tabs row */}
      <div className="wardrobe-top">
        {/* Character preview */}
        <div className="wardrobe-preview">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
            <div style={{ width:28,height:13,background:char.helmetColor,borderRadius:'4px 4px 0 0' }} />
            <div style={{ width:24,height:24,background:'#f5c878',borderRadius:3 }} />
            <div style={{ width:34,height:38,background:bodyColor,borderRadius:3,marginTop:1 }} />
            <div style={{ display:'flex',gap:2,marginTop:1 }}>
              <div style={{ width:15,height:26,background:legsColor,borderRadius:2 }} />
              <div style={{ width:15,height:26,background:legsColor,borderRadius:2 }} />
            </div>
          </div>
          <div style={{ fontSize:13,fontWeight:700,color:'#fff',marginTop:8 }}>{char.name}</div>
        </div>

        {/* Equipped summary */}
        <div className="wardrobe-equipped">
          <div style={{ fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:8,letterSpacing:'0.1em',textTransform:'uppercase' }}>Équipé</div>
          {[
            { label:'Haut',    id:outfit.topId },
            { label:'Bas',     id:outfit.pantsId },
            { label:'Arme',    id:outfit.weaponSkinId },
          ].map(({ label, id }) => {
            const item = COSMETICS.find((c) => c.id === id);
            return (
              <div key={label} style={{ display:'flex',gap:8,alignItems:'center',marginBottom:6 }}>
                <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',width:40 }}>{label}</span>
                <span style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{item?.name ?? '—'}</span>
                {item?.colorOverride && (
                  <div style={{ width:14,height:14,borderRadius:'50%',background:item.colorOverride,border:'1px solid rgba(255,255,255,0.3)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category tabs */}
      <div className="wardrobe-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`wardrobe-tab ${tab === t.id ? 'wardrobe-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="cosm-grid">
        {filtered.map((item) => {
          const owned    = ownedCosmetics.includes(item.id) || item.price === 0;
          const equipped = item.id === equippedId;
          const canBuy   = gold >= item.price && !owned;

          return (
            <div
              key={item.id}
              className={`cosm-card ${equipped ? 'cosm-card--equipped' : ''}`}
            >
              {item.colorOverride ? (
                <div style={{ width:44,height:44,borderRadius:10,background:item.colorOverride,border:'2px solid rgba(255,255,255,0.15)',margin:'0 auto 8px' }} />
              ) : (
                <div style={{ fontSize:32,textAlign:'center',marginBottom:8 }}>✨</div>
              )}
              <div className="cosm-name">{item.name}</div>
              {equipped ? (
                <div className="cosm-btn cosm-btn--equipped">✓ Équipé</div>
              ) : owned ? (
                <button className="cosm-btn cosm-btn--equip" onClick={() => onEquip(item.id, item.category)}>
                  Équiper
                </button>
              ) : (
                <button
                  className={`cosm-btn ${canBuy ? 'cosm-btn--buy' : 'cosm-btn--locked'}`}
                  onClick={() => canBuy && onBuy(item.id, item.price)}
                  disabled={!canBuy}
                >
                  🪙 {item.price}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
