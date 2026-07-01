import { useState, useRef, useEffect } from "react";

export interface ButtonLayout {
  fireRight:    number;  // px from right
  fireBottom:   number;  // px from bottom
  jumpRight:    number;
  jumpBottom:   number;
  joystickLeft: number;
  joystickBottom: number;
}

const DEFAULT_LAYOUT: ButtonLayout = {
  fireRight: 20, fireBottom: 90,
  jumpRight: 108, jumpBottom: 165,
  joystickLeft: 28, joystickBottom: 90,
};

const LAYOUT_KEY = 'zgame_hud_layout';

export function loadLayout(): ButtonLayout {
  try {
    const s = localStorage.getItem(LAYOUT_KEY);
    if (s) return { ...DEFAULT_LAYOUT, ...JSON.parse(s) };
  } catch { /* */ }
  return DEFAULT_LAYOUT;
}

export function saveLayout(l: ButtonLayout) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(l)); } catch { /* */ }
}

interface SettingsScreenProps {
  onBack: () => void;
}

type DragTarget = 'fire' | 'jump' | 'joy' | null;

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [layout, setLayout] = useState<ButtonLayout>(loadLayout);
  const [dragging, setDragging] = useState<DragTarget>(null);
  const [saved, setSaved] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startLayout = useRef<ButtonLayout>(layout);
  const previewRef = useRef<HTMLDivElement>(null!);

  const handlePointerDown = (target: DragTarget, e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(target);
    startPos.current     = { x: e.clientX, y: e.clientY };
    startLayout.current  = layout;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setLayout((prev) => {
        const next = { ...prev };
        if (dragging === 'fire') {
          next.fireRight  = Math.max(4, startLayout.current.fireRight  - dx);
          next.fireBottom = Math.max(4, startLayout.current.fireBottom - dy);
        } else if (dragging === 'jump') {
          next.jumpRight  = Math.max(4, startLayout.current.jumpRight  - dx);
          next.jumpBottom = Math.max(4, startLayout.current.jumpBottom - dy);
        } else if (dragging === 'joy') {
          next.joystickLeft   = Math.max(4, startLayout.current.joystickLeft   + dx);
          next.joystickBottom = Math.max(4, startLayout.current.joystickBottom - dy);
        }
        return next;
      });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  const handleSave = () => {
    saveLayout(layout);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
    saveLayout(DEFAULT_LAYOUT);
  };

  return (
    <div className="fullscreen-menu">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>← Retour</button>
        <h2 className="menu-title">⚙️ Paramètres HUD</h2>
        <div />
      </div>

      <div style={{ padding:'12px 20px', color:'rgba(255,255,255,0.5)', fontSize:13 }}>
        Glisse les boutons pour les repositionner · Confirme pour sauvegarder
      </div>

      {/* Preview area */}
      <div
        ref={previewRef}
        style={{
          flex:1, margin:'0 16px 16px', borderRadius:16,
          background:'rgba(0,100,60,0.18)', border:'1px solid rgba(255,255,255,0.08)',
          position:'relative', overflow:'hidden', touchAction:'none', cursor:'crosshair',
          minHeight:320,
        }}
      >
        {/* Map preview hint */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:13, color:'rgba(255,255,255,0.2)', textAlign:'center', pointerEvents:'none' }}>
          APERÇU JEU
        </div>

        {/* Joystick */}
        <div
          style={{
            position:'absolute', left:layout.joystickLeft, bottom:layout.joystickBottom,
            width:116, height:116, borderRadius:'50%',
            background:dragging==='joy'?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.09)',
            border:'2px solid rgba(255,255,255,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'grab', touchAction:'none',
          }}
          onPointerDown={(e) => handlePointerDown('joy', e)}
        >
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', textAlign:'center' }}>
            🕹<br />Joystick
          </div>
        </div>

        {/* Fire button */}
        <div
          style={{
            position:'absolute', right:layout.fireRight, bottom:layout.fireBottom,
            width:76, height:76, borderRadius:'50%',
            background: dragging==='fire' ? 'rgba(255,40,40,0.9)' : 'rgba(200,30,30,0.7)',
            border:'3px solid rgba(255,120,120,0.7)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            cursor:'grab', touchAction:'none', color:'#fff', fontSize:12, fontWeight:900, gap:2,
          }}
          onPointerDown={(e) => handlePointerDown('fire', e)}
        >
          🔥<br />TIRER
        </div>

        {/* Jump button */}
        <div
          style={{
            position:'absolute', right:layout.jumpRight, bottom:layout.jumpBottom,
            width:62, height:62, borderRadius:'50%',
            background: dragging==='jump' ? 'rgba(50,160,255,0.9)' : 'rgba(30,110,220,0.7)',
            border:'3px solid rgba(120,180,255,0.7)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            cursor:'grab', touchAction:'none', color:'#fff', fontSize:12, fontWeight:900, gap:2,
          }}
          onPointerDown={(e) => handlePointerDown('jump', e)}
        >
          ⬆<br />SAUTER
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display:'flex', gap:12, padding:'0 20px 24px', justifyContent:'center' }}>
        <button className="nav-btn" onClick={handleReset}>↺ Réinitialiser</button>
        <button className="start-btn" style={{ maxWidth:200, fontSize:15, padding:'12px 24px' }} onClick={handleSave}>
          {saved ? '✓ Sauvegardé !' : 'Confirmer'}
        </button>
      </div>
    </div>
  );
}
