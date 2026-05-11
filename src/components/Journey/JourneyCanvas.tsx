import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { waypoints } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import './JourneyCanvas.css';

// Anchor positions in percent of viewport (0..100), one per waypoint.
// Path hugs the centre column; x oscillates gently around 50.
const ANCHORS_PCT: Array<[number, number]> = [
  [50, 22], // 0  hero (center)
  [40, 30], // 1  hello (left)
  [60, 36], // 2  about (right)
  [40, 42], // 3  build (left)
  [60, 48], // 4  slalom (right)
  [40, 54], // 5  deloitte senior (left)
  [60, 60], // 6  deloitte contractor (right)
  [40, 66], // 7  deloitte intern (left)
  [60, 72], // 8  origin tennis (right)
  [40, 76], // 9  projects (left)
  [60, 80], // 10 skills (right)
  [40, 84], // 11 education (left)
  [50, 88], // 12 contact (center)
];

/** Catmull-Rom → cubic Bezier. C1-continuous smooth curve through all points. */
function buildPathD(vpW: number, vpH: number): string {
  const pts: Array<[number, number]> = ANCHORS_PCT.map(([px, py]) => [
    (px / 100) * vpW,
    (py / 100) * vpH,
  ]);
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function JourneyCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const landingsRef = useRef<HTMLDivElement[]>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const svg = svgRef.current;
    const path = pathRef.current;
    const trail = trailRef.current;
    const dot = dotRef.current;
    if (!svg || !path || !trail || !dot) return;

    const proxy = { t: 0 };
    let length = 0;

    const sizeAndDraw = () => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      svg.setAttribute('viewBox', `0 0 ${vpW} ${vpH}`);
      const d = buildPathD(vpW, vpH);
      path.setAttribute('d', d);
      trail.setAttribute('d', d);
      length = path.getTotalLength();
      trail.style.strokeDasharray = String(length);
      trail.style.strokeDashoffset = String(length * (1 - proxy.t));
      placeDot();
      placeLandings();
    };

    const placeDot = () => {
      const t = Math.max(0, Math.min(1, proxy.t));
      const point = path.getPointAtLength(length * t);
      dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      trail.style.strokeDashoffset = String(length * (1 - t));

      // Highlight nearest landing box
      const nearestIdx = Math.round(t * (waypoints.length - 1));
      landingsRef.current.forEach((el, i) => {
        if (!el) return;
        if (i === nearestIdx) el.classList.add('is-active');
        else el.classList.remove('is-active');
      });
    };

    const placeLandings = () => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      ANCHORS_PCT.forEach(([px, py], i) => {
        const el = landingsRef.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${(px / 100) * vpW}px, ${(py / 100) * vpH}px, 0)`;
      });
    };

    sizeAndDraw();

    if (reduced) {
      trail.style.strokeDashoffset = '0';
      dot.style.display = 'none';
      return;
    }

    const pageEl = document.querySelector<HTMLElement>('.page');
    if (!pageEl) return;

    // ONE continuous tween: dot moves linearly along the path as the user
    // scrolls from top to bottom. No dwell, no extra-scroll-to-trigger.
    const tween = gsap.to(proxy, {
      t: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: pageEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      onUpdate: placeDot,
    });

    const onResize = () => sizeAndDraw();
    window.addEventListener('resize', onResize);
    const onRefresh = () => sizeAndDraw();
    ScrollTrigger.addEventListener('refreshInit', onRefresh);

    return () => {
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('refreshInit', onRefresh);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <>
      <svg
        ref={svgRef}
        className="journey"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          className="journey__path-bg"
          d=""
          fill="none"
        />
        <path
          ref={trailRef}
          className="journey__trail"
          d=""
          fill="none"
        />
      </svg>
      {ANCHORS_PCT.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) landingsRef.current[i] = el;
          }}
          className="journey__landing"
          aria-hidden="true"
        />
      ))}
      <div ref={dotRef} className="journey__dot" aria-hidden="true" />
    </>
  );
}
