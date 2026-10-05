import type { ReactNode } from 'react';

/** A page section with a single heading in the standard Fireworks title style. */
export function Section({
  id,
  title,
  stack = false,
  children,
}: {
  id: string;
  title: string;
  /** Single column (tables, summaries) instead of the two-up chart grid. */
  stack?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <header className="section__head">
        <h2 id={`${id}-title`} className="section__title">{title}</h2>
      </header>
      <div className={`section__grid${stack ? ' section__grid--stack' : ''}`}>{children}</div>
    </section>
  );
}
