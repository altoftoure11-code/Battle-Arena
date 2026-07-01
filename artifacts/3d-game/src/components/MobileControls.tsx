import { useEffect, useRef, useState } from "react";
import { loadLayout, type ButtonLayout } from "@/screens/SettingsScreen";

export interface GameInputRef {
  move: { x: number; y: number };
  lookDelta: { x: number; y: number };
  shoot: boolean;
  jump: boolean;
}

export function createInputRef(): GameInputRef {
  return { move: { x: 0, y: 0 }, lookDelta: { x: 0, y: 0 }, shoot: false, jump: false };
}

interface MobileControlsProps {
  inputRef: React.MutableRefObject<GameInputRef>;
}

export function MobileControls({ inputRef }: MobileControlsProps) {
  const [isTouchDevice,  setIsTouchDevice]  = useState(false);
  const [joystickPos,    setJoystickPos]    = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);
  const [shootPressed,   setShootPressed]   = useState(false);
  const [jumpPressed,    setJumpPressed]    = useState(false);
  const [layout,         setLayout]         = useState<ButtonLayout>(loadLayout);

  const joystickOrigin  = useRef({ x: 0, y: 0 });
  const joystickTouchId = useRef<number | null>(null);
  const lookTouchId     = useRef<number | null>(null);
  const lastLookPos     = useRef({ x: 0, y: 0 });
  const mouseDragRef    = useRef(false);
  const lastMousePos    = useRef({ x: 0, y: 0 });

  // Reload layout when screen is focused (after returning from settings)
  useEffect(() => {
    const onFocus = () => setLayout(loadLayout());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    if (!isTouchDevice) return;
    const JOYSTICK_MAX     = 52;
    const LEFT_THRESHOLD   = window.innerWidth * 0.45;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.clientX < LEFT_THRESHOLD && joystickTouchId.current === null) {
          joystickTouchId.current = t.identifier;
          joystickOrigin.current  = { x: t.clientX, y: t.clientY };
          setJoystickActive(true);
        } else if (t.clientX >= LEFT_THRESHOLD && lookTouchId.current === null) {
          lookTouchId.current   = t.identifier;
          lastLookPos.current   = { x: t.clientX, y: t.clientY };
        }
      }
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joystickTouchId.current) {
          const dx    = t.clientX - joystickOrigin.current.x;
          const dy    = t.clientY - joystickOrigin.current.y;
          const dist  = Math.sqrt(dx*dx + dy*dy) || 1;
          const clamp = Math.min(dist, JOYSTICK_MAX);
          const nx    = (dx/dist)*clamp;
          const ny    = (dy/dist)*clamp;
          setJoystickPos({ x: nx, y: ny });
          inputRef.current.move.x =  nx / JOYSTICK_MAX;
          inputRef.current.move.y =  ny / JOYSTICK_MAX;
        }
        if (t.identifier === lookTouchId.current) {
          inputRef.current.lookDelta.x += t.clientX - lastLookPos.current.x;
          inputRef.current.lookDelta.y += t.clientY - lastLookPos.current.y;
          lastLookPos.current = { x: t.clientX, y: t.clientY };
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joystickTouchId.current) {
          joystickTouchId.current  = null;
          setJoystickActive(false);
          setJoystickPos({ x: 0, y: 0 });
          inputRef.current.move.x = 0;
          inputRef.current.move.y = 0;
        }
        if (t.identifier === lookTouchId.current) lookTouchId.current = null;
      }
    };

    document.addEventListener('touchstart',  onStart,  { passive: false });
    document.addEventListener('touchmove',   onMove,   { passive: false });
    document.addEventListener('touchend',    onEnd,    { passive: false });
    document.addEventListener('touchcancel', onEnd,    { passive: false });
    return () => {
      document.removeEventListener('touchstart',  onStart);
      document.removeEventListener('touchmove',   onMove);
      document.removeEventListener('touchend',    onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [isTouchDevice, inputRef]);

  useEffect(() => {
    if (isTouchDevice) return;
    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        mouseDragRef.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!mouseDragRef.current) return;
      inputRef.current.lookDelta.x += e.clientX - lastMousePos.current.x;
      inputRef.current.lookDelta.y += e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { mouseDragRef.current = false; };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, [isTouchDevice, inputRef]);

  const BASE_R = 58;
  const KNOB_R = 26;

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:20, userSelect:'none', WebkitUserSelect:'none' }}>
      {/* Joystick */}
      <div style={{
        position:'absolute',
        left:   layout.joystickLeft,
        bottom: layout.joystickBottom,
        width:  BASE_R*2, height: BASE_R*2, borderRadius:'50%',
        background:'rgba(255,255,255,0.07)', border:'2px solid rgba(255,255,255,0.2)',
        pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          position:'absolute',
          width:  KNOB_R*2, height: KNOB_R*2, borderRadius:'50%',
          background: joystickActive ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.15)',
          border:'2px solid rgba(255,255,255,0.55)',
          transform:`translate(${joystickPos.x}px, ${joystickPos.y}px)`,
          transition: joystickActive ? 'none' : 'transform 0.12s ease',
        }} />
        {['↑','↓','←','→'].map((arr, i) => {
          const offsets = [
            { top:4,  left:'50%', transform:'translateX(-50%)' },
            { bottom:4, left:'50%', transform:'translateX(-50%)' },
            { left:4, top:'50%',  transform:'translateY(-50%)' },
            { right:4, top:'50%', transform:'translateY(-50%)' },
          ] as React.CSSProperties[];
          return (
            <span key={i} style={{ position:'absolute', fontSize:11, color:'rgba(255,255,255,0.3)', ...offsets[i] }}>
              {arr}
            </span>
          );
        })}
      </div>

      {/* Right buttons */}
      <div style={{ position:'absolute', right:0, bottom:0, pointerEvents:'all' }}>
        {/* TIRER */}
        <button
          onPointerDown={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); inputRef.current.shoot = true; setShootPressed(true); }}
          onPointerUp={() => { inputRef.current.shoot = false; setShootPressed(false); }}
          onPointerLeave={() => { inputRef.current.shoot = false; setShootPressed(false); }}
          style={{
            position:'absolute',
            right:   layout.fireRight,
            bottom:  layout.fireBottom,
            width:76, height:76, borderRadius:'50%',
            background: shootPressed ? 'rgba(255,40,40,0.95)' : 'rgba(200,30,30,0.75)',
            border:'3px solid rgba(255,120,120,0.7)',
            color:'#fff', fontSize:13, fontWeight:900, letterSpacing:'0.05em',
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
            boxShadow: shootPressed ? '0 0 22px rgba(255,40,40,0.85)' : '0 4px 16px rgba(0,0,0,0.45)',
            transform: shootPressed ? 'scale(0.9)' : 'scale(1)',
            transition:'transform 0.07s, box-shadow 0.07s, background 0.07s',
            WebkitTapHighlightColor:'transparent', outline:'none', touchAction:'none',
          }}
        >
          <span style={{ fontSize:22 }}>🔥</span>TIRER
        </button>

        {/* SAUTER */}
        <button
          onPointerDown={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            inputRef.current.jump = true;
            setJumpPressed(true);
            setTimeout(() => { inputRef.current.jump = false; }, 80);
          }}
          onPointerUp={() => setJumpPressed(false)}
          style={{
            position:'absolute',
            right:   layout.jumpRight,
            bottom:  layout.jumpBottom,
            width:62, height:62, borderRadius:'50%',
            background: jumpPressed ? 'rgba(50,160,255,0.95)' : 'rgba(30,110,220,0.7)',
            border:'3px solid rgba(120,180,255,0.7)',
            color:'#fff', fontSize:12, fontWeight:900,
            cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
            boxShadow: jumpPressed ? '0 0 18px rgba(50,160,255,0.8)' : '0 4px 14px rgba(0,0,0,0.4)',
            transform: jumpPressed ? 'scale(0.9)' : 'scale(1)',
            transition:'transform 0.07s, box-shadow 0.07s, background 0.07s',
            WebkitTapHighlightColor:'transparent', outline:'none', touchAction:'none',
          }}
        >
          <span style={{ fontSize:18 }}>⬆</span>SAUTER
        </button>
      </div>

      {/* Hint */}
      {isTouchDevice && (
        <div style={{
          position:'absolute', right:110, bottom:100,
          fontSize:10, color:'rgba(255,255,255,0.28)', fontWeight:600,
          letterSpacing:'0.06em', pointerEvents:'none', textAlign:'center',
        }}>
          GLISSER<br/>POUR VISER
        </div>
      )}
    </div>
  );
}
