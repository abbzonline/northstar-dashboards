/** Five square pips, partially filled for fractional scores (e.g. 4.2). Echoes the pixel squares on fireworks.ai. */
export function Pips({ score, small }: { score: number; small?: boolean }) {
  return (
    <span className={`pips${small ? ' pips--small' : ''}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, score - i));
        return <span key={i} className="pip" style={{ ['--fill' as string]: `${fill * 100}%` }} />;
      })}
    </span>
  );
}
