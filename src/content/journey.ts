import { resume } from './resume';

export type Side = 'left' | 'right';

export type WaypointSpec = {
  id: string;
  /** Which side of the ladder the window sits on */
  side: Side;
  /** Viewport heights this section occupies */
  vh: number;
  kind?: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  bullets?: string[];
};

const exp = resume.experience;

export const waypoints: WaypointSpec[] = [
  {
    id: 'hero',
    side: 'right',
    vh: 1.2,
    headline: resume.name,
    sub: resume.role,
  },
  {
    id: 'hello',
    side: 'right',
    vh: 1.3,
    eyebrow: 'Hey,',
    headline: "I'm Miguel.",
    sub: 'Melbourne-based · 8 years building software.',
  },
  {
    id: 'about',
    side: 'left',
    vh: 1.6,
    eyebrow: "I'm a",
    headline: 'Full-stack engineer.',
    sub: resume.summary,
  },
  {
    id: 'build',
    side: 'right',
    vh: 1.8,
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
    side: i % 2 === 0 ? 'left' : 'right',
    vh: 1.0 + role.bullets.length * 0.5,
    kind: role.period,
    eyebrow: role.role,
    headline: role.company,
    bullets: role.bullets,
  })),
  {
    id: 'projects',
    side: 'right',
    vh: 1.2 + resume.projects.length * 0.45,
    eyebrow: 'A few things I shipped',
    headline: 'Selected projects.',
    bullets: resume.projects.map((p) => `${p.title} — ${p.summary}`),
  },
  {
    id: 'skills',
    side: 'left',
    vh: 2.4,
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
    vh: 1.8,
    eyebrow: 'Studied at',
    headline: 'RMIT.',
    bullets: resume.education.map((e) =>
      e.org ? `${e.title} · ${e.org} — ${e.detail}` : `${e.title} — ${e.detail}`,
    ),
  },
  {
    id: 'contact',
    side: 'left',
    vh: 1.6,
    eyebrow: 'Get in touch',
    headline: "Let's talk.",
    sub: `${resume.location} · ${resume.phone} · ${resume.email}`,
  },
];
