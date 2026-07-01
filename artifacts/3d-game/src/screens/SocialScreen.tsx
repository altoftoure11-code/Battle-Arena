import { useState } from "react";
import type { UserAccount } from "./LoginScreen";

interface SocialScreenProps {
  user: UserAccount;
  onBack: () => void;
}

function getLocalLeaderboard(): { rank:number; name:string; kills:number; wins:number; kd:string }[] {
  try {
    const raw = localStorage.getItem("zg_leaderboard");
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return [
    { rank:1,  name:"ShadowStrike",  kills:2840, wins:412, kd:"5.8" },
    { rank:2,  name:"NightCrawler",  kills:2210, wins:388, kd:"4.9" },
    { rank:3,  name:"PhantomElite",  kills:1990, wins:310, kd:"4.5" },
    { rank:4,  name:"BlazeRunner",   kills:1770, wins:278, kd:"4.1" },
    { rank:5,  name:"IronFist_99",   kills:1550, wins:241, kd:"3.8" },
    { rank:6,  name:"StormBreaker",  kills:1330, wins:199, kd:"3.2" },
    { rank:7,  name:"CyberGhost",    kills:1100, wins:167, kd:"2.9" },
    { rank:8,  name:"VoidWalker",    kills:930,  wins:142, kd:"2.5" },
    { rank:9,  name:"NeonBlade",     kills:760,  wins:118, kd:"2.1" },
    { rank:10, name:"ThunderBolt",   kills:590,  wins:94,  kd:"1.8" },
  ];
}

type Tab = "leaderboard" | "clan" | "friends";

export function SocialScreen({ user, onBack }: SocialScreenProps) {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [clanName, setClanName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [clanMsg, setClanMsg] = useState("");
  const lb = getLocalLeaderboard();

  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">🌐 Social</h2>
        <div />
      </div>

      {/* Tabs */}
      <div className="social-tabs">
        {(["leaderboard", "clan", "friends"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`social-tab ${tab === t ? "social-tab--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "leaderboard" ? "🏆 Classement" : t === "clan" ? "🛡 Clan" : "👥 Amis"}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div className="social-content">
          <div className="lb-header">
            <span>#</span><span>Joueur</span><span>Kills</span><span>Victoires</span><span>K/D</span>
          </div>
          {lb.map((row) => (
            <div key={row.rank} className={`lb-row ${row.name === user.username ? "lb-row--me" : ""}`}>
              <span className={`lb-rank ${row.rank <= 3 ? "lb-rank--top" : ""}`}>
                {row.rank <= 3 ? ["🥇","🥈","🥉"][row.rank-1] : row.rank}
              </span>
              <span className="lb-name">{row.name}</span>
              <span className="lb-val">{row.kills}</span>
              <span className="lb-val">{row.wins}</span>
              <span className="lb-kd">{row.kd}</span>
            </div>
          ))}
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:"0.7rem", padding:"12px" }}>
            Classement local — Le vrai classement mondial nécessite la connexion serveur
          </div>
        </div>
      )}

      {/* Clan */}
      {tab === "clan" && (
        <div className="social-content" style={{ maxWidth: 460, margin: "0 auto" }}>
          <div className="clan-box">
            <div className="clan-box-title">🛡 Créer / Rejoindre un Clan</div>
            <div className="login-field">
              <span className="lf-icon">🏷</span>
              <input className="lf-input" placeholder="Nom du clan" value={clanName} onChange={e => setClanName(e.target.value)} />
            </div>
            <div className="login-field">
              <span className="lf-icon">#</span>
              <input className="lf-input" placeholder="Tag [3 lettres]" maxLength={3} value={clanTag} onChange={e => setClanTag(e.target.value.toUpperCase())} />
            </div>
            <button className="login-submit" onClick={() => setClanMsg(`Clan [${clanTag}] ${clanName} créé ! Invite tes amis.`)}>
              Créer le Clan
            </button>
            {clanMsg && <div style={{ color:"#44ff88", textAlign:"center", fontSize:"0.85rem", padding:"8px" }}>{clanMsg}</div>}
          </div>

          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:16 }}>
            Chat de clan, boutique et grades — disponibles avec connexion multijoueur
          </div>
        </div>
      )}

      {/* Friends */}
      {tab === "friends" && (
        <div className="social-content" style={{ maxWidth:460, margin:"0 auto" }}>
          <div className="clan-box">
            <div className="clan-box-title">👥 Mes Amis</div>
            {[
              { name:"GhostSniper", status:"En jeu", level:28 },
              { name:"RushHour99",  status:"En ligne", level:15 },
              { name:"ArcadeKing",  status:"Hors ligne", level:42 },
            ].map((f) => (
              <div key={f.name} className="friend-row">
                <div className={`friend-dot ${f.status === "En jeu" ? "dot-game" : f.status === "En ligne" ? "dot-online" : "dot-offline"}`} />
                <div className="friend-info">
                  <div className="friend-name">{f.name}</div>
                  <div className="friend-status">{f.status} · Niv.{f.level}</div>
                </div>
                {f.status !== "Hors ligne" && (
                  <button className="friend-invite-btn">Inviter</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:"0.72rem", marginTop:16 }}>
            Amis réels et invitations — disponibles avec Socket.io multijoueur
          </div>
        </div>
      )}
    </div>
  );
}
