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

/**
 * One waypoint section. Total height = (travelVh + holdVh) * 100vh.
 * Inside, content is sticky-centered so it stays in the viewport while the
 * user scrolls through the section. Bullets reveal one-by-one tied to the
 * local scroll progress (during the hold portion).
 */
export function Waypoint({ spec }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [activeBullets, setActiveBullets] = useState(0);
  const [contentOpacity, setContentOpacity] = useState(reduced ? 1 : 0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    const totalVh = spec.travelVh + spec.holdVh;
    const travelRatio = spec.travelVh / Math.max(totalVh, 0.0001);
    const bulletsCount = spec.bullets?.length ?? 0;

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
            // Fade in during enter, full opacity during the bulk, fade out at exit.
            const fadeIn = Math.min(1, p / 0.15);
            const fadeOut = Math.min(1, (1 - p) / 0.15);
            setContentOpacity(Math.min(fadeIn, fadeOut));

            if (bulletsCount > 0) {
              // Map progress through the section to a 0..1 "hold progress":
              // before travelRatio → 0 bullets; after travelRatio → bullets reveal
              // across the remaining range.
              const holdStart = travelRatio * 0.6; // start revealing slightly into the section
              const holdLocal =
                p <= holdStart
                  ? 0
                  : Math.min(1, (p - holdStart) / (0.95 - holdStart));
              const revealed = Math.floor(holdLocal * (bulletsCount + 1));
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
  }, [reduced, spec.travelVh, spec.holdVh, spec.bullets]);

  const totalVh = spec.travelVh + spec.holdVh;
  // For reduced motion, just show all bullets
  const visibleBullets = reduced ? spec.bullets?.length ?? 0 : activeBullets;

  return (
    <section
      ref={sectionRef}
      className={`wp wp--${spec.side}`}
      data-id={spec.id}
      style={{ minHeight: `${Math.max(totalVh, 1) * 100}vh` }}
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
