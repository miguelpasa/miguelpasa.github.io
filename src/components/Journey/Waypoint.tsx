import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../lib/gsap';
import { WaypointSpec } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import { PillButton } from '../PillButton';
import { resume } from '../../content/resume';
import './Waypoint.css';

type Props = {
  spec: WaypointSpec;
};

export function Waypoint({ spec }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [activeBullets, setActiveBullets] = useState(0);
  const [contentOpacity, setContentOpacity] = useState(reduced ? 1 : 0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    const bulletsCount = spec.bullets?.length ?? 0;

    // Overlap fade: content reaches full opacity by 30% in, holds until 70%,
    // then fades. Adjacent sections' fades overlap so transitions feel
    // continuous — no dead-air "extra scroll" between sections.
    const tween = gsap.to(
      {},
      {
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.4,
          onUpdate: (self) => {
            const p = self.progress;
            const fadeIn = Math.min(1, Math.max(0, (p - 0.15) / 0.2));
            const fadeOut = Math.min(1, Math.max(0, (0.85 - p) / 0.2));
            setContentOpacity(Math.min(fadeIn, fadeOut));

            if (bulletsCount > 0) {
              // Bullets reveal across the middle 50% of the section
              const revealStart = 0.3;
              const revealEnd = 0.8;
              const local =
                p <= revealStart
                  ? 0
                  : p >= revealEnd
                    ? 1
                    : (p - revealStart) / (revealEnd - revealStart);
              const revealed = Math.floor(local * (bulletsCount + 1));
              setActiveBullets(Math.min(bulletsCount, revealed));
            }
          },
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced, spec.vh, spec.bullets]);

  const visibleBullets = reduced ? spec.bullets?.length ?? 0 : activeBullets;

  return (
    <section
      ref={sectionRef}
      className={`wp wp--${spec.side}`}
      data-id={spec.id}
      style={{ minHeight: `${Math.max(spec.vh, 1) * 100}vh` }}
      id={spec.id}
    >
      <div className="wp__sticky">
        <div className="wp__content" style={{ opacity: contentOpacity }}>
          {spec.kind && <p className="wp__kind">{spec.kind}</p>}
          {spec.eyebrow && <p className="wp__eyebrow">{spec.eyebrow}</p>}
          <h2 className="wp__headline">{spec.headline}</h2>
          {spec.sub && <p className="wp__sub">{spec.sub}</p>}
          {spec.bullets && spec.bullets.length > 0 && (
            <ul className="wp__bullets">
              {spec.bullets.map((b, i) => (
                <li
                  key={i}
                  className={`wp__bullet ${i < visibleBullets ? 'is-active' : ''} ${
                    i < visibleBullets - 1 ? 'is-prev' : ''
                  }`}
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
          {spec.id === 'hero' && (
            <div className="wp__cta">
              <PillButton href="#hello">Begin</PillButton>
            </div>
          )}
          {spec.id === 'contact' && (
            <div className="wp__cta-row">
              <PillButton href={`mailto:${resume.email}`}>Email</PillButton>
              <PillButton
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </PillButton>
              <PillButton
                href="https://github.com/miguelpasa"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </PillButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
