import { VEHICLES, type VehicleDef } from "@/gameData";

interface GarageScreenProps {
  gold:           number;
  diamonds:       number;
  ownedVehicles:  string[];
  activeVehicle:  string | null;
  onBuy:          (vehicleId: string) => void;
  onSelect:       (vehicleId: string) => void;
  onBack:         () => void;
}

export function GarageScreen({
  gold, diamonds, ownedVehicles, activeVehicle, onBuy, onSelect, onBack,
}: GarageScreenProps) {
  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">🚗 Garage</h2>
        <div className="menu-currencies">
          <span className="mc-gold">🪙 {gold}</span>
          <span className="mc-dia">💎 {diamonds}</span>
        </div>
      </div>

      <div style={{ padding: "12px 16px 8px", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", textAlign: "center" }}>
        Invoque ton véhicule en jeu avec la touche <strong style={{ color: "#ffd700" }}>V</strong> · Appuie sur <strong style={{ color: "#ffd700" }}>F</strong> pour monter / descendre
      </div>

      <div className="vehicle-grid">
        {VEHICLES.map((v) => {
          const owned    = ownedVehicles.includes(v.id);
          const selected = activeVehicle === v.id;
          const canAfford = v.currency === 'gold' ? gold >= v.price : diamonds >= v.price;

          return (
            <div
              key={v.id}
              className={`vehicle-card ${selected ? "vehicle-card--active" : ""}`}
              style={{ borderColor: selected ? "#ffd700" : "rgba(255,255,255,0.1)" }}
            >
              <div className="vc-icon">{v.icon}</div>
              <div className="vc-name">{v.name}</div>
              <div className="vc-desc">{v.description}</div>

              {/* Stats */}
              <div className="vc-stats">
                <div className="vc-stat">
                  <span>⚡ Vitesse</span>
                  <div className="vc-bar">
                    <div style={{ width: `${(v.speed / 20) * 100}%`, background: "#44ee88" }} />
                  </div>
                </div>
                <div className="vc-stat">
                  <span>🛡 Armure</span>
                  <div className="vc-bar">
                    <div style={{ width: `${(v.health / 500) * 100}%`, background: "#4488ff" }} />
                  </div>
                </div>
              </div>

              <div className="vc-price">
                {v.currency === 'gold' ? `🪙 ${v.price}` : `💎 ${v.price}`}
              </div>

              {owned ? (
                <button
                  className={`vc-btn ${selected ? "vc-btn--active" : ""}`}
                  onClick={() => onSelect(v.id)}
                >
                  {selected ? "✓ Sélectionné" : "Équiper"}
                </button>
              ) : (
                <button
                  className={`vc-btn ${!canAfford ? "vc-btn--locked" : ""}`}
                  onClick={() => canAfford && onBuy(v.id)}
                  disabled={!canAfford}
                >
                  {canAfford ? "Acheter" : "Fonds insuffisants"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
