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
 * Waypoint = (1) a tall anchor block in normal flow providing scroll height,
 * and (2) a fixed-positioned "window" panel that's always at viewport-vertical-
 * centre. Opacity is driven by section scroll progress so panels cross-fade
 * cleanly as the user moves between sections.
 */
export function Waypoint({ spec }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [activeBullets, setActiveBullets] = useState(0);
  const [opacity, setOpacity] = useState(reduced ? 1 : 0);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el || reduced) return;

    const bulletsCount = spec.bullets?.length ?? 0;

    const tween = gsap.to(
      {},
      {
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.3,
          onUpdate: (self) => {
            const p = self.progress;
            // Fade in across 0.25-0.45, hold full to 0.55, fade out 0.55-0.75.
            // Wide centre band keeps content fully visible at the anchor.
            const fadeIn = Math.min(1, Math.max(0, (p - 0.25) / 0.2));
            const fadeOut = Math.min(1, Math.max(0, (0.75 - p) / 0.2));
            setOpacity(Math.min(fadeIn, fadeOut));

            if (bulletsCount > 0) {
              const revealStart = 0.4;
              const revealEnd = 0.7;
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
      ref={anchorRef}
      className={`wp wp--${spec.side}`}
      data-id={spec.id}
      style={{ minHeight: `${Math.max(spec.vh, 1) * 100}vh` }}
      id={spec.id}
    >
      <div
        className="wp__panel"
        style={{
          opacity,
          pointerEvents: opacity > 0.5 ? 'auto' : 'none',
        }}
      >
        <span className="wp__sill" aria-hidden="true" />
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
    </section>
  );
}
