import { useEffect, useRef, useState } from 'react';

export interface ViewMenuItem {
  id: string;
  label: string;
  description: string;
  href: string;
}

/**
 * View switcher next to the logo, styled like the "Product ⌄" menus on fireworks.ai.
 * Closes on selection, outside click or Esc.
 */
export function ViewMenu({ items, current }: { items: ViewMenuItem[]; current: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const active = items.find((i) => i.id === current) ?? items[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <nav className="viewmenu" ref={root} aria-label="Dashboard views">
      <button
        type="button"
        className="viewmenu__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {active.label}
        <span className="viewmenu__chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="viewmenu__list">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className={`viewmenu__item${item.id === current ? ' is-active' : ''}`}
                aria-current={item.id === current ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="viewmenu__label">{item.label}</span>
                <span className="viewmenu__desc">{item.description}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
