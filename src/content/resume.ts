export const resume = {
  name: 'Miguel Pasa',
  role: 'Senior Software Engineer — Full Stack',
  location: 'Maribyrnong, VIC',
  email: 'pasamiguel78@gmail.com',
  phone: '0488 507 229',
  summary:
    'Senior full-stack engineer with 8 years of consulting experience. I design, build, and lead front-ends in React and TypeScript and back-ends in Java, Spring Boot, and Node. I love head-scratching problems, new tech, and a passionate team.',
  experience: [
    {
      company: 'Slalom',
      role: 'Senior Engineer',
      period: 'Mar 2022 — Present',
      bullets: [
        'Led front-end on a national-scope Australian Government site (React, Redux, Formik, Java microservices on Lambda); led the React 15 → 18 upgrade.',
        'Led front-end for Takenaka — one of Japan’s oldest architecture firms — building a digital assets manager (Next.js, Spring Boot, S3, RDS, CloudFront, API Gateway).',
        'Led front-end for the Airservices Australia Digital Services Portal (Next.js, Node, AWS).',
        'Led front-end for Redbubble’s AI-based fulfillment routing tool (React, Node, AWS).',
      ],
    },
    {
      company: 'Deloitte Digital',
      role: 'Senior Consultant',
      period: 'Mar 2019 — Mar 2022',
      bullets: [
        'Led back-end (AEM + APIs) on a government website build with endpoints handling 200,000 concurrent users.',
        'Delivered the CBUS Super Income Stream build — custom AEM components end-to-end.',
        'Led front-end & AEM work across Fonterra, Bank of Queensland, Virgin Money, and Transurban (incl. Citylink Toll Calculator backend + tests, and Fonterra Azure AD login).',
      ],
    },
    {
      company: 'Deloitte Digital',
      role: 'Contractor',
      period: 'Oct 2017 — Aug 2018',
      bullets: ['AEM enhancements and fixes for managed-services clients in Java.'],
    },
    {
      company: 'Deloitte Digital',
      role: 'Software Engineering Intern',
      period: 'Jan 2017 — Oct 2017',
      bullets: [
        'Full-stack work across HTML, CSS, JS and AEM Java; Atlassian + CI tooling.',
        'Built a Selenium / ChromeDriver test automation tool for the Managed Services team.',
        'Contributed to CBUS Super Bot for Google Home.',
      ],
    },
    {
      company: 'Origin Tennis @ St. Monica’s',
      role: 'Junior Coach',
      period: 'May 2011 — Feb 2020',
      bullets: ['Nine years coaching juniors — patience, communication, and showing up.'],
    },
  ],
  projects: [
    {
      title: 'Govt national-scope web app',
      org: 'Slalom',
      summary: 'Front-end lead. React/Redux/Formik. Led the React 15 → 18 upgrade.',
    },
    {
      title: 'Takenaka Digital Assets Manager',
      org: 'Slalom',
      summary: 'Architected and shipped a DAM for one of Japan’s oldest architecture firms.',
    },
    {
      title: 'Airservices Australia Portal',
      org: 'Slalom',
      summary: 'Authentication, scheduling and platform gateway for ASA members.',
    },
    {
      title: 'Redbubble AI Routing',
      org: 'Slalom',
      summary: 'Front-end for managing AI fulfilment-routing parameters and order state.',
    },
  ],
  skills: {
    languages: ['TypeScript', 'JavaScript', 'Java', 'Kotlin', 'HTML', 'CSS'],
    frameworks: ['React', 'Next.js', 'Redux', 'Formik', 'Spring Boot', 'Node', 'AEM'],
    cloud: [
      'AWS · Lambda',
      'S3',
      'RDS',
      'EC2',
      'CloudFront',
      'API Gateway',
      'CloudFormation',
      'Azure',
      'GCP',
      'Cypress',
      'Playwright',
      'JUnit',
      'Git',
      'CI/CD',
    ],
  },
  education: [
    {
      title: 'Bachelor of Software Engineering',
      org: 'RMIT University',
      detail: '2015 — 2018 · GPA 3.1',
    },
    {
      title: 'St. Bernard’s College',
      org: '',
      detail: 'ATAR 93.3 (2014)',
    },
  ],
};

export type Resume = typeof resume;
