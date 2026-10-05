import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  stack = false,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  /** Single column (tables, summaries) instead of the two-up chart grid. */
  stack?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <header className="section__head">
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={`${id}-title`} className="section__title">{title}</h2>
      </header>
      <div className={`section__grid${stack ? ' section__grid--stack' : ''}`}>{children}</div>
    </section>
  );
}
