import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { waypoints } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import './ClimberCanvas.css';

const LADDER_X_PCT = 50; // ladder centered horizontally
const RUNG_SPACING = 64; // px between rungs
const STEP_PERIOD = 120; // px of scroll per leg-swap cycle
const HEAD_TURN_RANGE = 0.08; // progress window around each waypoint where head turns

export function ClimberCanvas() {
  const ladderRef = useRef<HTMLDivElement>(null);
  const climberRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const leftLegRef = useRef<SVGLineElement>(null);
  const rightLegRef = useRef<SVGLineElement>(null);
  const leftArmRef = useRef<SVGLineElement>(null);
  const rightArmRef = useRef<SVGLineElement>(null);
  const reduced = usePrefersReducedMotion();

  // Pre-compute each waypoint's anchor progress (mid of its section).
  const totalVh = waypoints.reduce((s, w) => s + w.vh, 0);
  const anchorProgress: number[] = [];
  {
    let acc = 0;
    for (const w of waypoints) {
      anchorProgress.push((acc + w.vh / 2) / totalVh);
      acc += w.vh;
    }
  }

  useEffect(() => {
    const ladder = ladderRef.current;
    const head = headRef.current;
    const leftLeg = leftLegRef.current;
    const rightLeg = rightLegRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    if (!ladder || !head || !leftLeg || !rightLeg || !leftArm || !rightArm) return;

    if (reduced) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, scrollY / max));

      // Ladder rungs scroll up modulo rung spacing — gives infinite-ladder feel.
      const ladderOffset = -(scrollY % RUNG_SPACING);
      ladder.style.transform = `translate3d(-50%, ${ladderOffset}px, 0)`;

      // Climbing leg/arm cycle (sin wave: continuous, no jank).
      const phase = ((scrollY % STEP_PERIOD) / STEP_PERIOD) * Math.PI * 2;
      const swing = Math.sin(phase); // -1..1
      // Legs alternate: left leg drops as right leg lifts and vice versa.
      const legDownY = 14;
      leftLeg.setAttribute('y2', String(legDownY + swing * 5));
      rightLeg.setAttribute('y2', String(legDownY - swing * 5));
      leftLeg.setAttribute('x2', String(-9 - swing * 2));
      rightLeg.setAttribute('x2', String(9 + swing * 2));
      // Arms counter-swing.
      leftArm.setAttribute('y2', String(-44 - swing * 3));
      rightArm.setAttribute('y2', String(-44 + swing * 3));
      leftArm.setAttribute('x2', String(-12 + swing * 2));
      rightArm.setAttribute('x2', String(12 - swing * 2));

      // Head turn: when near a waypoint anchor, rotate head toward the window
      // (left/right based on side).
      let nearest = anchorProgress[0];
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < anchorProgress.length; i++) {
        const d = Math.abs(anchorProgress[i] - p);
        if (d < nearestDist) {
          nearest = anchorProgress[i];
          nearestIdx = i;
          nearestDist = d;
        }
      }
      const wp = waypoints[nearestIdx];
      let focus = 0; // 0 when far, 1 when on anchor
      if (nearestDist < HEAD_TURN_RANGE) {
        focus = 1 - nearestDist / HEAD_TURN_RANGE;
      }
      // Window 'left' is on the page-left → climber turns left (negative x).
      const turnX = (wp.side === 'left' ? -1 : 1) * focus * 5;
      const turnRot = (wp.side === 'left' ? -1 : 1) * focus * 12;
      head.setAttribute('transform', `rotate(${turnRot} 0 -43) translate(${turnX} 0)`);
      void nearest;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  // The ladder is rendered as a tall column of repeating rungs. We make it
  // taller than the viewport by RUNG_SPACING so the modulo-translate trick
  // looks seamless. We need ceil(vh / spacing) + 2 rungs to cover.
  const rungCount = 40; // plenty for any reasonable viewport
  return (
    <div className="climber" aria-hidden="true">
      <div className="climber__wall" />
      <div
        ref={ladderRef}
        className="climber__ladder"
        style={{ left: `${LADDER_X_PCT}%`, height: `${rungCount * RUNG_SPACING}px` }}
      >
        <span className="climber__rail climber__rail--left" />
        <span className="climber__rail climber__rail--right" />
        {Array.from({ length: rungCount }).map((_, i) => (
          <span
            key={i}
            className="climber__rung"
            style={{ top: `${i * RUNG_SPACING}px` }}
          />
        ))}
      </div>
      <svg
        ref={climberRef}
        className="climber__figure"
        viewBox="-30 -60 60 80"
        style={{ left: `${LADDER_X_PCT}%` }}
      >
        <g ref={headRef} className="climber__head-group">
          <circle cx="0" cy="-50" r="7" />
        </g>
        <line className="climber__body" x1="0" y1="-43" x2="0" y2="-10" />
        <line ref={leftArmRef} className="climber__limb" x1="0" y1="-38" x2="-12" y2="-44" />
        <line ref={rightArmRef} className="climber__limb" x1="0" y1="-38" x2="12" y2="-44" />
        <line ref={leftLegRef} className="climber__limb" x1="0" y1="-10" x2="-9" y2="14" />
        <line ref={rightLegRef} className="climber__limb" x1="0" y1="-10" x2="9" y2="14" />
        <circle className="climber__hand" cx="-12" cy="-44" r="2.5" />
        <circle className="climber__hand" cx="12" cy="-44" r="2.5" />
      </svg>
    </div>
  );
}

void ScrollTrigger;
void gsap;
