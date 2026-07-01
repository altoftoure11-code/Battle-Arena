import { useState } from "react";

export interface UserAccount {
  username: string;
  password: string;
  gold: number;
  diamonds: number;
  level: number;
  selectedChar: number;
  ownedWeapons: number[];
  ownedCosmetics: string[];
}

const DB_KEY = "zg_accounts_v2";
const ACTIVE  = "zg_active_user";

function loadAccounts(): Record<string, UserAccount> {
  try { return JSON.parse(localStorage.getItem(DB_KEY) ?? "{}"); } catch { return {}; }
}
function saveAccounts(a: Record<string, UserAccount>) {
  localStorage.setItem(DB_KEY, JSON.stringify(a));
}
export function saveActiveUser(u: UserAccount) {
  localStorage.setItem(ACTIVE, JSON.stringify(u));
}
export function loadActiveUser(): UserAccount | null {
  try { const s = localStorage.getItem(ACTIVE); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function persistUserUpdate(u: UserAccount) {
  const accounts = loadAccounts();
  accounts[u.username] = u;
  saveAccounts(accounts);
  saveActiveUser(u);
}

interface LoginScreenProps {
  onLogin: (user: UserAccount) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [tab,       setTab]       = useState<"login"|"register">("login");
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [email,     setEmail]     = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");

  const handleLogin = () => {
    setError("");
    if (!username.trim() || !password.trim()) { setError("Remplis tous les champs."); return; }
    const accounts = loadAccounts();
    const user = accounts[username.toLowerCase()];
    if (!user) { setError("Compte introuvable."); return; }
    if (user.password !== password) { setError("Mot de passe incorrect."); return; }
    saveActiveUser(user);
    onLogin(user);
  };

  const handleRegister = () => {
    setError("");
    if (!username.trim() || !password.trim()) { setError("Remplis tous les champs."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (username.length < 3) { setError("Pseudo trop court (min 3 caractères)."); return; }
    const accounts = loadAccounts();
    if (accounts[username.toLowerCase()]) { setError("Ce pseudo est déjà pris."); return; }
    const newUser: UserAccount = {
      username: username.trim(),
      password,
      gold: 200, diamonds: 50,
      level: 1,
      selectedChar: 0,
      ownedWeapons: [0],
      ownedCosmetics: ["top-0","pants-0","ws-0"],
    };
    accounts[username.toLowerCase()] = newUser;
    saveAccounts(accounts);
    saveActiveUser(newUser);
    onLogin(newUser);
  };

  const handleGuest = () => {
    const guestName = `Invité_${Math.floor(Math.random()*9000)+1000}`;
    const guest: UserAccount = {
      username: guestName, password: "", gold: 100, diamonds: 20, level: 1,
      selectedChar: 0, ownedWeapons: [0], ownedCosmetics: ["top-0","pants-0","ws-0"],
    };
    onLogin(guest);
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") tab==="login" ? handleLogin() : handleRegister(); };

  return (
    <div className="login-screen">
      <div className="login-bg" />
      <div className="login-particles">
        {Array.from({length:12},(_,i) => (
          <div key={i} className="login-particle" style={{ left:`${(i*8+5)%100}%`, animationDelay:`${i*0.4}s`, width:i%3===0?6:4, height:i%3===0?6:4 }} />
        ))}
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">ZONE DE COMBAT</div>
          <div className="login-logo-sub">FREE FIRE · BATTLE ROYALE</div>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab==="login"?"login-tab--active":""}`}    onClick={() => { setTab("login");    setError(""); }}>CONNEXION</button>
          <button className={`login-tab ${tab==="register"?"login-tab--active":""}`} onClick={() => { setTab("register"); setError(""); }}>INSCRIPTION</button>
        </div>

        <div className="login-form" onKeyDown={onKey}>
          <div className="login-field">
            <span className="lf-icon">👤</span>
            <input className="lf-input" placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          {tab==="register" && (
            <div className="login-field">
              <span className="lf-icon">✉️</span>
              <input className="lf-input" placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          )}
          <div className="login-field">
            <span className="lf-icon">🔒</span>
            <input className="lf-input" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" />
          </div>
          {tab==="register" && (
            <div className="login-field">
              <span className="lf-icon">🔑</span>
              <input className="lf-input" placeholder="Confirmer le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" />
            </div>
          )}

          {error && <div className="login-error">⚠️ {error}</div>}

          <button className="login-submit" onClick={tab==="login" ? handleLogin : handleRegister}>
            {tab==="login" ? "SE CONNECTER" : "CRÉER MON COMPTE"}
          </button>

          <div className="login-divider"><span>OU</span></div>

          <button className="login-guest" onClick={handleGuest}>
            Jouer en tant qu'invité
          </button>
        </div>

        <div className="login-footer">
          Tes données sont sauvegardées localement · 18 armes · 12 personnages
        </div>
      </div>
    </div>
  );
}
