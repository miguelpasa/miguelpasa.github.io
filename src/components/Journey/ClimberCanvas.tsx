import { useEffect, useRef } from 'react';
import { waypoints } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import './ClimberCanvas.css';

const LADDER_X_PCT = 50;
const RUNG_SPACING = 64; // px between rungs
const CYCLE_DISTANCE = RUNG_SPACING * 2; // px of scroll per full 4-limb cycle
const HEAD_TURN_RANGE = 0.08;

// ── Limb anchor data (SVG units) ───────────────────────────────────────────
// Origin: torso centre. Hands rest above shoulders gripping rungs; feet rest
// below the hips on a rung. Each limb has its own phase window in [0,1] where
// it transitions to the next rung. The four windows are sequenced so that
// only one limb is in transit at any moment (3-point contact rule).
type LimbId = 'RF' | 'LH' | 'LF' | 'RH';
type Limb = {
  id: LimbId;
  /** Anchor (shoulder for arms, hip for legs) in SVG coords */
  ax: number;
  ay: number;
  /** Rest position of the hand/foot when gripping */
  rx: number;
  ry: number;
  /** Cycle phase window [start, end] during which this limb is in transit */
  phase: [number, number];
  /** Maximum downward dip distance during the step (px in SVG units) */
  lift: number;
  /** Out-of-line direction for knee/elbow bend: +1 right, -1 left */
  bendDir: number;
  /** Whether this limb is an arm (true) or leg (false) — affects knee/elbow logic */
  isArm: boolean;
};

// Sequencing: RF → LH → LF → RH (diagonal opposites alternate).
// Gaps between phases are intentional — tiny pauses where the climber settles.
const LIMBS: Limb[] = [
  { id: 'RF', ax: 0, ay: -10, rx: 9, ry: 16, phase: [0.05, 0.27], lift: 22, bendDir: 1, isArm: false },
  { id: 'LH', ax: 0, ay: -38, rx: -12, ry: -44, phase: [0.31, 0.49], lift: 14, bendDir: -1, isArm: true },
  { id: 'LF', ax: 0, ay: -10, rx: -9, ry: 16, phase: [0.54, 0.76], lift: 22, bendDir: -1, isArm: false },
  { id: 'RH', ax: 0, ay: -38, rx: 12, ry: -44, phase: [0.80, 0.98], lift: 14, bendDir: 1, isArm: true },
];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Position of a single limb's hand/foot at cycle progress p. */
function limbPos(
  limb: Limb,
  p: number,
  cycleIdx: number,
): { x: number; y: number; gripStrength: number } {
  const [s, e] = limb.phase;

  // Tiny per-cycle asymmetry so the rhythm doesn't feel mechanical
  const jitter = ((cycleIdx + limb.id.charCodeAt(0)) % 7) / 7 - 0.5; // -0.5..0.5

  if (p < s || p > e) {
    // Gripping rung. Hands/feet "settle" with slight quiver right after a step.
    const justFinished = p > e && p - e < 0.04;
    const settle = justFinished ? Math.sin((p - e) * Math.PI * 25) * 0.6 : 0;
    return { x: limb.rx, y: limb.ry + settle, gripStrength: 1 };
  }

  // Inside the move window
  const t = (p - s) / (e - s);
  const lift = limb.lift + jitter * 1.5;

  if (t < 0.15) {
    // Phase A — anticipation: tiny upward lift (heel/hand rises before release)
    const k = easeInOutCubic(t / 0.15);
    return {
      x: limb.rx + limb.bendDir * 0.5 * k,
      y: limb.ry - 4 * k,
      gripStrength: 1 - k * 0.4,
    };
  }
  if (t < 0.45) {
    // Phase B — descend: limb travels down, knee/elbow swings outward
    const k = easeInOutCubic((t - 0.15) / 0.30);
    const xSwing = limb.bendDir * 2.5 * Math.sin(k * Math.PI);
    return {
      x: limb.rx + xSwing,
      y: limb.ry - 4 + (lift + 4) * k,
      gripStrength: 0.4,
    };
  }
  if (t < 0.78) {
    // Phase C — search & contact: limb hesitates near target, then settles
    const k = (t - 0.45) / 0.33;
    const eased = easeOutBack(k);
    // y goes from lift back to ~rest
    const y = limb.ry + lift * (1 - eased);
    // Tiny tremor as the limb finds the rung
    const tremor = k < 0.7 ? Math.sin(k * Math.PI * 8) * 0.5 * (1 - k) : 0;
    return { x: limb.rx + tremor * limb.bendDir, y, gripStrength: 0.4 + k * 0.6 };
  }
  // Phase D — confirmed grip; tighten and small settle
  const k = (t - 0.78) / 0.22;
  return {
    x: limb.rx,
    y: limb.ry + (1 - easeInOutCubic(k)) * 1.5,
    gripStrength: 1,
  };
}

/** Smoothstep bell curve for in-phase weight shift. */
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

    const update = () => {
      const scrollY = window.scrollY;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const pageP = Math.max(0, Math.min(1, scrollY / max));

      // 1. Rung scroll — modulo trick for infinite ladder
      ladder.style.transform = `translate3d(-50%, ${-(scrollY % RUNG_SPACING)}px, 0)`;

      // 2. Climb cycle progress (0..1, one cycle per CYCLE_DISTANCE of scroll)
      const cycleIdx = Math.floor(scrollY / CYCLE_DISTANCE);
      const cycleP = (scrollY % CYCLE_DISTANCE) / CYCLE_DISTANCE;

      // 3. Per-limb positions
      for (const limb of LIMBS) {
        const pathEl = limbPathRefs.current[limb.id];
        const handEl = limbHandRefs.current[limb.id];
        if (!pathEl || !handEl) continue;

        const pos = limbPos(limb, cycleP, cycleIdx);

        // Bend joint (knee or elbow) midway, biased outward
        const midX = (limb.ax + pos.x) / 2;
        const midY = (limb.ay + pos.y) / 2;
        const dx = pos.x - limb.ax;
        const dy = pos.y - limb.ay;
        const len = Math.sqrt(dx * dx + dy * dy);
        // The shorter the limb is (foot tucked up), the more the knee bends out
        const restLen = Math.hypot(limb.rx - limb.ax, limb.ry - limb.ay);
        const compression = Math.max(0, 1 - len / restLen);
        const bendBase = limb.isArm ? 4 : 5;
        const bend = bendBase + compression * 9;
        const jointX = midX + limb.bendDir * bend;
        const jointY = midY + (limb.isArm ? -1.5 : 1.5);

        pathEl.setAttribute(
          'd',
          `M ${limb.ax} ${limb.ay} Q ${jointX} ${jointY} ${pos.x} ${pos.y}`,
        );
        // Grip indicator: hand/foot circle grows slightly when gripping firmly
        const r = 2.2 + pos.gripStrength * 0.9;
        handEl.setAttribute('cx', String(pos.x));
        handEl.setAttribute('cy', String(pos.y));
        handEl.setAttribute('r', String(r));
      }

      // 4. Body sway and bob
      // Lean AWAY from a moving foot (weight stays on the planted foot)
      const swayRF = -bellInPhase(LIMBS[0].phase, cycleP) * 2.5;
      const swayLF = bellInPhase(LIMBS[2].phase, cycleP) * 2.5;
      // Lean slightly toward the planted hand when the other hand is moving
      const swayLH = bellInPhase(LIMBS[1].phase, cycleP) * 1.0;
      const swayRH = -bellInPhase(LIMBS[3].phase, cycleP) * 1.0;
      const sway = swayRF + swayLF + swayLH + swayRH;

      // Bob: hips compress (down) before a foot step, settle after
      // Cycle has two foot moves → two compressions per cycle
      const bob =
        bellInPhase([0, 0.05], cycleP) * 0 + // no early bob
        Math.max(
          bellInPhase([LIMBS[0].phase[0] - 0.05, LIMBS[0].phase[0] + 0.04], cycleP) * 1.8,
          bellInPhase([LIMBS[2].phase[0] - 0.05, LIMBS[2].phase[0] + 0.04], cycleP) * 1.8,
        ) +
        // Breathing oscillation — slow, subtle
        Math.sin((scrollY / 320) * Math.PI * 2) * 0.4;

      // Spine hunch: slight downward compression of torso during weight transfer
      const hunch =
        bellInPhase(LIMBS[0].phase, cycleP) * 0.8 +
        bellInPhase(LIMBS[2].phase, cycleP) * 0.8;
      torso.setAttribute('y2', String(-10 + hunch));

      body.setAttribute('transform', `translate(${sway} ${bob})`);

      // 5. Head — turn toward nearest window, plus permanent slight downward tilt
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
      const turnX = (wp.side === 'left' ? -1 : 1) * focus * 5;
      const turnRot = (wp.side === 'left' ? -1 : 1) * focus * 12;
      // Permanent forward/downward tilt of ~6° to suggest "looking at rungs"
      const baseTilt = 6 - focus * 6; // straightens when actively looking out the window
      head.setAttribute(
        'transform',
        `rotate(${turnRot + baseTilt} 0 -43) translate(${turnX} 0)`,
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
    // Always tick during smooth scroll / breathing
    const breathTick = () => {
      update();
      breathRaf = requestAnimationFrame(breathTick);
    };
    let breathRaf = requestAnimationFrame(breathTick);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(breathRaf);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const rungCount = 40;
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
        viewBox="-30 -64 60 90"
        style={{ left: `${LADDER_X_PCT}%` }}
      >
        <g ref={bodyGroupRef}>
          <g ref={headRef} className="climber__head-group">
            <circle cx="0" cy="-50" r="7" />
          </g>
          <line ref={torsoRef} className="climber__body" x1="0" y1="-43" x2="0" y2="-10" />
          {LIMBS.map((l) => (
            <path
              key={l.id}
              ref={(el) => {
                limbPathRefs.current[l.id] = el;
              }}
              className="climber__limb"
              d={`M ${l.ax} ${l.ay} Q ${l.ax + l.bendDir * 4} ${(l.ay + l.ry) / 2} ${l.rx} ${l.ry}`}
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
              r="2.8"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
