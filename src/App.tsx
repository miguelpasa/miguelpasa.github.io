import { useEffect } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { startLenis, stopLenis, getLenis } from './lib/lenis';
import { Nav } from './components/Nav';
import { ClimberCanvas } from './components/Journey/ClimberCanvas';
import { Waypoint } from './components/Journey/Waypoint';
import { waypoints } from './content/journey';

export default function App() {
  useEffect(() => {
    startLenis();

    // Compute each waypoint's mid-section progress (0..1) so we can snap to them.
    const totalVh = waypoints.reduce((s, w) => s + w.vh, 0);
    const anchorProgress: number[] = [];
    {
      let acc = 0;
      for (const w of waypoints) {
        anchorProgress.push((acc + w.vh / 2) / totalVh);
        acc += w.vh;
      }
    }

    // Custom snap: when scrolling stops, decide if we're close enough to a
    // waypoint to snap there. Uses Lenis's smooth scrollTo so it integrates
    // with the smooth scroll.
    let snapTimer: number | null = null;
    let lastScrollY = 0;
    const SNAP_DELAY = 160; // ms after last scroll event
    const SNAP_THRESHOLD = 0.35; // fraction of a section's range — within this, snap

    const trySnap = () => {
      const lenis = getLenis();
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const y = window.scrollY;
      const p = y / maxScroll;

      // Find the two anchors surrounding p
      let target = anchorProgress[0];
      let bestDist = Infinity;
      for (const a of anchorProgress) {
        const d = Math.abs(a - p);
        if (d < bestDist) {
          bestDist = d;
          target = a;
        }
      }
      // Only snap if within SNAP_THRESHOLD of a typical section size
      const avgSectionSize = 1 / anchorProgress.length;
      if (bestDist > avgSectionSize * SNAP_THRESHOLD) return;
      // Don't snap if already at the target
      if (Math.abs(target - p) * maxScroll < 6) return;

      const targetY = target * maxScroll;
      if (lenis) {
        lenis.scrollTo(targetY, { duration: 0.55, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY) < 0.5) return;
      lastScrollY = y;
      if (snapTimer) window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(trySnap, SNAP_DELAY);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('scroll', onScroll);
      if (snapTimer) window.clearTimeout(snapTimer);
      stopLenis();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      <Nav />
      <ClimberCanvas />
      <main className="page">
        {waypoints.map((spec) => (
          <Waypoint key={spec.id} spec={spec} />
        ))}
      </main>
    </>
  );
}
