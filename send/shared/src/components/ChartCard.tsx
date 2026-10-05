import type { ReactNode } from 'react';

export interface ChartCardProps {
  /** Anchor target so KPI tiles can link straight to this chart. */
  id?: string;
  title: string;
  /** One-line takeaway: the interpretation the chart is evidence for. */
  headline?: string;
  footnote?: string;
  children: ReactNode;
}

export function ChartCard({ id, title, headline, footnote, children }: ChartCardProps) {
  return (
    <figure className="card" id={id}>
      <figcaption className="card__head">
        <h3 className="card__title">{title}</h3>
        {headline && <p className="card__headline">{headline}</p>}
      </figcaption>
      <div className="card__body">{children}</div>
      {footnote && <p className="card__foot">{footnote}</p>}
    </figure>
  );
}
