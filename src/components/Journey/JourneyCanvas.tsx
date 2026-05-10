import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { waypoints } from '../../content/journey';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import './JourneyCanvas.css';

// Anchor positions in percent of viewport (0..100), one per waypoint.
// Each y is unique and gently increases so the path traces a zigzag down the
// viewport without overlapping itself.
const ANCHORS_PCT: Array<[number, number]> = [
  [50, 32], // 0  hero (center)
  [24, 42], // 1  hello (left)
  [76, 38], // 2  about (right)
  [22, 48], // 3  build (left)
  [78, 44], // 4  slalom (right)
  [22, 54], // 5  deloitte senior (left)
  [78, 50], // 6  deloitte contractor (right)
  [22, 60], // 7  deloitte intern (left)
  [78, 56], // 8  origin tennis (right)
  [24, 64], // 9  projects (left)
  [76, 62], // 10 skills (right)
  [26, 68], // 11 education (left)
  [50, 74], // 12 contact (center)
];

function buildPathD(vpW: number, vpH: number): string {
  const pts: Array<[number, number]> = ANCHORS_PCT.map(([px, py]) => [
    (px / 100) * vpW,
    (py / 100) * vpH,
  ]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[i - 1];
    // Horizontal-leading control points: produces smooth S-shape transitions
    // without overshoot loops, even when consecutive y-values are close.
    const mid = (px + x) / 2;
    d += ` C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`;
  }
  return d;
}

export function JourneyCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
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
    };

    const placeDot = () => {
      const t = Math.max(0, Math.min(1, proxy.t));
      const point = path.getPointAtLength(length * t);
      dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      trail.style.strokeDashoffset = String(length * (1 - t));
    };

    sizeAndDraw();

    if (reduced) {
      trail.style.strokeDashoffset = '0';
      dot.style.display = 'none';
      return;
    }

    const pageEl = document.querySelector<HTMLElement>('.page');
    if (!pageEl) return;

    const N = waypoints.length;
    const pathT = (i: number) => i / (N - 1);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pageEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
      onUpdate: placeDot,
    });

    waypoints.forEach((w, i) => {
      if (i === 0) {
        tl.to(proxy, { t: pathT(0), duration: w.holdVh });
        return;
      }
      tl.to(proxy, { t: pathT(i), duration: w.travelVh, ease: 'power1.inOut' });
      tl.to(proxy, { t: pathT(i), duration: w.holdVh });
    });

    const onResize = () => sizeAndDraw();
    window.addEventListener('resize', onResize);
    const onRefresh = () => sizeAndDraw();
    ScrollTrigger.addEventListener('refreshInit', onRefresh);

    return () => {
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('refreshInit', onRefresh);
      tl.scrollTrigger?.kill();
      tl.kill();
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
      <div ref={dotRef} className="journey__dot" aria-hidden="true" />
    </>
  );
}
