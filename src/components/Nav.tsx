import { useEffect, useState } from 'react';
import './Nav.css';

const links = [
  { href: '#about', label: 'About' },
  { href: '#role-0', label: 'Experience' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export function Nav() {
  const [invert, setInvert] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Sample the element under the nav to decide light/dark
      const probe = document.elementFromPoint(window.innerWidth - 80, 30);
      if (!probe) return;
      const section = probe.closest<HTMLElement>('[data-bg]');
      const bg = section?.dataset.bg;
      setInvert(bg === 'deep');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <nav className={`nav ${invert ? 'nav--invert' : ''}`}>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
