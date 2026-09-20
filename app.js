/* ELEVO — Frontend SPA (vanilla JS, hash routing) */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const topbar = document.getElementById('topbar');
  const navGoal = document.getElementById('nav-goal');

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  async function api(path, opts) {
    const r = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || ('Request failed (' + r.status + ')'));
    return d;
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
  }

  function pageHead(kicker, title, sub) {
    return '<div class="page-head"><div class="page-kicker">' + esc(kicker) + '</div>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' +
      (sub ? '<p class="page-sub">' + esc(sub) + '</p>' : '') + '</div>';
  }

  function progressBar(pct, label) {
    return '<div class="progress" role="progressbar" aria-valuenow="' + pct + '"><div style="width:' + pct + '%"></div></div>' +
      (label ? '<span class="skill-pct">' + esc(label) + '</span>' : '');
  }

  function btn(id, text, cls) {
    return '<button id="' + id + '" class="btn ' + (cls || '') + '">' + esc(text) + '</button>';
  }

  function on(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

  /* ---------- nav / shell ---------- */
  async function syncShell() {
    let goal = null, career = null;
    try { const g = await api('/api/goal'); goal = g.goal; career = g.career; } catch (e) {}
    const publicRoute = ['welcome', 'goal'].includes(currentRoute());
    topbar.classList.toggle('hidden', !goal || publicRoute);
    navGoal.textContent = career ? career.name : '';
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.toggle('active', currentRoute().startsWith(a.dataset.nav));
    });
  }

  function currentRoute() {
    return (location.hash.replace(/^#\/?/, '') || 'welcome').split('?')[0];
  }

  /* ================= SCREEN 1: WELCOME ================= */
  async function renderWelcome() {
    app.innerHTML =
      '<section class="welcome">' +
        '<div class="welcome-logo">ELEVO<span>.</span></div>' +
        '<div class="welcome-tag">Your Skills. Real Opportunities.</div>' +
        '<p class="welcome-sub">Bridging the gap between skills and opportunities. One journey: pick a goal, learn, practice, build your portfolio, connect and land real opportunities.</p>' +
        '<div class="journey-strip">' +
          '<span>Goal</span><i>&rarr;</i><span>Learn</span><i>&rarr;</i><span>Practice</span><i>&rarr;</i><span>Build</span><i>&rarr;</i><span>Connect</span><i>&rarr;</i><span>Opportunity</span>' +
        '</div>' +
        '<div class="welcome-cta">' +
          '<a class="btn btn-solid" href="#/goal">Get Started</a>' +
          '<a class="btn" href="#/mentor">Ask AI Mentor</a>' +
        '</div>' +
      '</section>';
    await syncShell();
  }

  /* ================= SCREEN 2: CHOOSE GOAL ================= */
  async function renderGoal() {
    app.innerHTML = pageHead('Step 1 of your journey', 'Choose Your Goal', 'Pick the career you want to build toward. Your entire roadmap, practice projects and opportunities will be personalized to this goal.');
    const box = document.createElement('div');
    box.innerHTML =
      '<div class="filter-row"><input id="goal-search" class="search-input" type="text" placeholder="Search careers... (press Enter to explore more)">' +
      '<button id="explore-more" class="btn btn-small">Explore More</button></div>' +
      '<div id="goal-grid" class="grid grid-2"></div>';
    app.appendChild(box);

    const data = await api('/api/careers');
    const grid = document.getElementById('goal-grid');

    function draw(list) {
      grid.innerHTML = list.map(c =>
        '<div class="card clickable" data-career="' + esc(c.id) + '">' +
          '<div class="card-title">' + esc(c.name) + '</div>' +
          '<div class="card-text">' + esc(c.tagline) + '</div>' +
          '<div><span class="tag">' + c.skillCount + ' skills</span> <span class="tag">' + c.projectCount + ' projects</span></div>' +
          '<div class="card-foot"><button class="btn btn-small btn-solid" data-pick="' + esc(c.id) + '">Select Goal</button></div>' +
        '</div>'
      ).join('') || '<div class="empty">No careers match your search</div>';

      grid.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', async e => {
        e.stopPropagation();
        b.disabled = true;
        try {
          await api('/api/goal', { method: 'POST', body: { careerId: b.dataset.pick } });
          toast('Goal saved: ' + b.dataset.pick.replace(/-/g, ' '));
          location.hash = '#/roadmap';
        } catch (err) { toast(err.message); b.disabled = false; }
      }));
      grid.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => {
        const b = c.querySelector('[data-pick]'); if (b) b.click();
      }));
    }
    draw(data);

    const search = document.getElementById('goal-search');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      draw(data.filter(c => (c.name + ' ' + c.tagline).toLowerCase().includes(q)));
    });
    on('explore-more', () => { search.focus(); toast('Type to search and explore all career paths'); });
    await syncShell();
  }

  /* ================= SCREEN 3: ROADMAP ================= */
  async function renderRoadmap() {
    app.innerHTML = pageHead('Step 2 — Your personalized path', 'Your Roadmap', '');
    let data;
    try { data = await api('/api/progress'); }
    catch (e) { app.innerHTML += '<div class="empty">' + esc(e.message) + ' <a href="#/goal">Choose a goal</a></div>'; return syncShell(); }

    const phaseOrder = ['GOAL', 'LEARN', 'PRACTICE', 'BUILD', 'CONNECT', 'OPPORTUNITY'];
    const currentPhase = data.nextStep ? data.nextStep.phase : 'OPPORTUNITY';

    let html = '<div class="roadmap-flow">' + phaseOrder.map(p =>
      '<span class="' + (p === currentPhase ? 'current' : '') + '">' + p + '</span>'
    ).join('<i>&rarr;</i>') + '</div>';

    if (data.nextStep) {
      html += '<div class="next-step-bar"><strong>Recommended next step</strong><span>' + esc(data.nextStep.label) + '</span>' +
        (data.nextStep.phase === 'LEARN'
          ? '<a class="btn btn-small btn-solid" href="#/learn">Start Learning</a>'
          : data.nextStep.phase === 'PRACTICE'
            ? '<a class="btn btn-small btn-solid" href="#/practice">Start Project</a>'
            : '<a class="btn btn-small btn-solid" href="#/connect">Connect</a>') + '</div>';
    }

    html += data.skills.map((s, i) =>
      '<div class="skill-row" data-skill="' + esc(s.skill.id) + '">' +
        '<div class="skill-row-head">' +
          '<span class="skill-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
          progressBar(s.pct, s.done + '/' + s.total + ' topics') +
          (s.complete ? '<span class="badge-done">Done</span>' : '') +
        '</div>' +
        '<div class="skill-body">' +
          '<p class="card-text" style="margin-bottom:12px;">' + s.total + ' topics in this skill. Complete all topics to master it.</p>' +
          s.topics.map(t =>
            '<div class="topic" style="opacity:.75"><div class="topic-top"><span class="topic-title">' + esc(t.title) + '</span><a class="btn btn-small" href="' + esc(t.resource.url) + '" target="_blank" rel="noopener">Resource: ' + esc(t.resource.label) + '</a></div></div>'
          ).join('') +
          '<a class="btn btn-small btn-solid" href="#/learn">Open in Learn</a>' +
        '</div>' +
      '</div>'
    ).join('');

    app.innerHTML = html;
    document.querySelectorAll('.skill-row-head').forEach(h =>
      h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
    await syncShell();
  }

  /* ================= SCREEN 4: LEARN ================= */
  async function renderLearn() {
    app.innerHTML = pageHead('Step 3 — Skill up', 'Learn', 'Work through each topic, open the learning resource, then mark it complete. Your roadmap progress updates instantly and is saved.');
    let data;
    try { data = await api('/api/progress'); }
    catch (e) { app.innerHTML += '<div class="empty">' + esc(e.message) + ' <a href="#/goal">Choose a goal</a></div>'; return syncShell(); }

    const wrap = document.createElement('div');
    app.appendChild(wrap);

    async function draw() {
      const fresh = await api('/api/progress');
      wrap.innerHTML = fresh.skills.map((s, i) => {
        return '<div class="skill-row open" data-skill="' + esc(s.skill.id) + '">' +
          '<div class="skill-row-head" style="cursor:default">' +
            '<span class="skill-num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
            progressBar(s.pct, s.done + '/' + s.total) +
            (s.complete ? '<span class="badge-done">Skill Complete</span>' : '') +
          '</div>' +
          '<div class="skill-body" style="display:block">' +
            s.topics.map(t =>
              '<div class="topic ' + (t.done ? 'complete' : '') + '" data-topic="' + esc(t.id) + '">' +
                '<div class="topic-top"><span class="topic-title">' + esc(t.title) + '</span>' +
                (t.done ? '<span class="badge-done">Complete</span>' : '') + '</div>' +
                '<div class="topic-desc">' + esc(t.description) + '</div>' +
                '<div class="topic-actions">' +
                  '<a class="btn btn-small" href="' + esc(t.resource.url) + '" target="_blank" rel="noopener">Start Learning: ' + esc(t.resource.label) + '</a>' +
                  '<button class="btn btn-small ' + (t.done ? '' : 'btn-solid') + '" data-toggle="' + esc(t.id) + '">' + (t.done ? 'Undo' : 'Mark Complete') + '</button>' +
                '</div>' +
              '</div>'
            ).join('') +
          '</div>' +
        '</div>';
      }).join('');

      wrap.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        const row = wrap.querySelector('[data-topic="' + b.dataset.toggle + '"]');
        const willComplete = !row.classList.contains('complete');
        try {
          const r = await api('/api/topic/' + b.dataset.toggle + '/complete', { method: 'POST', body: { complete: willComplete } });
          toast(willComplete ? 'Topic complete — skill now ' + r.skill.pct + '%' : 'Topic unmarked');
          await draw();
        } catch (err) { toast(err.message); b.disabled = false; }
      }));
    }
    await draw();
    await syncShell();
  }

  /* ================= SCREEN 5: PRACTICE ================= */
  async function renderPractice() {
    app.innerHTML = pageHead('Step 4 — Apply your skills', 'Practice', 'Real projects that go into your portfolio. Start a project, follow the steps, then mark it completed to earn a certificate.');
    let data;
    try { data = await api('/api/progress'); }
    catch (e) { app.innerHTML += '<div class="empty">' + esc(e.message) + ' <a href="#/goal">Choose a goal</a></div>'; return syncShell(); }

    app.innerHTML += '<div class="grid grid-2">' + data.projects.map(({ project: p, started, completed }) =>
      '<div class="card" data-project="' + esc(p.id) + '">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;"><span class="tag tag-fill">' + esc(p.level) + '</span>' +
        (completed ? '<span class="badge-done">Completed</span>' : started ? '<span class="tag">In Progress</span>' : '') + '</div>' +
        '<div class="card-title">' + esc(p.title) + '</div>' +
        '<div class="card-text">' + esc(p.description) + '</div>' +
        '<div>' + p.skills.map(s => '<span class="tag">' + esc(s) + '</span>').join(' ') + '</div>' +
        '<ol class="steps">' + p.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
        '<div class="card-foot">' +
          '<button class="btn btn-small" data-start="' + esc(p.id) + '" ' + (started || completed ? 'disabled' : '') + '>' + (started && !completed ? 'Started' : 'Start Project') + '</button>' +
          '<button class="btn btn-small ' + (completed ? 'btn-done' : 'btn-solid') + '" data-complete="' + esc(p.id) + '" ' + (completed ? 'disabled' : '') + '>' + (completed ? 'Added to Portfolio' : 'Mark as Completed') + '</button>' +
        '</div>' +
      '</div>'
    ).join('') + '</div>';

    document.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        await api('/api/project/' + b.dataset.start + '/start', { method: 'POST' });
        toast('Project started — good luck!');
        renderPractice();
      } catch (err) { toast(err.message); b.disabled = false; }
    }));

    document.querySelectorAll('[data-complete]').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        await api('/api/project/' + b.dataset.complete + '/complete', { method: 'POST' });
        toast('Completed! Added to your portfolio with a certificate');
        renderPractice();
      } catch (err) { toast(err.message); b.disabled = false; }
    }));
    await syncShell();
  }

  /* ================= SCREEN 6: PORTFOLIO ================= */
  async function renderPortfolio() {
    app.innerHTML = pageHead('Step 5 — Show your work', 'My Portfolio', 'Completed practice projects appear here automatically. You can also add your own projects manually.');
    const wrap = document.createElement('div');
    app.appendChild(wrap);

    async function draw() {
      const d = await api('/api/portfolio');
      let html = '<div class="grid grid-4" style="margin-bottom:34px">' +
        '<div class="stat"><div class="stat-num">' + d.items.length + '</div><div class="stat-label">Portfolio Items</div></div>' +
        '<div class="stat"><div class="stat-num">' + d.certificates.length + '</div><div class="stat-label">Certificates</div></div>' +
        '<div class="stat"><div class="stat-num">' + (d.career ? d.career.skills.reduce((a, s) => a + s.topics.length, 0) : 0) + '</div><div class="stat-label">Topics on Roadmap</div></div>' +
        '<div class="stat"><div class="stat-num">' + (d.career ? d.career.name.split(' ')[0] : '—') + '</div><div class="stat-label">Career Goal</div></div>' +
      '</div>';

      html += '<h2 class="card-title" style="margin-bottom:14px">Projects</h2>';
      html += d.items.length ? '<div class="grid grid-2">' + d.items.map(i =>
        '<div class="card">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:start">' +
            '<div class="card-title">' + esc(i.title) + '</div>' +
            '<span class="tag">' + (i.origin === 'practice' ? 'Practice' : 'My Project') + '</span></div>' +
          '<div class="card-text">' + esc(i.description) + '</div>' +
          '<div>' + (i.skills || []).map(s => '<span class="tag">' + esc(s) + '</span>').join(' ') + '</div>' +
          '<div class="card-foot"><span class="card-text">Added ' + esc(i.date) + '</span>' +
          '<button class="btn btn-small btn-ghost" data-del="' + esc(i.id) + '">Remove</button></div>' +
        '</div>'
      ).join('') + '</div>' : '<div class="empty">No projects yet — finish a practice project or add one below</div>';

      html += '<h2 class="card-title" style="margin:34px 0 14px">Certificates & Achievements</h2>';
      html += d.certificates.length ? '<div class="grid grid-3">' + d.certificates.map(c =>
        '<div class="card" style="background:var(--soft)">' +
          '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px">Certificate of Completion</div>' +
          '<div class="card-title">' + esc(c.title) + '</div>' +
          '<div class="card-text">Issued by ' + esc(c.issuer) + ' &middot; ' + esc(c.career) + ' &middot; ' + esc(c.date) + '</div>' +
        '</div>'
      ).join('') + '</div>' : '<div class="empty">Complete a practice project to earn your first certificate</div>';

      html += '<h2 class="card-title" style="margin:34px 0 14px">Add Project</h2>' +
        '<div class="form-box"><form id="add-project-form">' +
          '<div class="field"><label for="pf-title">Project title</label><input id="pf-title" required maxlength="120" placeholder="e.g. Bird Count Web App"></div>' +
          '<div class="field"><label for="pf-desc">Description</label><textarea id="pf-desc" required maxlength="600" placeholder="What did you build or research? What was the outcome?"></textarea></div>' +
          '<div class="field"><label for="pf-skills">Skills used (comma separated)</label><input id="pf-skills" placeholder="e.g. Data Analysis, Python, Research Writing"></div>' +
          '<button class="btn btn-solid" type="submit">Add Project</button>' +
        '</form></div>';

      wrap.innerHTML = html;

      wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
        await api('/api/portfolio/' + b.dataset.del, { method: 'DELETE' });
        toast('Project removed');
        draw();
      }));

      document.getElementById('add-project-form').addEventListener('submit', async e => {
        e.preventDefault();
        const btnEl = e.target.querySelector('button');
        btnEl.disabled = true;
        try {
          await api('/api/portfolio', {
            method: 'POST',
            body: {
              title: document.getElementById('pf-title').value,
              description: document.getElementById('pf-desc').value,
              skills: document.getElementById('pf-skills').value.split(',').map(s => s.trim()).filter(Boolean)
            }
          });
          toast('Project added to portfolio');
          draw();
        } catch (err) { toast(err.message); btnEl.disabled = false; }
      });
    }
    await draw();
    await syncShell();
  }

  /* ================= SCREEN 7: CONNECT ================= */
  async function renderConnect() {
    app.innerHTML = pageHead('Step 6 — Grow your network', 'Connect', 'Mentors, creators, fellow learners and organizations matched to your career goal.');
    const types = [['all', 'Everyone'], ['mentor', 'Mentors'], ['creator', 'Creators'], ['learner', 'Learners'], ['organization', 'Organizations']];
    let activeType = 'all';

    const wrap = document.createElement('div');
    app.innerHTML += '<div class="filter-row" id="connect-filters">' + types.map(([v, l]) =>
      '<button class="btn btn-small ' + (v === 'all' ? 'active' : '') + '" data-type="' + v + '">' + l + '</button>').join('') + '</div>';
    app.appendChild(wrap);

    async function draw() {
      const d = await api('/api/people' + (activeType !== 'all' ? '?type=' + activeType : ''));
      const careerNames = {};
      wrap.innerHTML = '<div class="grid grid-3">' + d.people.map(p =>
        '<div class="card" data-person="' + esc(p.id) + '">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag tag-fill">' + esc(p.type) + '</span></div>' +
          '<div class="card-title">' + esc(p.name) + '</div>' +
          '<div class="card-text"><strong>' + esc(p.role) + '</strong><br>' + esc(p.org) + '</div>' +
          '<div class="card-text person-bio hidden">' + esc(p.bio) + '<br><br>' + p.tags.map(t => '<span class="tag">' + esc(t) + '</span>').join(' ') + '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-small" data-profile="' + esc(p.id) + '">View Profile</button>' +
            '<button class="btn btn-small ' + (p.connected ? 'btn-done' : 'btn-solid') + '" data-connect="' + esc(p.id) + '" ' + (p.connected ? 'disabled' : '') + '>' + (p.connected ? 'Connected' : 'Connect') + '</button>' +
          '</div>' +
        '</div>'
      ).join('') + '</div>';

      wrap.querySelectorAll('[data-profile]').forEach(b => b.addEventListener('click', () => {
        const bio = wrap.querySelector('[data-person="' + b.dataset.profile + '"] .person-bio');
        bio.classList.toggle('hidden');
      }));
      wrap.querySelectorAll('[data-connect]').forEach(b => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          const r = await api('/api/connect', { method: 'POST', body: { personId: b.dataset.connect } });
          toast('Connected — your network is growing (' + r.connected + ' total)');
          draw();
        } catch (err) { toast(err.message); b.disabled = false; }
      }));
    }

    document.querySelectorAll('#connect-filters [data-type]').forEach(b => b.addEventListener('click', () => {
      activeType = b.dataset.type;
      document.querySelectorAll('#connect-filters [data-type]').forEach(x => x.classList.toggle('active', x === b));
      draw();
    }));
    await draw();
    await syncShell();
  }

  /* ================= SCREEN 8: OPPORTUNITIES ================= */
  async function renderOpportunities() {
    app.innerHTML = pageHead('Final step — Real opportunities', 'Opportunities', 'Internships, research programs, competitions, projects and collaborations matched to your goal.');
    const types = [['all', 'All'], ['Internship', 'Internships'], ['Research', 'Research'], ['Project', 'Projects'], ['Competition', 'Competitions'], ['Collaboration', 'Collaborations']];
    let activeType = 'all';
    let all = [];

    const wrap = document.createElement('div');
    app.innerHTML += '<div class="filter-row" id="opp-filters">' + types.map(([v, l]) =>
      '<button class="btn btn-small ' + (v === 'all' ? 'active' : '') + '" data-type="' + v + '">' + l + '</button>').join('') + '</div>';
    app.appendChild(wrap);

    function draw() {
      const list = all.filter(o => activeType === 'all' || o.type === activeType);
      wrap.innerHTML = '<div class="grid grid-2">' + list.map(o =>
        '<div class="card">' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag tag-fill">' + esc(o.type) + '</span><span class="tag">' + esc(o.location.split('(')[0].trim()) + '</span></div>' +
          '<div class="card-title">' + esc(o.title) + '</div>' +
          '<div class="card-text"><strong>' + esc(o.org) + '</strong><br>' + esc(o.duration) + ' &middot; Deadline ' + esc(o.deadline) + '</div>' +
          '<div class="card-foot"><a class="btn btn-small btn-solid" href="#/opportunity/' + esc(o.id) + '">View Details</a></div>' +
        '</div>'
      ).join('') + (list.length ? '' : '<div class="empty">No opportunities in this category yet</div>') + '</div>';
    }

    document.querySelectorAll('#opp-filters [data-type]').forEach(b => b.addEventListener('click', () => {
      activeType = b.dataset.type;
      document.querySelectorAll('#opp-filters [data-type]').forEach(x => x.classList.toggle('active', x === b));
      draw();
    }));

    const d = await api('/api/opportunities');
    all = d.opportunities;
    draw();
    await syncShell();
  }

  async function renderOpportunityDetail(id) {
    app.innerHTML = pageHead('Opportunity', 'Loading...', '');
    let o;
    try { o = await api('/api/opportunities/' + id); }
    catch (e) { app.innerHTML = pageHead('Error', 'Not found', e.message) + '<a class="btn" href="#/opportunities">Back to opportunities</a>'; return syncShell(); }

    const careers = (await api('/api/opportunities')).careers;
    const careerName = (careers.find(c => c.id === o.career) || {}).name || o.career;

    const mailto = 'mailto:' + o.applyTo + '?subject=' + encodeURIComponent('Application: ' + o.title) + '&body=' + encodeURIComponent('Hi ' + o.org + ' team,\n\nI am applying for the ' + o.title + ' opportunity on ELEVO.\n\nCareer goal: ' + careerName + '\nELEVO portfolio: I can share my projects and certificates.\n\nBest regards');

    app.innerHTML = pageHead(o.type + ' — ' + careerName, o.title, o.description) +
      '<ul class="detail-list">' +
        '<li><strong>Organization</strong><span>' + esc(o.org) + '</span></li>' +
        '<li><strong>Location</strong><span>' + esc(o.location) + '</span></li>' +
        '<li><strong>Duration</strong><span>' + esc(o.duration) + '</span></li>' +
        '<li><strong>Stipend / Prize</strong><span>' + esc(o.stipend) + '</span></li>' +
        '<li><strong>Deadline</strong><span>' + esc(o.deadline) + '</span></li>' +
      '</ul>' +
      '<h2 class="card-title" style="margin:22px 0 12px">Requirements</h2>' +
      '<ul class="steps">' + o.requirements.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>' +
      '<div style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<a class="btn btn-solid" href="' + mailto + '">Apply Now (Email)</a>' +
        '<a class="btn" href="#/opportunities">Back to Opportunities</a>' +
        '<a class="btn" href="#/mentor">Ask AI Mentor about this</a>' +
      '</div>';
    await syncShell();
  }

  /* ================= SCREEN 9: AI MENTOR ================= */
  async function renderMentor() {
    app.innerHTML = pageHead('Your personal guide', 'AI Mentor', 'Ask anything about your journey: what to learn next, how to improve a skill, project ideas, or matching opportunities.');
    app.innerHTML +=
      '<div class="chat-box" id="chat-box"></div>' +
      '<form class="chat-form" id="chat-form">' +
        '<input id="chat-input" type="text" maxlength="300" placeholder="Ask your mentor anything..." autocomplete="off" required>' +
        '<button class="btn btn-solid" type="submit">Send</button>' +
      '</form>' +
      '<div class="quick-asks">' +
        ['What should I learn next?', 'How can I improve my research skills?', 'Suggest a project', 'Show opportunities', 'How am I doing?'].map(q =>
          '<button class="btn btn-small" data-ask="' + esc(q) + '">' + esc(q) + '</button>').join('') +
      '</div>';

    const box = document.getElementById('chat-box');

    function bubble(role, text) {
      const div = document.createElement('div');
      div.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-mentor');
      div.innerHTML = '<span class="msg-role">' + (role === 'user' ? 'You' : 'ELEVO Mentor') + '</span>' + esc(text);
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }

    async function loadChat() {
      const d = await api('/api/mentor');
      box.innerHTML = '';
      if (!d.chat.length) bubble('mentor', 'Welcome to ELEVO. I track your goal, roadmap progress and portfolio in real time. What would you like to work on?');
      else d.chat.forEach(m => bubble(m.role, m.text));
    }

    async function send(text) {
      if (!text.trim()) return;
      bubble('user', text);
      const t = document.createElement('div');
      t.className = 'typing'; t.textContent = 'THINKING...';
      box.appendChild(t); box.scrollTop = box.scrollHeight;
      try {
        const r = await api('/api/mentor', { method: 'POST', body: { message: text } });
        t.remove();
        bubble('mentor', r.reply);
      } catch (err) {
        t.remove();
        bubble('mentor', 'Something went wrong: ' + err.message);
      }
    }

    document.getElementById('chat-form').addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      send(input.value);
      input.value = '';
    });
    document.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => send(b.dataset.ask)));

    await loadChat();
    await syncShell();
  }

  /* ================= SCREEN 10: DASHBOARD ================= */
  async function renderDashboard() {
    app.innerHTML = pageHead('Your command center', 'Dashboard', '');
    let d;
    try { d = await api('/api/dashboard'); }
    catch (e) { app.innerHTML += '<div class="empty">' + esc(e.message) + ' <a href="#/goal">Choose a goal</a></div>'; return syncShell(); }

    const pctSkills = d.totalSkills ? Math.round(d.skillsDone / d.totalSkills * 100) : 0;

    app.innerHTML += '<div class="grid grid-4" style="margin-bottom:30px">' +
      '<div class="stat"><div class="stat-num">' + (d.career ? d.career.name.split(' ')[0] : '—') + '</div><div class="stat-label">Career Goal</div></div>' +
      '<div class="stat"><div class="stat-num">' + d.skillsDone + '<span style="font-size:20px;color:var(--grey)">/' + d.totalSkills + '</span></div><div class="stat-label">Skills Completed</div></div>' +
      '<div class="stat"><div class="stat-num">' + d.projectsDone + '<span style="font-size:20px;color:var(--grey)">/' + d.totalProjects + '</span></div><div class="stat-label">Projects Completed</div></div>' +
      '<div class="stat"><div class="stat-num">' + d.portfolio.length + '</div><div class="stat-label">Portfolio Items</div></div>' +
    '</div>';

    let html = '<div class="next-step-bar"><strong>Recommended next step</strong><span>' + esc(d.nextStep ? d.nextStep.label : 'Explore opportunities') + '</span>' +
      '<a class="btn btn-small btn-solid" href="' + (d.nextStep && d.nextStep.phase === 'LEARN' ? '#/learn' : d.nextStep && d.nextStep.phase === 'PRACTICE' ? '#/practice' : '#/opportunities') + '">Go</a></div>';

    html += '<h2 class="card-title" style="margin-bottom:12px">Skill Progress (' + pctSkills + '%)</h2>';
    html += d.skills.map(s =>
      '<div class="skill-row" style="margin-bottom:10px"><div class="skill-row-head" style="cursor:default">' +
        '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
        progressBar(s.pct, s.done + '/' + s.total) +
        (s.complete ? '<span class="badge-done">Done</span>' : '') +
      '</div></div>').join('');

    html += '<h2 class="card-title" style="margin:30px 0 12px">Recent Portfolio</h2>';
    html += d.portfolio.length ? '<div class="grid grid-3">' + d.portfolio.slice(-3).reverse().map(i =>
      '<div class="card"><div class="card-title" style="font-size:15px">' + esc(i.title) + '</div><div class="card-text">' + esc(i.date) + '</div></div>').join('') + '</div>'
      : '<div class="empty">No portfolio items yet — complete a practice project</div>';

    html += '<h2 class="card-title" style="margin:30px 0 12px">Certificates (' + d.certificates.length + ')</h2>';
    html += d.certificates.length ? '<div class="grid grid-3">' + d.certificates.slice(-3).reverse().map(c =>
      '<div class="card" style="background:var(--soft)"><div class="card-title" style="font-size:15px">' + esc(c.title) + '</div><div class="card-text">' + esc(c.issuer) + ' &middot; ' + esc(c.date) + '</div></div>').join('') + '</div>'
      : '<div class="empty">Certificates appear when you complete practice projects</div>';

    html += '<div style="margin-top:34px;display:flex;gap:10px;flex-wrap:wrap">' +
      '<a class="btn btn-solid" href="#/learn">Continue Learning</a>' +
      '<a class="btn" href="#/practice">Practice</a>' +
      '<a class="btn" href="#/opportunities">Find Opportunities</a>' +
      '<a class="btn" href="#/mentor">Ask AI Mentor</a>' +
    '</div>';

    app.innerHTML += html;
    await syncShell();
  }

  /* ================= ROUTER ================= */
  const routes = {
    welcome: renderWelcome,
    goal: renderGoal,
    roadmap: renderRoadmap,
    learn: renderLearn,
    practice: renderPractice,
    portfolio: renderPortfolio,
    connect: renderConnect,
    opportunities: renderOpportunities,
    mentor: renderMentor,
    dashboard: renderDashboard
  };

  async function router() {
    const raw = location.hash.replace(/^#\/?/, '') || 'welcome';
    const [name, param] = raw.split('/');
    window.scrollTo(0, 0);
    if (name === 'opportunity' && param) return renderOpportunityDetail(param);
    const fn = routes[name] || renderWelcome;
    try { await fn(); } catch (e) {
      app.innerHTML = pageHead('Error', 'Something went wrong', e.message) + '<a class="btn" href="#/welcome">Back to start</a>';
    }
  }

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset ALL progress, portfolio and chat?')) return;
    await api('/api/reset', { method: 'POST' });
    toast('Progress reset');
    location.hash = '#/welcome';
    setTimeout(() => location.reload(), 300);
  });

  window.addEventListener('hashchange', router);
  router();
})();
