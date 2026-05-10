import { resume } from './resume';

export type Side = 'left' | 'right' | 'center';

export type WaypointSpec = {
  id: string;
  /** Which side of the path the content sits on */
  side: Side;
  /** Viewport heights of "hold" — dot rests at this waypoint while bullets reveal */
  holdVh: number;
  /** Viewport heights of "travel" — dot moves from previous waypoint to this one */
  travelVh: number;
  /** Optional eyebrow line above headline */
  eyebrow?: string;
  /** Headline (display size) */
  headline: string;
  /** Sub-line under headline */
  sub?: string;
  /** Bullets that reveal one-by-one during the hold */
  bullets?: string[];
  /** A small "kind" tag rendered as a chip near the waypoint */
  kind?: string;
};

const exp = resume.experience;

export const waypoints: WaypointSpec[] = [
  {
    id: 'hero',
    side: 'center',
    holdVh: 1.0,
    travelVh: 0,
    headline: resume.name,
    sub: resume.role,
  },
  {
    id: 'hello',
    side: 'left',
    holdVh: 1.0,
    travelVh: 0.6,
    eyebrow: 'Hey,',
    headline: "I'm Miguel.",
    sub: 'Melbourne-based · 8 years building software.',
  },
  {
    id: 'about',
    side: 'right',
    holdVh: 1.4,
    travelVh: 0.6,
    eyebrow: "I'm a",
    headline: 'Full-stack engineer.',
    sub: resume.summary,
  },
  {
    id: 'build',
    side: 'left',
    holdVh: 1.6,
    travelVh: 0.6,
    eyebrow: 'I build',
    headline: 'Things on the web.',
    bullets: [
      'Responsive UIs that hold up at scale.',
      'Resilient APIs and microservices.',
      'Cloud architectures that earn their keep.',
    ],
  },
  ...exp.map<WaypointSpec>((role, i) => ({
    id: `role-${i}`,
    side: i % 2 === 0 ? 'right' : 'left',
    holdVh: Math.max(1.0, 0.5 + role.bullets.length * 0.55),
    travelVh: 0.6,
    kind: role.period,
    eyebrow: role.role,
    headline: role.company,
    bullets: role.bullets,
  })),
  {
    id: 'projects',
    side: 'right',
    holdVh: 1 + resume.projects.length * 0.45,
    travelVh: 0.6,
    eyebrow: 'A few things I shipped',
    headline: 'Selected projects.',
    bullets: resume.projects.map((p) => `${p.title} — ${p.summary}`),
  },
  {
    id: 'skills',
    side: 'left',
    holdVh: 2.2,
    travelVh: 0.6,
    eyebrow: 'What I work with',
    headline: 'Skills & tools.',
    bullets: [
      `Languages — ${resume.skills.languages.join(' · ')}`,
      `Frameworks — ${resume.skills.frameworks.join(' · ')}`,
      `Cloud & infra — ${resume.skills.cloud.join(' · ')}`,
    ],
  },
  {
    id: 'education',
    side: 'right',
    holdVh: 1.6,
    travelVh: 0.6,
    eyebrow: 'Studied at',
    headline: 'RMIT.',
    bullets: resume.education.map((e) =>
      e.org ? `${e.title} · ${e.org} — ${e.detail}` : `${e.title} — ${e.detail}`,
    ),
  },
  {
    id: 'contact',
    side: 'center',
    holdVh: 1.4,
    travelVh: 0.8,
    eyebrow: 'Get in touch',
    headline: "Let's talk.",
    sub: `${resume.location} · ${resume.phone} · ${resume.email}`,
  },
];
