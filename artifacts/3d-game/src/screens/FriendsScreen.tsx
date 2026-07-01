import { useState } from "react";

const SIMULATED_FRIENDS = [
  { name: "Raphael_FR", level: 12, online: true,  kills: 847 },
  { name: "ShadowWolf",  level: 8,  online: true,  kills: 512 },
  { name: "FireQueen",   level: 21, online: false, kills: 1203 },
  { name: "BladeRunner", level: 5,  online: true,  kills: 230 },
  { name: "NovaStrike",  level: 17, online: false, kills: 990 },
];

interface FriendsScreenProps {
  onBack: () => void;
}

export function FriendsScreen({ onBack }: FriendsScreenProps) {
  const [friends, setFriends] = useState(SIMULATED_FRIENDS);
  const [inputName, setInputName] = useState("");
  const [addMsg, setAddMsg] = useState("");

  const handleAdd = () => {
    if (!inputName.trim()) return;
    setFriends((prev) => [
      { name: inputName.trim(), level: 1, online: true, kills: 0 },
      ...prev,
    ]);
    setAddMsg(`${inputName.trim()} a été ajouté !`);
    setInputName("");
    setTimeout(() => setAddMsg(""), 2500);
  };

  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">Amis ({friends.filter((f) => f.online).length} en ligne)</h2>
        <div />
      </div>

      {/* Add friend */}
      <div className="add-friend-bar">
        <input
          className="add-friend-input"
          placeholder="Pseudo d'un ami..."
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="add-friend-btn" onClick={handleAdd}>+ Ajouter</button>
      </div>
      {addMsg && <div className="add-msg">✓ {addMsg}</div>}

      <div className="friends-list">
        {friends.map((f, i) => (
          <div key={i} className="friend-row">
            <div className="friend-avatar" style={{ background: f.online ? "#22aa55" : "#555" }}>
              {f.name[0]}
            </div>
            <div className="friend-info">
              <div className="friend-name">{f.name}</div>
              <div className="friend-meta">
                Niv. {f.level} · {f.kills} kills ·{" "}
                <span style={{ color: f.online ? "#44ff88" : "#888" }}>
                  {f.online ? "● En ligne" : "○ Hors ligne"}
                </span>
              </div>
            </div>
            {f.online && (
              <button className="invite-btn">Inviter</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
