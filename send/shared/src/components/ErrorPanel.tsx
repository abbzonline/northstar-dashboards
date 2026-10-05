export function ErrorPanel({ title, errors }: { title: string; errors: string[] }) {
  return (
    <div className="error-panel" role="alert">
      <h2>{title}</h2>
      <ul>
        {errors.slice(0, 20).map((e) => (
          <li key={e} className="mono">{e}</li>
        ))}
      </ul>
      {errors.length > 20 && <p>…and {errors.length - 20} more.</p>}
    </div>
  );
}
