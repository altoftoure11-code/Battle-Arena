interface SniperScopeProps {
  isZoomed: boolean;
}

export function SniperScope({ isZoomed }: SniperScopeProps) {
  if (!isZoomed) return null;
  return (
    <div className="scope-overlay">
      {/* Black bars top/bottom */}
      <div className="scope-bar scope-bar--top" />
      <div className="scope-bar scope-bar--bottom" />
      <div className="scope-bar scope-bar--left" />
      <div className="scope-bar scope-bar--right" />

      {/* Scope ring */}
      <div className="scope-circle-outer" />
      <div className="scope-circle-inner" />

      {/* Crosshair */}
      <div className="scope-cross scope-cross--h" />
      <div className="scope-cross scope-cross--v" />
      <div className="scope-cross scope-cross--h scope-cross--offset-top" />
      <div className="scope-cross scope-cross--h scope-cross--offset-bottom" />

      {/* Range markers */}
      {[100,200,300,400].map((n,i) => (
        <div key={n} className="scope-marker" style={{ left:`calc(50% + 60px)`, top:`calc(50% + ${i*14-28}px)` }}>
          <div className="scope-tick" />
          <span>{n}</span>
        </div>
      ))}
    </div>
  );
}
