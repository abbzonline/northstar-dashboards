/**
 * "Single page" switch next to the view menu: stacks every view on one page.
 * A link styled as a toggle, so the state lives in the URL (#/all) and survives back/forward and shared links.
 */
export function SinglePageSwitch({ on, href }: { on: boolean; href: string }) {
  return (
    <a className="switch" href={href} role="switch" aria-checked={on} aria-label="Single page">
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__text">Single page</span>
    </a>
  );
}
