// Pure CSS overlay — no client JS needed. The gradient is applied via
// globals.css @media (pointer: coarse) rules. The div is always rendered
// (no useState flash). overflow-x:clip on <html> ensures position:fixed
// works correctly on iOS Safari without the scroll-container side-effect
// that overflow:hidden causes.
export function ThemeGradientOverlay() {
  return (
    <div
      id="theme-gradient-overlay"
      aria-hidden="true"
      className="theme-gradient-overlay pointer-events-none"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    />
  );
}
