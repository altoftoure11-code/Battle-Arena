import { useState, useCallback, useEffect } from "react";
import { LoginScreen, loadActiveUser, persistUserUpdate, type UserAccount } from "@/screens/LoginScreen";
import { LobbyScreen }     from "@/screens/LobbyScreen";
import { CharacterScreen } from "@/screens/CharacterScreen";
import { ShopScreen }      from "@/screens/ShopScreen";
import { FriendsScreen }   from "@/screens/FriendsScreen";
import { ModeScreen }      from "@/screens/ModeScreen";
import { WardrobeScreen }  from "@/screens/WardrobeScreen";
import { SettingsScreen }  from "@/screens/SettingsScreen";
import Game                from "@/components/Game";
import {
  CHARACTERS, WEAPONS, COSMETICS, DEFAULT_OUTFIT,
  type GameMode, type Outfit, type CosmeticCategory,
} from "@/gameData";
import "./index.css";

type Screen = "login"|"lobby"|"characters"|"shop"|"friends"|"modes"|"wardrobe"|"settings"|"game";

export default function App() {
  const [user,    setUser]    = useState<UserAccount|null>(null);
  const [screen,  setScreen]  = useState<Screen>("login");
  const [outfit,  setOutfit]  = useState<Outfit>(DEFAULT_OUTFIT);

  // Restore session
  useEffect(() => {
    const saved = loadActiveUser();
    if (saved) { setUser(saved); setScreen("lobby"); setOutfit({ topId:saved.ownedCosmetics[0]??"top-0", pantsId:"pants-0", weaponSkinId:"ws-0" }); }
  }, []);

  const handleLogin = useCallback((u: UserAccount) => {
    setUser(u);
    setScreen("lobby");
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("zg_active_user");
    setUser(null);
    setScreen("login");
  }, []);

  const updateUser = useCallback((updates: Partial<UserAccount>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      persistUserUpdate(next);
      return next;
    });
  }, []);

  const handleBuyWeapon = useCallback((weaponId: number) => {
    if (!user) return;
    const w = WEAPONS[weaponId];
    if (user.gold < w.price) return;
    updateUser({ gold: user.gold - w.price, ownedWeapons: [...user.ownedWeapons, weaponId] });
  }, [user, updateUser]);

  const handleSelectWeapon = useCallback((weaponId: number) => {
    if (!user) return;
    updateUser({ ownedWeapons: [weaponId, ...user.ownedWeapons.filter((id) => id !== weaponId)] });
  }, [user, updateUser]);

  const handleBuyCosmetic = useCallback((id: string, price: number) => {
    if (!user || user.gold < price) return;
    const item = COSMETICS.find((c) => c.id === id);
    if (!item) return;
    const newOutfit = {
      ...outfit,
      topId:        item.category==="top"         ? id : outfit.topId,
      pantsId:      item.category==="pants"       ? id : outfit.pantsId,
      weaponSkinId: item.category==="weapon-skin" ? id : outfit.weaponSkinId,
    };
    setOutfit(newOutfit);
    updateUser({ gold: user.gold - price, ownedCosmetics: [...user.ownedCosmetics, id] });
  }, [user, outfit, updateUser]);

  const handleEquipCosmetic = useCallback((id: string, category: CosmeticCategory) => {
    setOutfit((prev) => ({
      ...prev,
      topId:        category==="top"         ? id : prev.topId,
      pantsId:      category==="pants"       ? id : prev.pantsId,
      weaponSkinId: category==="weapon-skin" ? id : prev.weaponSkinId,
    }));
  }, []);

  const handleGameEnd = useCallback((result:"win"|"lose", kills:number, earnedGold:number, earnedDia:number) => {
    if (!user) return;
    const levelUp = result==="win" && (user.level % 5 === 0 ? false : true);
    updateUser({
      gold:     user.gold + earnedGold,
      diamonds: (user.diamonds ?? 0) + earnedDia,
      level:    result==="win" ? user.level+1 : user.level,
    });
    setScreen("lobby");
  }, [user, updateUser]);

  // Build loadout from owned weapons (up to 4 slots)
  const loadout: (number|null)[] = user
    ? [user.ownedWeapons[0]??null, user.ownedWeapons[1]??null, user.ownedWeapons[2]??null, user.ownedWeapons[3]??null]
    : [0, null, null, null];

  if (!user || screen==="login") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen==="game") {
    return (
      <Game
        character={CHARACTERS[user.selectedChar]}
        loadout={loadout}
        gameMode={(user as any).gameMode ?? "quick"}
        level={user.level}
        gold={user.gold}
        diamonds={user.diamonds ?? 0}
        outfit={outfit}
        onGameEnd={handleGameEnd}
      />
    );
  }

  const nav = (s: string) => setScreen(s as Screen);
  const selectedWeapon = user.ownedWeapons[0] ?? 0;
  const gameMode: GameMode = (user as any).gameMode ?? "quick";

  return (
    <div style={{ width:"100vw",height:"100vh",overflow:"hidden" }}>
      {screen==="lobby" && (
        <LobbyScreen
          gold={user.gold} diamonds={user.diamonds??0} level={user.level}
          username={user.username}
          selectedChar={user.selectedChar} selectedWeapon={selectedWeapon}
          gameMode={gameMode} ownedWeapons={user.ownedWeapons}
          onNavigate={nav} onStart={()=>setScreen("game")} onLogout={handleLogout}
        />
      )}
      {screen==="characters" && (
        <CharacterScreen
          selectedChar={user.selectedChar}
          onSelect={(id)=>{ updateUser({selectedChar:id}); nav("lobby"); }}
          onBack={()=>nav("lobby")}
        />
      )}
      {screen==="shop" && (
        <ShopScreen
          gold={user.gold} ownedWeapons={user.ownedWeapons} selectedWeapon={selectedWeapon}
          onBuy={handleBuyWeapon} onSelect={handleSelectWeapon}
          onBack={()=>nav("lobby")}
        />
      )}
      {screen==="friends"  && <FriendsScreen  onBack={()=>nav("lobby")} />}
      {screen==="modes"    && (
        <ModeScreen
          selected={gameMode}
          onSelect={(m)=>{ updateUser({...(user as any), gameMode:m} as any); nav("lobby"); }}
          onBack={()=>nav("lobby")}
        />
      )}
      {screen==="wardrobe" && (
        <WardrobeScreen
          gold={user.gold} selectedChar={user.selectedChar} outfit={outfit}
          ownedCosmetics={user.ownedCosmetics}
          onBuy={handleBuyCosmetic} onEquip={handleEquipCosmetic}
          onBack={()=>nav("lobby")}
        />
      )}
      {screen==="settings" && <SettingsScreen onBack={()=>nav("lobby")} />}
    </div>
  );
}
