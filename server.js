/**
 * ELEVO - Backend API + Static File Server (zero dependencies)
 * Run:  node server.js   ->   http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

/* ============================= SEED DATA ============================= */

const CAREERS = {
  'wildlife-researcher': {
    id: 'wildlife-researcher',
    name: 'Wildlife Researcher',
    tagline: 'Study animals and ecosystems to protect biodiversity.',
    skills: [
      { id: 'wr-ecology', name: 'Ecology', topics: [
        { id: 'wr-eco-1', title: 'Ecosystems & Biomes', description: 'Understand how organisms interact with their physical environment across forests, deserts, wetlands and oceans.', resource: { label: 'Khan Academy - Ecology', url: 'https://www.khanacademy.org/science/biology/ecology' } },
        { id: 'wr-eco-2', title: 'Population & Community Ecology', description: 'Learn how populations grow, compete and coexist, and how food webs structure communities.', resource: { label: 'OpenStax - Biology 2e, Ch. 45-47', url: 'https://openstax.org/books/biology-2e/pages/45-introduction' } },
        { id: 'wr-eco-3', title: 'Conservation Ecology', description: 'Study habitat loss, invasive species, climate change and the science of protecting species.', resource: { label: 'Conservation Biology - OpenLearn', url: 'https://www.open.edu/openlearn/science-maths-technology' } }
      ]},
      { id: 'wr-biology', name: 'Wildlife Biology', topics: [
        { id: 'wr-bio-1', title: 'Animal Behavior', description: 'Explore instinct, learning, communication, mating and social systems in wild animals.', resource: { label: 'Animal Behavior - Coursera', url: 'https://www.coursera.org/search?query=animal%20behavior' } },
        { id: 'wr-bio-2', title: 'Species Identification & Taxonomy', description: 'Build field ID skills: classification, field marks, tracks, calls and scat identification.', resource: { label: 'iNaturalist - Identify Species', url: 'https://www.inaturalist.org/' } },
        { id: 'wr-bio-3', title: 'Physiology & Adaptation', description: 'How animals survive extreme environments: thermoregulation, hibernation, camouflage and migration.', resource: { label: 'Khan Academy - Animal Physiology', url: 'https://www.khanacademy.org/science/biology' } }
      ]},
      { id: 'wr-field', name: 'Field Research', topics: [
        { id: 'wr-fld-1', title: 'Observation & Survey Methods', description: 'Transects, quadrats, point counts and behavioural sampling protocols used by researchers.', resource: { label: 'Citizen Science Toolkit - Zooniverse', url: 'https://www.zooniverse.org/' } },
        { id: 'wr-fld-2', title: 'GPS, Camera Traps & Tracking', description: 'Modern field tech: geotagging, remote cameras, radio/GPS collars and drone surveys.', resource: { label: 'eBird - Field Observation Protocol', url: 'https://ebird.org/' } },
        { id: 'wr-fld-3', title: 'Ethics & Permits in Fieldwork', description: 'Animal welfare, research permits, handling protocols and working with local communities.', resource: { label: 'Guidelines for Ethical Fieldwork', url: 'https://www.nature.com/' } }
      ]},
      { id: 'wr-data', name: 'Data Analysis', topics: [
        { id: 'wr-dat-1', title: 'Statistics Basics with R', description: 'Descriptive stats, distributions, hypothesis testing and t-tests applied to ecological data.', resource: { label: 'R for Data Science (free book)', url: 'https://r4ds.hadley.nz/' } },
        { id: 'wr-dat-2', title: 'Data Visualization', description: 'Turn field data into clear charts: abundance plots, species accumulation curves, maps.', resource: { label: 'Data-to-Viz - Visualization Guide', url: 'https://www.data-to-viz.com/' } },
        { id: 'wr-dat-3', title: 'Interpreting Ecological Data', description: 'Read published datasets, detect bias, and draw defensible conclusions from field results.', resource: { label: 'GBIF - Biodiversity Data Portal', url: 'https://www.gbif.org/' } }
      ]},
      { id: 'wr-writing', name: 'Research Writing', topics: [
        { id: 'wr-wri-1', title: 'Structure of a Scientific Paper', description: 'Abstract, introduction, methods, results, discussion - write each section with confidence.', resource: { label: 'Nature - How to Write a Paper', url: 'https://www.nature.com/articles/d41586-019-02918-5' } },
        { id: 'wr-wri-2', title: 'Citations & Referencing', description: 'Master APA / journal citation styles and reference managers like Zotero.', resource: { label: 'Zotero - Free Reference Manager', url: 'https://www.zotero.org/' } },
        { id: 'wr-wri-3', title: 'Grants & Research Proposals', description: 'Frame questions, justify budgets and write compelling funding proposals.', resource: { label: 'Proposal Writing - Coursera', url: 'https://www.coursera.org/search?query=grant%20writing' } }
      ]}
    ],
    projects: [
      { id: 'wr-p1', title: 'Local Bird Observation Report', level: 'Beginner', skills: ['Field Research', 'Data Analysis'], description: 'Choose one local bird species. Observe it for 7 days (15 min/day), log date, time, weather, behavior and interactions. Write a 2-page structured observation report.', steps: ['Pick a species and observation spot', 'Create a daily log template', 'Observe and record for 7 days', 'Summarize behavior patterns', 'Write the report with photos/sketches'] },
      { id: 'wr-p2', title: 'Backyard Biodiversity Survey', level: 'Beginner', skills: ['Ecology', 'Species Identification'], description: 'Catalog every species you can find within a 50m radius of your home over one weekend. Produce a diversity table and classify species by group.', steps: ['Define your 50m survey zone', 'Survey plants, insects, birds and mammals', 'Identify species using iNaturalist', 'Build a diversity table', 'Present findings with photos'] },
      { id: 'wr-p3', title: 'Camera-Trap Activity Analysis', level: 'Intermediate', skills: ['Data Analysis', 'Field Research'], description: 'Use a public camera-trap dataset, plot species activity by hour of day, and write a short results summary with 2 charts.', steps: ['Download a dataset from a public portal', 'Clean and structure the data', 'Plot activity histograms in R/Python/Sheets', 'Write a 1-page results summary', 'Share your charts'] },
      { id: 'wr-p4', title: 'Mini Conservation Proposal', level: 'Advanced', skills: ['Research Writing', 'Conservation Ecology'], description: 'Identify a threatened local species or habitat and draft a 1-page conservation proposal: problem, evidence, actions, budget, outcomes.', steps: ['Select a target species/habitat', 'Gather evidence (status, threats)', 'Design 3 concrete actions', 'Draft budget and timeline', 'Write and format the proposal'] }
    ]
  },

  'graphic-designer': {
    id: 'graphic-designer',
    name: 'Graphic Designer',
    tagline: 'Communicate ideas through visual design, branding and digital media.',
    skills: [
      { id: 'gd-fundamentals', name: 'Design Fundamentals', topics: [
        { id: 'gd-fun-1', title: 'Color Theory', description: 'Hue, saturation, value, complementary palettes and emotional impact of color.', resource: { label: 'Color Theory - Canva Design School', url: 'https://www.canva.com/colors/color-wheel/' } },
        { id: 'gd-fun-2', title: 'Typography', description: 'Typefaces, hierarchy, pairing, kerning and readable, expressive text layout.', resource: { label: 'Google Fonts - Type Specimens', url: 'https://fonts.google.com/' } },
        { id: 'gd-fun-3', title: 'Layout & Composition', description: 'Grids, whitespace, alignment, contrast and visual flow that guide the eye.', resource: { label: 'Design Principles - Nielsen Norman', url: 'https://www.nngroup.com/articles/design-principles/' } }
      ]},
      { id: 'gd-tools', name: 'Visual Tools', topics: [
        { id: 'gd-too-1', title: 'Figma Essentials', description: 'Frames, components, auto-layout and prototyping for modern UI design.', resource: { label: 'Figma Learn - Official Tutorials', url: 'https://help.figma.com/hc/en-us' } },
        { id: 'gd-too-2', title: 'Adobe Illustrator Basics', description: 'Vectors, pen tool, shapes and logo construction.', resource: { label: 'Illustrator Tutorials - Adobe', url: 'https://helpx.adobe.com/illustrator/tutorials.html' } },
        { id: 'gd-too-3', title: 'Photoshop Fundamentals', description: 'Layers, masks, retouching and preparing images for print and web.', resource: { label: 'Photoshop Tutorials - Adobe', url: 'https://helpx.adobe.com/photoshop/tutorials.html' } }
      ]},
      { id: 'gd-branding', name: 'Branding', topics: [
        { id: 'gd-bra-1', title: 'Logo Design Process', description: 'Brief, research, sketching, concepting and refining a mark that works at any size.', resource: { label: 'Logo Design - YouTube (Satori Graphics)', url: 'https://www.youtube.com/results?search_query=logo+design+process' } },
        { id: 'gd-bra-2', title: 'Brand Identity Systems', description: 'Build a full identity: logo, palette, type system, imagery style and voice.', resource: { label: 'Brand Guidelines Examples', url: 'https://www.behance.net/search/projects?field=branding' } },
        { id: 'gd-bra-3', title: 'Brand Guidelines', description: 'Document usage rules so any team can apply a brand consistently.', resource: { label: 'Behance - Branding Case Studies', url: 'https://www.behance.net/' } }
      ]},
      { id: 'gd-uiux', name: 'UI/UX Design', topics: [
        { id: 'gd-uix-1', title: 'User Research Basics', description: 'Interviews, surveys and personas that ground design in real user needs.', resource: { label: 'NN/g - UX Research Articles', url: 'https://www.nngroup.com/topic/research-methods/' } },
        { id: 'gd-uix-2', title: 'Wireframing & Prototyping', description: 'Low-fi sketches to clickable prototypes that test ideas fast.', resource: { label: 'Figma - Prototyping Guide', url: 'https://help.figma.com/hc/en-us/articles/360040314193' } },
        { id: 'gd-uix-3', title: 'Usability Testing', description: 'Plan and run tests, observe behavior and iterate on findings.', resource: { label: 'Usability.gov - Testing Methods', url: 'https://www.usability.gov/how-to-and-tools/methods/index.html' } }
      ]},
      { id: 'gd-freelance', name: 'Portfolio & Freelancing', topics: [
        { id: 'gd-fre-1', title: 'Building a Design Portfolio', description: 'Curate 4-6 strong case studies with process, not just final images.', resource: { label: 'Behance - Portfolio Inspiration', url: 'https://www.behance.net/' } },
        { id: 'gd-fre-2', title: 'Pricing Your Work', description: 'Hourly vs project pricing, value-based pricing and writing winning quotes.', resource: { label: 'Pricing Design - Fast Company', url: 'https://www.fastcompany.com/' } },
        { id: 'gd-fre-3', title: 'Client Communication', description: 'Briefs, feedback rounds, boundaries and delivering professional presentations.', resource: { label: 'Client Workflows - Creative Boom', url: 'https://www.creativeboom.com/' } }
      ]}
    ],
    projects: [
      { id: 'gd-p1', title: 'Personal Logo & Brand Sheet', level: 'Beginner', skills: ['Design Fundamentals', 'Branding'], description: 'Design a personal logo, then build a one-page brand sheet: primary logo, monochrome version, color palette and type pairing.', steps: ['Write a mini creative brief', 'Sketch 10+ concepts on paper', 'Refine the strongest 2 in vector', 'Choose palette and fonts', 'Assemble the brand sheet'] },
      { id: 'gd-p2', title: 'Event Poster Series', level: 'Beginner', skills: ['Layout & Composition', 'Typography'], description: 'Design 3 posters for one campus event as a consistent visual system with varied layouts.', steps: ['Pick a real campus event', 'Define grid and type system', 'Design poster 1 (image-led)', 'Design poster 2 (type-led)', 'Design poster 3 (experimental)'] },
      { id: 'gd-p3', title: 'App Onboarding Screens', level: 'Intermediate', skills: ['UI/UX Design', 'Figma'], description: 'Design 3 onboarding screens for a student-focused app in Figma with a clickable prototype.', steps: ['Define the app concept and users', 'Write onboarding copy', 'Wireframe 3 screens', 'Design hi-fi screens with components', 'Prototype and share the link'] },
      { id: 'gd-p4', title: 'Redesign Challenge', level: 'Advanced', skills: ['UI/UX Design', 'Research Writing'], description: 'Find a poster, flyer or webpage with poor design, redesign it, and write a rationale comparing before/after.', steps: ['Choose a weak design', 'Audit the problems (contrast, hierarchy)', 'Redesign following principles', 'Document before/after with notes', 'Publish as a case study'] }
    ]
  },

  'developer': {
    id: 'developer',
    name: 'Developer',
    tagline: 'Build software, apps and systems that solve real problems.',
    skills: [
      { id: 'dev-programming', name: 'Programming Basics', topics: [
        { id: 'dev-pro-1', title: 'Python Fundamentals', description: 'Variables, control flow, functions, data structures and file handling in Python.', resource: { label: 'Python.org - Official Tutorial', url: 'https://docs.python.org/3/tutorial/' } },
        { id: 'dev-pro-2', title: 'JavaScript Essentials', description: 'The language of the web: DOM, events, fetch and modern ES6+ syntax.', resource: { label: 'MDN - JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' } },
        { id: 'dev-pro-3', title: 'Git & Version Control', description: 'Commits, branches, merges, pull requests and collaborating on GitHub.', resource: { label: 'GitHub Skills - Free Courses', url: 'https://skills.github.com/' } }
      ]},
      { id: 'dev-web', name: 'Web Development', topics: [
        { id: 'dev-web-1', title: 'HTML & CSS', description: 'Semantic HTML, responsive CSS, flexbox and grid layouts.', resource: { label: 'freeCodeCamp - Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/' } },
        { id: 'dev-web-2', title: 'Frontend with React Basics', description: 'Components, props, state and hooks to build interactive UIs.', resource: { label: 'React.dev - Official Learn', url: 'https://react.dev/learn' } },
        { id: 'dev-web-3', title: 'Backend APIs with Node/Express', description: 'Build REST APIs: routing, JSON, middleware and connecting a database.', resource: { label: 'Express.js - Official Guide', url: 'https://expressjs.com/en/guide/routing.html' } }
      ]},
      { id: 'dev-databases', name: 'Databases', topics: [
        { id: 'dev-db-1', title: 'SQL Fundamentals', description: 'SELECT, JOIN, GROUP BY and writing queries that answer real questions.', resource: { label: 'SQLBolt - Interactive Lessons', url: 'https://sqlbolt.com/' } },
        { id: 'dev-db-2', title: 'Database Design', description: 'Entities, relationships, normalization and drawing ER diagrams.', resource: { label: 'DBDesigner - Visual Schema Tool', url: 'https://dbdesigner.id/' } },
        { id: 'dev-db-3', title: 'Working with NoSQL', description: 'Documents, collections and when a flexible schema beats tables.', resource: { label: 'MongoDB University - Free Courses', url: 'https://university.mongodb.com/' } }
      ]},
      { id: 'dev-problemsolving', name: 'Problem Solving', topics: [
        { id: 'dev-ps-1', title: 'Data Structures Basics', description: 'Arrays, lists, stacks, queues, hash maps and trees - what to use when.', resource: { label: 'Visualgo - Data Structure Visualizer', url: 'https://visualgo.net/en' } },
        { id: 'dev-ps-2', title: 'Algorithms Thinking', description: 'Sorting, searching, complexity (Big-O) and breaking problems into steps.', resource: { label: 'LeetCode - Explore Problems', url: 'https://leetcode.com/problemset/all/' } },
        { id: 'dev-ps-3', title: 'Debugging Skills', description: 'Read error traces, use breakpoints, log strategically and isolate bugs fast.', resource: { label: 'MDN - Debugging JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_went_wrong' } }
      ]},
      { id: 'dev-practices', name: 'Software Practices', topics: [
        { id: 'dev-sp-1', title: 'Testing Basics', description: 'Unit tests, integration tests and writing testable code.', resource: { label: 'Testing - freeCodeCamp', url: 'https://www.freecodecamp.org/news/software-testing/' } },
        { id: 'dev-sp-2', title: 'Agile & Teamwork', description: 'Sprints, standups, tickets and code review culture.', resource: { label: 'Agile Manifesto - Principles', url: 'https://agilemanifesto.org/principles.html' } },
        { id: 'dev-sp-3', title: 'Deployment & DevOps Intro', description: 'Environments, CI basics and shipping your app to the cloud.', resource: { label: 'Render Docs - Deploying Web Apps', url: 'https://render.com/docs' } }
      ]}
    ],
    projects: [
      { id: 'dev-p1', title: 'Personal Portfolio Website', level: 'Beginner', skills: ['HTML & CSS', 'Git'], description: 'Build and publish a responsive personal portfolio website (about, projects, contact) with a working contact section.', steps: ['Design the page structure', 'Build with semantic HTML + CSS', 'Make it responsive', 'Add a contact form', 'Deploy to GitHub Pages/Netlify'] },
      { id: 'dev-p2', title: 'Task Manager App', level: 'Beginner', skills: ['JavaScript', 'DOM'], description: 'Build a CRUD task app with local storage: add, complete, delete, filter tasks, dark mode.', steps: ['Build the UI layout', 'Implement add/complete/delete', 'Add filters (all/active/done)', 'Persist to localStorage', 'Polish styling and test'] },
      { id: 'dev-p3', title: 'Weather Dashboard', level: 'Intermediate', skills: ['APIs', 'JavaScript'], description: 'Build a dashboard that fetches live weather from a public API with search, units toggle and 5-day forecast.', steps: ['Get a free API key (OpenWeather)', 'Fetch and parse JSON', 'Render current conditions', 'Add forecast cards', 'Handle errors gracefully'] },
      { id: 'dev-p4', title: 'Algorithm Visualizer', level: 'Advanced', skills: ['Data Structures', 'JavaScript'], description: 'Animate sorting algorithms (bubble, merge, quick) with adjustable speed and array size.', steps: ['Render bars from an array', 'Implement swap/step engine', 'Add bubble sort animation', 'Add merge sort animation', 'Add speed & size controls'] }
    ]
  },

  'entrepreneur': {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    tagline: 'Turn ideas into viable businesses and lead ventures to growth.',
    skills: [
      { id: 'ent-fundamentals', name: 'Business Fundamentals', topics: [
        { id: 'ent-fun-1', title: 'Business Models', description: 'Revenue streams, cost structures and the Business Model Canvas.', resource: { label: 'Strategyzer - BMC Explainer', url: 'https://www.strategyzer.com/library/the-business-model-canvas' } },
        { id: 'ent-fun-2', title: 'Market Research', description: 'Size a market, segment customers and validate demand with data.', resource: { label: 'Google Trends - Research Tool', url: 'https://trends.google.com/' } },
        { id: 'ent-fun-3', title: 'Value Proposition', description: 'Define the unique value you deliver and communicate it in one sentence.', resource: { label: 'Value Prop Canvas - Strategyzer', url: 'https://www.strategyzer.com/library/the-value-proposition-canvas' } }
      ]},
      { id: 'ent-product', name: 'Product Development', topics: [
        { id: 'ent-pro-1', title: 'Building an MVP', description: 'Scope the smallest testable version of your product and ship it fast.', resource: { label: 'Y Combinator - Startup School', url: 'https://www.startupschool.org/' } },
        { id: 'ent-pro-2', title: 'Product-Market Fit', description: 'Signals, retention and iterating until users truly need your product.', resource: { label: 'a16z - PMF Articles', url: 'https://a16z.com/' } },
        { id: 'ent-pro-3', title: 'Iteration & Feedback Loops', description: 'Collect feedback systematically and prioritize what to build next.', resource: { label: 'The Mom Test - Summary', url: 'https://www.momtestbook.com/' } }
      ]},
      { id: 'ent-marketing', name: 'Marketing', topics: [
        { id: 'ent-mar-1', title: 'Digital Marketing Basics', description: 'Funnels, SEO, email and paid acquisition fundamentals.', resource: { label: 'Google Digital Garage - Free Course', url: 'https://learndigital.withgoogle.com/digitalgarage' } },
        { id: 'ent-mar-2', title: 'Social Media Strategy', description: 'Pick platforms, plan content and grow an audience with consistency.', resource: { label: 'Hootsuite - Social Strategy Guide', url: 'https://blog.hootsuite.com/' } },
        { id: 'ent-mar-3', title: 'Content Marketing', description: 'Tell stories that attract customers: blogs, video, case studies.', resource: { label: 'HubSpot Academy - Free Courses', url: 'https://academy.hubspot.com/' } }
      ]},
      { id: 'ent-finance', name: 'Finance Basics', topics: [
        { id: 'ent-fin-1', title: 'Startup Budgeting', description: 'Estimate costs, burn rate and runway for an early-stage venture.', resource: { label: 'Wave - Free Budget Templates', url: 'https://www.waveapps.com/' } },
        { id: 'ent-fin-2', title: 'Revenue Models', description: 'Subscriptions, marketplaces, freemium - choose how you make money.', resource: { label: 'Revenue Model Patterns', url: 'https://www.simplywall.st/' } },
        { id: 'ent-fin-3', title: 'Fundraising Basics', description: 'Bootstrapping, grants, angels and venture capital - what fits your stage.', resource: { label: 'Y Combinator - Funding Guides', url: 'https://www.ycombinator.com/library' } }
      ]},
      { id: 'ent-leadership', name: 'Leadership & Pitching', topics: [
        { id: 'ent-lea-1', title: 'Team Building', description: 'Recruit cofounders, define roles and build a culture that executes.', resource: { label: 'First Round Review - Team Articles', url: 'https://review.firstround.com/' } },
        { id: 'ent-lea-2', title: 'Public Speaking', description: 'Structure talks, control nerves and deliver with clarity.', resource: { label: 'TED - Speaker Guide', url: 'https://www.ted.com/about/programs-initiatives/ted-talks' } },
        { id: 'ent-lea-3', title: 'Pitch Decks', description: 'Build a 10-slide deck: problem, solution, market, traction, team, ask.', resource: { label: 'Pitch Deck Examples - Attach.io', url: 'https://attach.io/blog/startup-pitch-decks' } }
      ]}
    ],
    projects: [
      { id: 'ent-p1', title: 'Problem Interview Sprint', level: 'Beginner', skills: ['Market Research'], description: 'Pick a problem you care about, interview 5 real people, and synthesize insights into a findings report.', steps: ['Define the problem hypothesis', 'Write a 6-question interview script', 'Interview 5 people and record notes', 'Synthesize pain points and quotes', 'Write a 1-page findings report'] },
      { id: 'ent-p2', title: 'One-Page Business Model', level: 'Beginner', skills: ['Business Fundamentals'], description: 'Complete a Lean Canvas for a startup idea, including riskiest assumption and first test.', steps: ['Choose an idea', 'Fill all 9 Lean Canvas blocks', 'Identify the riskiest assumption', 'Design a 1-week validation test', 'Document your canvas and test plan'] },
      { id: 'ent-p3', title: 'Landing Page MVP', level: 'Intermediate', skills: ['Product Development', 'Marketing'], description: 'Build a real landing page with a waitlist form for your idea and drive 50 visitors to it.', steps: ['Write the headline & value prop', 'Build the page (no-code or coded)', 'Add a working waitlist form', 'Share in 3 communities', 'Measure signups and iterate'] },
      { id: 'ent-p4', title: '3-Minute Pitch Video', level: 'Advanced', skills: ['Leadership & Pitching'], description: 'Write, record and publish a 3-minute pitch for your venture and collect structured peer feedback.', steps: ['Draft the 10-slide deck', 'Script a 3-minute talk', 'Record the pitch on video', 'Gather feedback from 5 peers', 'Revise and republish'] }
    ]
  }
};

const PEOPLE = [
  { id: 'p1', type: 'mentor', name: 'Dr. Ananya Rao', role: 'Ecologist & Field Research Lead', career: 'wildlife-researcher', org: 'Wildlife Institute', bio: '12 years leading field research on endangered mammals across South Asia. Mentors students in ecology, field methods and research writing.', tags: ['Ecology', 'Field Research', 'Conservation'] },
  { id: 'p2', type: 'mentor', name: 'Marcus Chen', role: 'Senior Product Designer', career: 'graphic-designer', org: 'Studio North', bio: 'Designed brand systems for 30+ startups. Specializes in typography, design systems and portfolio coaching for juniors.', tags: ['Branding', 'Typography', 'Figma'] },
  { id: 'p3', type: 'mentor', name: 'Priya Sharma', role: 'Staff Software Engineer', career: 'developer', org: 'TechFlow', bio: 'Full-stack engineer who mentors first-time contributors into open source. Focus on web development and system design basics.', tags: ['Web Dev', 'Open Source', 'Careers'] },
  { id: 'p4', type: 'mentor', name: 'David Okafor', role: 'Serial Founder & Angel Investor', career: 'entrepreneur', org: 'Venture Lab', bio: 'Founded and exited two startups. Coaches early founders on validation, pitching and fundraising.', tags: ['Startups', 'Pitching', 'Fundraising'] },
  { id: 'p5', type: 'creator', name: 'The Field Notes', role: 'Wildlife Education Channel', career: 'wildlife-researcher', org: 'YouTube - 480K subscribers', bio: 'Weekly videos on animal behavior, field gear and career paths in wildlife science.', tags: ['Wildlife', 'Education', 'Fieldwork'] },
  { id: 'p6', type: 'creator', name: 'DesignWithMe', role: 'Design Tutorials & Critiques', career: 'graphic-designer', org: 'YouTube / Instagram', bio: 'Live design critiques and step-by-step tutorials on logos, posters and UI.', tags: ['Tutorials', 'Critiques', 'UI Design'] },
  { id: 'p7', type: 'creator', name: 'Code&Chill', role: 'Programming Education', career: 'developer', org: 'YouTube - 1.1M subscribers', bio: 'Project-based coding tutorials: from first website to full-stack apps.', tags: ['Coding', 'Projects', 'Tutorials'] },
  { id: 'p8', type: 'creator', name: 'Startup Diaries', role: 'Founder Podcast', career: 'entrepreneur', org: 'Podcast - Weekly', bio: 'Raw conversations with founders about failures, pivots and first customers.', tags: ['Startups', 'Podcast', 'Stories'] },
  { id: 'p9', type: 'learner', name: 'Riya Patel', role: 'Wildlife Research Learner - Level 3', career: 'wildlife-researcher', org: 'University of Pune', bio: 'Completing her ecology roadmap, working on a bird observation project. Open to study groups.', tags: ['Ecology', 'Birding', 'Study Group'] },
  { id: 'p10', type: 'learner', name: 'Arjun Mehta', role: 'Developer Learner - Level 2', career: 'developer', org: 'IIT Delhi', bio: 'Building his first full-stack app. Looking for hackathon teammates.', tags: ['JavaScript', 'Hackathons'] },
  { id: 'p11', type: 'learner', name: 'Sara Kim', role: 'Design Learner - Level 4', career: 'graphic-designer', org: 'RISD', bio: 'Finished her brand identity roadmap, building her portfolio. Happy to critique your work.', tags: ['Branding', 'Portfolio'] },
  { id: 'p12', type: 'learner', name: 'Tom Alvarez', role: 'Entrepreneurship Learner - Level 2', career: 'entrepreneur', org: 'ESADE', bio: 'Validating a campus-food startup idea. Looking for a technical cofounder.', tags: ['Validation', 'Cofounder'] },
  { id: 'p13', type: 'organization', name: 'Wildlife Trust Alliance', role: 'Conservation NGO', career: 'wildlife-researcher', org: 'Nonprofit', bio: 'Runs field internships, citizen-science programs and research grants for young ecologists.', tags: ['Internships', 'Grants', 'Fieldwork'] },
  { id: 'p14', type: 'organization', name: 'DesignHub Campus', role: 'Student Design Community', career: 'graphic-designer', org: 'University Network', bio: 'Weekly design jams, critique nights and a yearly national design challenge.', tags: ['Community', 'Events', 'Competitions'] },
  { id: 'p15', type: 'organization', name: 'Google Developer Groups', role: 'Developer Community', career: 'developer', org: 'Global Program', bio: 'Local chapters host dev talks, study jams and hackathons - free for students.', tags: ['Events', 'Hackathons', 'Learning'] },
  { id: 'p16', type: 'organization', name: 'University Venture Incubator', role: 'Startup Incubator', career: 'entrepreneur', org: 'University Program', bio: 'Provides workspace, seed grants and mentor networks for student-founded startups.', tags: ['Incubation', 'Funding', 'Mentorship'] }
];

const OPPORTUNITIES = [
  { id: 'o1', type: 'Internship', career: 'wildlife-researcher', title: 'Field Research Intern', org: 'Wildlife Trust Alliance', location: 'Western Ghats, India (Field + Remote)', duration: '3 months', stipend: 'INR 15,000 / month', deadline: '2026-10-15', description: 'Assist senior researchers with camera-trap surveys, species identification and data entry. Includes 2 weeks of intensive fieldwork and a final research presentation.', requirements: ['Basic ecology knowledge', 'Willingness to travel to field sites', 'Laptop with spreadsheet software', 'Completed at least 2 skills on your ELEVO roadmap'], applyTo: 'apply@wildlifetrust.example.org' },
  { id: 'o2', type: 'Research', career: 'wildlife-researcher', title: 'Urban Biodiversity Research Program', org: 'City University Biology Dept', location: 'Hybrid - Your City', duration: '6 months', stipend: 'Certificate + Publication credit', deadline: '2026-11-01', description: 'Join a citizen-science study cataloging urban wildlife. You will design surveys, collect data in your neighborhood and co-author a public dataset.', requirements: ['Completed Ecology skill track', 'A biodiversity survey project in your portfolio', 'Weekly 2-hour commitment'], applyTo: 'biodiversity@cityuniversity.example.edu' },
  { id: 'o3', type: 'Competition', career: 'wildlife-researcher', title: 'National Campus Bird Count', org: 'BirdWatch Network', location: 'Your Campus', duration: '1 month', stipend: 'Trophies + research equipment prizes', deadline: '2026-10-05', description: 'Teams of 2-4 document bird species on campus. Judged on data quality, species count and a final report.', requirements: ['Team of 2-4 students', 'Species identification basics', 'Registration before deadline'], applyTo: 'register@birdwatchnet.example.org' },
  { id: 'o4', type: 'Internship', career: 'graphic-designer', title: 'Junior Visual Design Intern', org: 'Studio North', location: 'Remote', duration: '4 months', stipend: 'INR 20,000 / month', deadline: '2026-10-20', description: 'Work with senior designers on brand identities, social media kits and client presentations. Weekly mentorship sessions included.', requirements: ['Figma proficiency', 'A portfolio with 3+ projects', 'Strong typography fundamentals'], applyTo: 'talent@studionorth.example.com' },
  { id: 'o5', type: 'Competition', career: 'graphic-designer', title: 'National Design Challenge: Design for Good', org: 'DesignHub Campus', location: 'Online', duration: '3 weeks', stipend: 'INR 50,000 prize pool + internships', deadline: '2026-10-10', description: 'Design a campaign for a social cause you care about. Deliverables: poster series + social kit + rationale document.', requirements: ['Individual or pair entry', 'Original work only', 'Submission via Behance link'], applyTo: 'challenge@designhub.example.org' },
  { id: 'o6', type: 'Collaboration', career: 'developer', title: 'Open Source Summer of Code', org: 'Code Collective Foundation', location: 'Remote', duration: '3 months', stipend: 'Mentorship + Swag + Certificate', deadline: '2026-10-01', description: 'Contribute to real open-source projects with a dedicated mentor. Beginner-friendly issues labeled for first-time contributors.', requirements: ['Git basics', 'One completed coding project', 'Weekly time commitment'], applyTo: 'programs@codecollective.example.org' },
  { id: 'o7', type: 'Project', career: 'developer', title: 'Campus Utility App - Paid Build', org: 'Student Union', location: 'On-campus', duration: '2 months', stipend: 'INR 30,000 fixed fee', deadline: '2026-09-30', description: 'Build a room-booking and events app for your campus. Work with a student designer and a faculty advisor.', requirements: ['Web development skills', 'Portfolio with at least 2 projects', 'Availability for weekly demos'], applyTo: 'tech@studentunion.example.edu' },
  { id: 'o8', type: 'Collaboration', career: 'entrepreneur', title: '6-Week Startup Bootcamp', org: 'University Venture Incubator', location: 'Hybrid', duration: '6 weeks', stipend: 'Top teams receive INR 1,00,000 seed grant', deadline: '2026-10-08', description: 'Weekly sprints: validation, MVP, marketing, finance and demo day. Ends with a pitch to real investors.', requirements: ['A team of 2-5', 'A problem you want to solve', 'Commitment to all 6 weekly sessions'], applyTo: 'bootcamp@uvincubator.example.edu' },
  { id: 'o9', type: 'Competition', career: 'entrepreneur', title: 'National Student Entrepreneurship Cup', org: 'Startup Nation Alliance', location: 'National Finals - Mumbai', duration: '2 rounds + finals', stipend: 'INR 5,00,000 total prizes', deadline: '2026-11-15', description: 'Pitch your venture in regional qualifiers and national finals. Tracks: tech, social impact and sustainability.', requirements: ['Working prototype or traction preferred', '3-minute pitch video for qualifiers', 'Team of 1-5 students'], applyTo: 'cup@startupnation.example.org' },
  { id: 'o10', type: 'Internship', career: 'developer', title: 'Frontend Engineering Intern', org: 'TechFlow', location: 'Remote', duration: '6 months', stipend: 'INR 35,000 / month', deadline: '2026-10-25', description: 'Ship UI features in React, write tests and pair with senior engineers. Conversion to full-time possible.', requirements: ['HTML/CSS/JavaScript solid', 'React basics', 'GitHub profile with projects'], applyTo: 'careers@techflow.example.com' }
];

/* ============================= DATABASE ============================= */

const DEFAULT_DB = {
  goal: null,
  completedTopics: [],
  startedProjects: [],
  completedProjects: [],
  portfolio: [],
  certificates: [],
  connections: [],
  chat: []
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return Object.assign({}, DEFAULT_DB, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
    }
  } catch (e) { console.error('DB read error, resetting:', e.message); }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveDB(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ============================= HELPERS ============================= */

function getCareer(db) { return db.goal ? CAREERS[db.goal] : null; }

function skillProgress(db, career) {
  return career.skills.map(s => {
    const topics = s.topics.map(t => ({ ...t, done: db.completedTopics.includes(t.id) }));
    const done = topics.filter(t => t.done).length;
    return { skill: { id: s.id, name: s.name }, topics, done, total: topics.length, pct: Math.round(done / topics.length * 100), complete: done === topics.length };
  });
}

function nextStep(db) {
  const career = getCareer(db);
  if (!career) return null;
  const sp = skillProgress(db, career);
  const incompleteSkill = sp.find(x => !x.complete);
  if (incompleteSkill) {
    const careerSkill = career.skills.find(s => s.id === incompleteSkill.skill.id);
    const topic = careerSkill.topics.find(t => !db.completedTopics.includes(t.id));
    return { phase: 'LEARN', label: 'Learn: ' + topic.title + ' (' + incompleteSkill.skill.name + ')', topicId: topic.id, skillId: incompleteSkill.skill.id };
  }
  const incompleteProject = career.projects.find(p => !db.completedProjects.includes(p.id));
  if (incompleteProject) {
    return { phase: 'PRACTICE', label: 'Practice: ' + incompleteProject.title, projectId: incompleteProject.id };
  }
  return { phase: 'CONNECT', label: 'Connect with a mentor and apply to opportunities', };
}

/* ============================= AI MENTOR ============================= */

function mentorReply(db, message) {
  const career = getCareer(db);
  const m = message.toLowerCase();
  const has = (...words) => words.some(w => m.includes(w));

  if (has('hello', 'hi', 'hey', 'namaste') && m.length < 25) {
    return 'Hey! I am your ELEVO AI Mentor. Ask me what to learn next, how to improve a skill, which project to build, or what opportunities match your goal.';
  }
  if (has('what should i learn', 'next', 'roadmap', 'where do i start', 'what to learn')) {
    if (!career) return 'First, choose a career goal on the Goal screen - then I can map out your next step.';
    const step = nextStep(db);
    return 'Based on your ' + career.name + ' roadmap, your next step is: "' + step.label + '". Open the Learn tab and mark it complete when done - your progress saves automatically.';
  }
  if (has('improve', 'better', 'tips', 'advice', 'how can i')) {
    const skillMatch = career ? career.skills.find(s => m.includes(s.name.toLowerCase().split(' ')[0].toLowerCase())) : null;
    if (skillMatch) {
      const topic = skillMatch.topics.find(t => !db.completedTopics.includes(t.id));
      return 'To improve your ' + skillMatch.name + ': ' + (topic ? 'start with "' + topic.title + '" (' + topic.resource.label + '). ' : 'revise the topics you have completed. ') + 'Then apply it in a practice project - real output beats passive reading.';
    }
    return 'Pick one skill from your roadmap, finish its next topic today, and apply it in a small project this week. Consistent daily practice beats weekend cramming. Which skill do you want to improve?';
  }
  if (has('project', 'practice', 'build', 'portfolio')) {
    if (!career) return 'Choose a career goal first - then I will suggest projects that build your portfolio.';
    const proj = career.projects.find(p => !db.completedProjects.includes(p.id));
    return proj
      ? 'Your next portfolio project: "' + proj.title + '" (' + proj.level + '). ' + proj.description + ' Find it under Practice - completing it adds it to your portfolio with a certificate.'
      : 'You have completed every project on this roadmap. Add your own project manually in the Portfolio tab, or apply to an opportunity to use your skills for real.';
  }
  if (has('opportunit', 'intern', 'job', 'apply', 'competition')) {
    if (!career) return 'Set a career goal and I will point you to matching internships, competitions and research programs.';
    const ops = OPPORTUNITIES.filter(o => o.career === career.id);
    return 'Opportunities matching ' + career.name + ': ' + ops.map((o, i) => (i + 1) + ') ' + o.title + ' - ' + o.org + ' (' + o.type + ')').join('; ') + '. Full details are under the Opportunities tab.';
  }
  if (has('stuck', 'motivat', 'tired', 'hard', 'give up', 'confused')) {
    return 'Everyone hits a wall - the fix is shrinking the task. Do just ONE topic today (15-20 min), then mark it complete. Small wins compound. I am tracking your progress and it is saved.';
  }
  if (has('progress', 'how am i doing', 'dashboard')) {
    if (!career) return 'Choose a career goal to start tracking progress.';
    const sp = skillProgress(db, career);
    const doneSkills = sp.filter(x => x.complete).length;
    return 'Progress check: ' + doneSkills + '/' + career.skills.length + ' skills complete, ' + db.completedProjects.length + ' projects done, ' + db.portfolio.length + ' portfolio items, ' + db.certificates.length + ' certificates. Open the Dashboard for the full picture.';
  }
  if (career) {
    const step = nextStep(db);
    return 'Here is what I would focus on: "' + step.label + '". You can also ask me about improving a specific skill, practice projects, or opportunities.';
  }
  return 'I can help with your learning journey. Try asking: "What should I learn next?", "How can I improve my skills?", "Suggest a project" or "Show opportunities".';
}

/* ============================= HTTP ============================= */

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function requireGoal(db, res) {
  if (!db.goal) { sendJSON(res, 400, { error: 'Choose a career goal first.' }); return false; }
  return true;
}

async function handleApi(req, res, pathname) {
  const db = loadDB();
  const method = req.method;
  const parts = pathname.split('/').filter(Boolean);

  // GET /api/careers
  if (method === 'GET' && pathname === '/api/careers') {
    return sendJSON(res, 200, Object.values(CAREERS).map(c => ({ id: c.id, name: c.name, tagline: c.tagline, skillCount: c.skills.length, projectCount: c.projects.length })));
  }

  // GET /api/careers/:id
  if (method === 'GET' && parts[1] === 'careers' && parts[2]) {
    const c = CAREERS[parts[2]];
    return c ? sendJSON(res, 200, c) : sendJSON(res, 404, { error: 'Career not found.' });
  }

  // POST /api/goal  {careerId}
  if (method === 'POST' && pathname === '/api/goal') {
    const body = await readBody(req);
    if (!CAREERS[body.careerId]) return sendJSON(res, 400, { error: 'Unknown career.' });
    if (db.goal !== body.careerId) {
      db.goal = body.careerId;
      db.completedTopics = []; db.startedProjects = []; db.completedProjects = [];
      db.portfolio = []; db.certificates = [];
      db.chat.push({ role: 'mentor', text: 'New goal set: ' + CAREERS[body.careerId].name + '. I have reset your progress and rebuilt your roadmap. Your next step is ready in the Learn tab.', time: Date.now() });
    }
    saveDB(db);
    return sendJSON(res, 200, { ok: true, goal: db.goal });
  }

  // GET /api/goal
  if (method === 'GET' && pathname === '/api/goal') {
    return sendJSON(res, 200, { goal: db.goal, career: getCareer(db) });
  }

  // GET /api/progress  (full state for the active goal)
  if (method === 'GET' && pathname === '/api/progress') {
    if (!requireGoal(db, res)) return;
    const career = getCareer(db);
    return sendJSON(res, 200, {
      career,
      goal: db.goal,
      skills: skillProgress(db, career),
      projects: career.projects.map(p => ({
        project: p,
        started: db.startedProjects.includes(p.id),
        completed: db.completedProjects.includes(p.id)
      })),
      nextStep: nextStep(db),
      portfolioCount: db.portfolio.length,
      certificateCount: db.certificates.length,
      connectionCount: db.connections.length
    });
  }

  // POST /api/topic/:topicId/complete  {complete}
  if (method === 'POST' && parts[1] === 'topic' && parts[2] && parts[3] === 'complete') {
    if (!requireGoal(db, res)) return;
    const body = await readBody(req);
    const career = getCareer(db);
    let found = null;
    for (const s of career.skills) { const t = s.topics.find(x => x.id === parts[2]); if (t) found = { skill: s, topic: t }; }
    if (!found) return sendJSON(res, 404, { error: 'Topic not found.' });
    const idx = db.completedTopics.indexOf(parts[2]);
    if (body.complete && idx === -1) db.completedTopics.push(parts[2]);
    if (!body.complete && idx !== -1) db.completedTopics.splice(idx, 1);
    saveDB(db);
    const sp = skillProgress(db, career).find(x => x.skill.id === found.skill.id);
    return sendJSON(res, 200, { ok: true, skill: { id: found.skill.id, done: sp.done, total: sp.total, pct: sp.pct, complete: sp.complete }, nextStep: nextStep(db) });
  }

  // POST /api/project/:projectId/start
  if (method === 'POST' && parts[1] === 'project' && parts[2] && parts[3] === 'start') {
    if (!requireGoal(db, res)) return;
    const career = getCareer(db);
    const p = career.projects.find(x => x.id === parts[2]);
    if (!p) return sendJSON(res, 404, { error: 'Project not found.' });
    if (!db.startedProjects.includes(p.id)) db.startedProjects.push(p.id);
    saveDB(db);
    return sendJSON(res, 200, { ok: true, started: true });
  }

  // POST /api/project/:projectId/complete
  if (method === 'POST' && parts[1] === 'project' && parts[2] && parts[3] === 'complete') {
    if (!requireGoal(db, res)) return;
    const career = getCareer(db);
    const p = career.projects.find(x => x.id === parts[2]);
    if (!p) return sendJSON(res, 404, { error: 'Project not found.' });
    if (!db.completedProjects.includes(p.id)) {
      db.completedProjects.push(p.id);
      if (!db.portfolio.some(x => x.sourceProjectId === p.id)) {
        db.portfolio.push({ id: 'pf-' + p.id, sourceProjectId: p.id, title: p.title, description: p.description, skills: p.skills, date: new Date().toISOString().slice(0, 10), origin: 'practice' });
      }
      db.certificates.push({ id: 'cert-' + p.id + '-' + Date.now(), title: p.title, issuer: 'ELEVO Academy', career: career.name, date: new Date().toISOString().slice(0, 10) });
    }
    saveDB(db);
    return sendJSON(res, 200, { ok: true, completed: true, nextStep: nextStep(db) });
  }

  // GET /api/portfolio
  if (method === 'GET' && pathname === '/api/portfolio') {
    return sendJSON(res, 200, { items: db.portfolio, certificates: db.certificates, career: getCareer(db) });
  }

  // POST /api/portfolio  {title, description, skills[]}
  if (method === 'POST' && pathname === '/api/portfolio') {
    const body = await readBody(req);
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    if (!title || !description) return sendJSON(res, 400, { error: 'Title and description are required.' });
    const skills = Array.isArray(body.skills) ? body.skills.map(s => String(s).trim()).filter(Boolean).slice(0, 6) : [];
    const item = { id: 'pf-custom-' + Date.now(), sourceProjectId: null, title, description, skills, date: new Date().toISOString().slice(0, 10), origin: 'manual' };
    db.portfolio.push(item);
    saveDB(db);
    return sendJSON(res, 200, { ok: true, item });
  }

  // DELETE /api/portfolio/:id
  if (method === 'DELETE' && parts[1] === 'portfolio' && parts[2]) {
    db.portfolio = db.portfolio.filter(x => x.id !== parts[2]);
    saveDB(db);
    return sendJSON(res, 200, { ok: true });
  }

  // GET /api/people?type=
  if (method === 'GET' && pathname === '/api/people') {
    const type = new URL(req.url, 'http://x').searchParams.get('type');
    const list = type ? PEOPLE.filter(p => p.type === type) : PEOPLE;
    return sendJSON(res, 200, { people: list.map(p => ({ ...p, connected: db.connections.includes(p.id) })) });
  }

  // POST /api/connect {personId}
  if (method === 'POST' && pathname === '/api/connect') {
    const body = await readBody(req);
    const person = PEOPLE.find(p => p.id === body.personId);
    if (!person) return sendJSON(res, 404, { error: 'Person not found.' });
    if (!db.connections.includes(person.id)) db.connections.push(person.id);
    saveDB(db);
    return sendJSON(res, 200, { ok: true, connected: db.connections.length });
  }

  // GET /api/opportunities?career=
  if (method === 'GET' && pathname === '/api/opportunities') {
    const careerQ = new URL(req.url, 'http://x').searchParams.get('career');
    const list = careerQ ? OPPORTUNITIES.filter(o => o.career === careerQ) : OPPORTUNITIES;
    return sendJSON(res, 200, { opportunities: list, careers: Object.values(CAREERS).map(c => ({ id: c.id, name: c.name })) });
  }

  // GET /api/opportunities/:id
  if (method === 'GET' && parts[1] === 'opportunities' && parts[2]) {
    const o = OPPORTUNITIES.find(x => x.id === parts[2]);
    return o ? sendJSON(res, 200, o) : sendJSON(res, 404, { error: 'Opportunity not found.' });
  }

  // POST /api/mentor {message}
  if (method === 'POST' && pathname === '/api/mentor') {
    const body = await readBody(req);
    const message = (body.message || '').trim();
    if (!message) return sendJSON(res, 400, { error: 'Type a message first.' });
    const reply = mentorReply(db, message);
    db.chat.push({ role: 'user', text: message, time: Date.now() });
    db.chat.push({ role: 'mentor', text: reply, time: Date.now() });
    db.chat = db.chat.slice(-60);
    saveDB(db);
    return sendJSON(res, 200, { reply, chat: db.chat });
  }

  // GET /api/mentor (chat history)
  if (method === 'GET' && pathname === '/api/mentor') {
    return sendJSON(res, 200, { chat: db.chat });
  }

  // GET /api/dashboard
  if (method === 'GET' && pathname === '/api/dashboard') {
    const career = getCareer(db);
    const sp = career ? skillProgress(db, career) : [];
    return sendJSON(res, 200, {
      career,
      goal: db.goal,
      skillsDone: sp.filter(x => x.complete).length,
      totalSkills: sp.length,
      topicsDone: db.completedTopics.length,
      totalTopics: career ? career.skills.reduce((a, s) => a + s.topics.length, 0) : 0,
      projectsDone: db.completedProjects.length,
      totalProjects: career ? career.projects.length : 0,
      portfolio: db.portfolio,
      certificates: db.certificates,
      connections: db.connections.length,
      skills: sp,
      nextStep: nextStep(db)
    });
  }

  // POST /api/reset
  if (method === 'POST' && pathname === '/api/reset') {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DB));
    saveDB(fresh);
    return sendJSON(res, 200, { ok: true });
  }

  return sendJSON(res, 404, { error: 'API route not found: ' + pathname });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    return serveStatic(req, res, pathname);
  } catch (e) {
    console.error(e);
    return sendJSON(res, 500, { error: 'Server error: ' + e.message });
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  E L E V O');
  console.log('  Your Skills. Real Opportunities.');
  console.log('');
  console.log('  Server running:  http://localhost:' + PORT);
  console.log('  Data stored in:  ' + DB_FILE);
  console.log('');
});
