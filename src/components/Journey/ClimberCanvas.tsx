import { useEffect, useRef } from 'react';
import { waypoints } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import './ClimberCanvas.css';

const LADDER_X_PCT = 50;
const HEAD_TURN_RANGE = 0.08;

// Rung spacing is viewport-relative so the ladder scales with screen size.
const getRungSpacing = () => Math.max(80, Math.round(window.innerHeight * 0.13));

// ── Limb anchor data (SVG units, viewBox -30 -80 60 110) ────────────────
// The figure sits BETWEEN the rails of the ladder. Hands reach up to grip
// the rung above the head; feet plant on a rung below the hips. The
// shoulders, hips, hands and feet are all on the centre line so the
// climber's centre of gravity sits exactly between the rails.
type LimbId = 'RF' | 'LH' | 'LF' | 'RH';
type Limb = {
  id: LimbId;
  ax: number; // shoulder or hip anchor
  ay: number;
  rx: number; // rest position of the hand/foot
  ry: number;
  phase: [number, number];
  lift: number;
  bendDir: number;
  isArm: boolean;
};

const LIMBS: Limb[] = [
  // Right foot — planted on a rung below the hips, just right of centre
  { id: 'RF', ax: 0, ay: -10, rx: 11, ry: 22, phase: [0.05, 0.27], lift: 30, bendDir: 1, isArm: false },
  // Left hand — gripping a rung above the head, to the left
  { id: 'LH', ax: 0, ay: -46, rx: -18, ry: -66, phase: [0.31, 0.49], lift: 22, bendDir: -1, isArm: true },
  // Left foot
  { id: 'LF', ax: 0, ay: -10, rx: -11, ry: 22, phase: [0.54, 0.76], lift: 30, bendDir: -1, isArm: false },
  // Right hand
  { id: 'RH', ax: 0, ay: -46, rx: 18, ry: -66, phase: [0.80, 0.98], lift: 22, bendDir: 1, isArm: true },
];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function limbPos(
  limb: Limb,
  p: number,
  cycleIdx: number,
): { x: number; y: number; gripStrength: number } {
  const [s, e] = limb.phase;
  const jitter = ((cycleIdx + limb.id.charCodeAt(0)) % 7) / 7 - 0.5;

  if (p < s || p > e) {
    const justFinished = p > e && p - e < 0.04;
    const settle = justFinished ? Math.sin((p - e) * Math.PI * 25) * 0.8 : 0;
    return { x: limb.rx, y: limb.ry + settle, gripStrength: 1 };
  }

  const t = (p - s) / (e - s);
  const lift = limb.lift + jitter * 2;

  if (t < 0.15) {
    // Anticipation — tiny upward lift before release
    const k = easeInOutCubic(t / 0.15);
    return {
      x: limb.rx + limb.bendDir * 0.8 * k,
      y: limb.ry - 5 * k,
      gripStrength: 1 - k * 0.4,
    };
  }
  if (t < 0.45) {
    // Descent — limb travels down toward next rung
    const k = easeInOutCubic((t - 0.15) / 0.30);
    const xSwing = limb.bendDir * 4 * Math.sin(k * Math.PI);
    return {
      x: limb.rx + xSwing,
      y: limb.ry - 5 + (lift + 5) * k,
      gripStrength: 0.4,
    };
  }
  if (t < 0.78) {
    // Search & contact — hesitate, then settle onto next position
    const k = (t - 0.45) / 0.33;
    const eased = easeOutBack(k);
    const y = limb.ry + lift * (1 - eased);
    const tremor = k < 0.7 ? Math.sin(k * Math.PI * 8) * 0.7 * (1 - k) : 0;
    return { x: limb.rx + tremor * limb.bendDir, y, gripStrength: 0.4 + k * 0.6 };
  }
  // Grip confirmed — final settle
  const k = (t - 0.78) / 0.22;
  return {
    x: limb.rx,
    y: limb.ry + (1 - easeInOutCubic(k)) * 2,
    gripStrength: 1,
  };
}

function bellInPhase(phase: [number, number], p: number) {
  const [s, e] = phase;
  if (p < s || p > e) return 0;
  const t = (p - s) / (e - s);
  return Math.sin(t * Math.PI);
}

export function ClimberCanvas() {
  const ladderRef = useRef<HTMLDivElement>(null);
  const climberRef = useRef<SVGSVGElement>(null);
  const bodyGroupRef = useRef<SVGGElement>(null);
  const torsoRef = useRef<SVGLineElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const limbPathRefs = useRef<Record<LimbId, SVGPathElement | null>>({
    RF: null,
    LH: null,
    LF: null,
    RH: null,
  });
  const limbHandRefs = useRef<Record<LimbId, SVGCircleElement | null>>({
    RF: null,
    LH: null,
    LF: null,
    RH: null,
  });
  const reduced = usePrefersReducedMotion();

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
    const body = bodyGroupRef.current;
    const head = headRef.current;
    const torso = torsoRef.current;
    if (!ladder || !body || !head || !torso) return;
    if (reduced) return;

    // Ensure ladder is tall enough to cover viewport + a rung of slack for the
    // modulo-scroll trick. Re-laid out on resize.
    const layoutLadder = () => {
      const rungSpacing = getRungSpacing();
      const needed = Math.ceil((window.innerHeight + rungSpacing * 2) / rungSpacing) + 2;
      // Update CSS custom property so rungs position via var(--rs)
      ladder.style.setProperty('--rs', `${rungSpacing}px`);
      ladder.style.height = `${needed * rungSpacing}px`;
      // Repopulate rung children to match
      const existing = ladder.querySelectorAll('.climber__rung').length;
      if (existing !== needed) {
        ladder.querySelectorAll('.climber__rung').forEach((n) => n.remove());
        for (let i = 0; i < needed; i++) {
          const r = document.createElement('span');
          r.className = 'climber__rung';
          r.style.top = `${i * rungSpacing}px`;
          ladder.appendChild(r);
        }
      } else {
        ladder.querySelectorAll('.climber__rung').forEach((n, i) => {
          (n as HTMLElement).style.top = `${i * rungSpacing}px`;
        });
      }
    };

    layoutLadder();

    const update = () => {
      const scrollY = window.scrollY;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const pageP = Math.max(0, Math.min(1, scrollY / max));
      const rungSpacing = getRungSpacing();
      const cycleDistance = rungSpacing * 2;

      ladder.style.transform = `translate3d(0, ${-(scrollY % rungSpacing)}px, 0)`;

      const cycleIdx = Math.floor(scrollY / cycleDistance);
      const cycleP = (scrollY % cycleDistance) / cycleDistance;

      for (const limb of LIMBS) {
        const pathEl = limbPathRefs.current[limb.id];
        const handEl = limbHandRefs.current[limb.id];
        if (!pathEl || !handEl) continue;

        const pos = limbPos(limb, cycleP, cycleIdx);

        const midX = (limb.ax + pos.x) / 2;
        const midY = (limb.ay + pos.y) / 2;
        const dx = pos.x - limb.ax;
        const dy = pos.y - limb.ay;
        const len = Math.sqrt(dx * dx + dy * dy);
        const restLen = Math.hypot(limb.rx - limb.ax, limb.ry - limb.ay);
        const compression = Math.max(0, 1 - len / restLen);
        const bendBase = limb.isArm ? 6 : 8;
        const bend = bendBase + compression * 14;
        const jointX = midX + limb.bendDir * bend;
        const jointY = midY + (limb.isArm ? -2 : 2);

        pathEl.setAttribute(
          'd',
          `M ${limb.ax} ${limb.ay} Q ${jointX} ${jointY} ${pos.x} ${pos.y}`,
        );
        const r = 2.2 + pos.gripStrength * 1.0;
        handEl.setAttribute('cx', String(pos.x));
        handEl.setAttribute('cy', String(pos.y));
        handEl.setAttribute('r', String(r));
      }

      // Body sway and bob
      const swayRF = -bellInPhase(LIMBS[0].phase, cycleP) * 3;
      const swayLF = bellInPhase(LIMBS[2].phase, cycleP) * 3;
      const swayLH = bellInPhase(LIMBS[1].phase, cycleP) * 1.2;
      const swayRH = -bellInPhase(LIMBS[3].phase, cycleP) * 1.2;
      const sway = swayRF + swayLF + swayLH + swayRH;

      const bob =
        Math.max(
          bellInPhase([LIMBS[0].phase[0] - 0.05, LIMBS[0].phase[0] + 0.04], cycleP) * 2.4,
          bellInPhase([LIMBS[2].phase[0] - 0.05, LIMBS[2].phase[0] + 0.04], cycleP) * 2.4,
        ) +
        Math.sin((scrollY / 320) * Math.PI * 2) * 0.6;

      const hunch =
        bellInPhase(LIMBS[0].phase, cycleP) * 1.2 +
        bellInPhase(LIMBS[2].phase, cycleP) * 1.2;
      torso.setAttribute('y2', String(-10 + hunch));

      body.setAttribute('transform', `translate(${sway} ${bob})`);

      // Head turn toward nearest window
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < anchorProgress.length; i++) {
        const d = Math.abs(anchorProgress[i] - pageP);
        if (d < nearestDist) {
          nearestIdx = i;
          nearestDist = d;
        }
      }
      const wp = waypoints[nearestIdx];
      let focus = 0;
      if (nearestDist < HEAD_TURN_RANGE) focus = 1 - nearestDist / HEAD_TURN_RANGE;
      const turnX = (wp.side === 'left' ? -1 : 1) * focus * 3.5;
      const turnRot = (wp.side === 'left' ? -1 : 1) * focus * 8;
      const baseTilt = 4 - focus * 4;
      head.setAttribute(
        'transform',
        `rotate(${turnRot + baseTilt} 0 -55) translate(${turnX} 0)`,
      );
    };

    update();
    let raf = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (window.scrollY !== lastY) {
          lastY = window.scrollY;
          update();
        }
      });
    };
    const breathTick = () => {
      update();
      breathRaf = requestAnimationFrame(breathTick);
    };
    let breathRaf = requestAnimationFrame(breathTick);

    const onResize = () => {
      layoutLadder();
      update();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(breathRaf);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div className="climber" aria-hidden="true">
      <div className="climber__wall" />
      <div
        ref={ladderRef}
        className="climber__ladder"
        style={{ left: `${LADDER_X_PCT}%` }}
      >
        <span className="climber__rail climber__rail--left" />
        <span className="climber__rail climber__rail--right" />
      </div>
      <svg
        ref={climberRef}
        className="climber__figure"
        viewBox="-30 -80 60 110"
        preserveAspectRatio="xMidYMid meet"
      >
        <g ref={bodyGroupRef}>
          <g ref={headRef} className="climber__head-group">
            <circle cx="0" cy="-62" r="6" />
          </g>
          <line ref={torsoRef} className="climber__body" x1="0" y1="-53" x2="0" y2="-10" />
          {LIMBS.map((l) => (
            <path
              key={l.id}
              ref={(el) => {
                limbPathRefs.current[l.id] = el;
              }}
              className="climber__limb"
              d={`M ${l.ax} ${l.ay} Q ${l.ax + l.bendDir * 6} ${(l.ay + l.ry) / 2} ${l.rx} ${l.ry}`}
            />
          ))}
          {LIMBS.map((l) => (
            <circle
              key={l.id}
              ref={(el) => {
                limbHandRefs.current[l.id] = el;
              }}
              className={l.isArm ? 'climber__hand' : 'climber__foot'}
              cx={l.rx}
              cy={l.ry}
              r="2.4"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
