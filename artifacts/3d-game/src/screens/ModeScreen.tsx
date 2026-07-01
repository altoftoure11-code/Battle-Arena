import { MODES, type GameMode } from "@/gameData";

interface ModeScreenProps {
  selected: GameMode;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export function ModeScreen({ selected, onSelect, onBack }: ModeScreenProps) {
  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">Choisir le mode</h2>
        <div />
      </div>

      <div className="mode-grid">
        {MODES.map((m) => {
          const isSelected = selected === m.id;
          return (
            <button
              key={m.id}
              className={`mode-select-card ${isSelected ? "mode-select-card--active" : ""}`}
              style={{ borderColor: isSelected ? m.color : "rgba(255,255,255,0.1)" }}
              onClick={() => onSelect(m.id)}
            >
              <div style={{ fontSize: 42, marginBottom: 8 }}>{m.icon}</div>
              <div className="msc-name" style={{ color: isSelected ? m.color : "#fff" }}>
                {m.name}
              </div>
              <div className="msc-desc">{m.description}</div>
              <div className="msc-enemies">👾 {m.enemyCount} ennemis</div>
              {isSelected && (
                <div className="msc-badge" style={{ background: m.color }}>✓ Sélectionné</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
