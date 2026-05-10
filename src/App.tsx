import { useEffect } from 'react';
import { ScrollTrigger } from './lib/gsap';
import { startLenis, stopLenis } from './lib/lenis';
import { Nav } from './components/Nav';
import { JourneyCanvas } from './components/Journey/JourneyCanvas';
import { Waypoint } from './components/Journey/Waypoint';
import { waypoints } from './content/journey';

export default function App() {
  useEffect(() => {
    startLenis();
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      stopLenis();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <>
      <Nav />
      <JourneyCanvas />
      <main className="page">
        {waypoints.map((spec) => (
          <Waypoint key={spec.id} spec={spec} />
        ))}
      </main>
    </>
  );
}
