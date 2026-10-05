import type { ReactNode } from 'react';

export function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <header className="section__head">
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={`${id}-title`} className="section__title">{title}</h2>
      </header>
      <div className="section__grid">{children}</div>
    </section>
  );
}
