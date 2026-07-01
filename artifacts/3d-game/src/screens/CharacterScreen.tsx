import { CHARACTERS } from "@/gameData";

interface CharacterScreenProps {
  selectedChar: number;
  onSelect: (id: number) => void;
  onBack: () => void;
}

export function CharacterScreen({ selectedChar, onSelect, onBack }: CharacterScreenProps) {
  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">👤 Personnages</h2>
        <div />
      </div>

      <div style={{ padding:'0 20px 10px', color:'rgba(255,255,255,0.4)', fontSize:12 }}>
        {CHARACTERS.length} personnages · chaque personnage a une compétence unique
      </div>

      <div className="char-grid">
        {CHARACTERS.map((char) => {
          const isSelected = char.id === selectedChar;
          return (
            <button
              key={char.id}
              className={`char-card ${isSelected ? 'char-card--selected' : ''}`}
              onClick={() => onSelect(char.id)}
              style={{ borderColor: isSelected ? char.color : 'rgba(255,255,255,0.1)' }}
            >
              {/* Mini avatar */}
              <div className="cc-avatar-wrap">
                <div className="cc-helmet" style={{ background: char.helmetColor }} />
                <div className="cc-head"   style={{ background: '#f5c878' }} />
                <div className="cc-body"   style={{ background: char.color }} />
                <div style={{ display:'flex', gap:2, marginTop:1 }}>
                  <div style={{ width:11,height:18,background:char.helmetColor,borderRadius:2 }} />
                  <div style={{ width:11,height:18,background:char.helmetColor,borderRadius:2 }} />
                </div>
              </div>

              <div className="cc-name" style={{ color: isSelected ? char.color : '#fff' }}>
                {char.name}
              </div>
              <div className="cc-gender">{char.gender === 'boy' ? '♂ Garçon' : '♀ Fille'}</div>

              {/* Skill badge */}
              <div style={{
                background: char.skillType === 'active' ? 'rgba(255,140,0,0.15)' : 'rgba(100,180,255,0.12)',
                border: `1px solid ${char.skillType === 'active' ? 'rgba(255,140,0,0.4)' : 'rgba(100,180,255,0.3)'}`,
                borderRadius:6, padding:'3px 7px', fontSize:10, fontWeight:700,
                color: char.skillType === 'active' ? '#ffaa00' : '#88ccff',
                marginTop:2,
              }}>
                {char.skillType === 'active' ? '⚡ ACTIVE' : '🛡 PASSIVE'} — {char.skillName}
              </div>
              <div className="cc-bonus">{char.bonus}</div>

              {isSelected && (
                <div className="cc-selected-badge" style={{ background: char.color }}>
                  ✓ Sélectionné
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
