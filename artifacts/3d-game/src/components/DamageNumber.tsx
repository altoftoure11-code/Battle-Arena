import { useEffect, useRef, useState } from "react";

export interface DmgEntry {
  id: number;
  x: number;
  y: number;
  value: number;
  headshot?: boolean;
}

interface DamageNumbersProps {
  entries: DmgEntry[];
  onExpire: (id: number) => void;
}

export function DamageNumbers({ entries, onExpire }: DamageNumbersProps) {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50 }}>
      {entries.map((e) => (
        <DmgEntry key={e.id} entry={e} onExpire={onExpire} />
      ))}
    </div>
  );
}

function DmgEntry({ entry, onExpire }: { entry: DmgEntry; onExpire:(id:number)=>void }) {
  const [pos, setPos] = useState({ x: entry.x, y: entry.y, opacity: 1 });
  const frameRef = useRef<number>(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    const animate = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      if (elapsed > 1.2) { onExpire(entry.id); return; }
      setPos({
        x: entry.x + Math.sin(elapsed * 3) * 8,
        y: entry.y - elapsed * 60,
        opacity: Math.max(0, 1 - elapsed / 1.2),
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x, top: pos.y,
        transform: "translateX(-50%)",
        opacity: pos.opacity,
        fontSize: entry.headshot ? 24 : 18,
        fontWeight: 900,
        color: entry.headshot ? "#ff2222" : "#ffffff",
        textShadow: entry.headshot
          ? "0 0 8px #ff0000, 2px 2px 0 #000"
          : "1px 1px 0 #000, -1px -1px 0 #000",
        letterSpacing: entry.headshot ? "0.08em" : "0.02em",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {entry.headshot ? `${entry.value} HEADSHOT` : entry.value}
    </div>
  );
}
