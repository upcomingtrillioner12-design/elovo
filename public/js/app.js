/* ELEVO — Frontend SPA (responsive: Android bottom-nav / desktop top-nav) */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');
  var topbar = document.getElementById('topbar');
  var bottombar = document.getElementById('bottombar');
  var fab = document.getElementById('mentor-fab');
  var sheet = document.getElementById('more-sheet');
  var backdrop = document.getElementById('sheet-backdrop');

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || ('Request failed (' + r.status + ')'));
        return d;
      });
    });
  }

  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.add('hidden'); }, 2800);
  }

  function pageHead(kicker, title, sub) {
    return '<div class="page-head"><div class="page-kicker">' + esc(kicker) + '</div>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' +
      (sub ? '<p class="page-sub">' + esc(sub) + '</p>' : '') + '</div>';
  }

  function progressBar(pct, label) {
    return '<div class="progress"><div style="width:' + pct + '%"></div></div>' +
      (label ? '<span class="badge-done" style="background:var(--paper);color:var(--ink);border:1.5px solid var(--ink)">' + esc(label) + '</span>' : '');
  }

  function on(id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); }

  function closeSheet() { sheet.classList.add('hidden'); backdrop.classList.add('hidden'); }
  backdrop.addEventListener('click', closeSheet);
  sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSheet); });

  function route() { return (location.hash.replace(/^#\/?/, '') || 'welcome').split('?')[0]; }

  /* ---------- shell ---------- */
  function syncShell() {
    return api('/api/settings').then(function (s) {
      var name = s.profile && s.profile.name;
      var hasGoal = null;
      return api('/api/goal').then(function (g) {
        hasGoal = !!g.goal;
        var publicRoute = ['welcome', 'goal', 'menu'].indexOf(route()) !== -1;
        topbar.classList.toggle('hidden', !hasGoal || publicRoute);
        bottombar.classList.toggle('hidden', !hasGoal || publicRoute);
        fab.classList.toggle('hidden', !hasGoal || route() === 'mentor' || publicRoute);
        document.querySelectorAll('[data-nav]').forEach(function (a) {
          a.classList.toggle('active', route().indexOf(a.getAttribute('data-nav')) === 0);
        });
        return { name: name, hasGoal: hasGoal };
      });
    }).catch(function () { return { name: '', hasGoal: false }; });
  }

  /* ================= WELCOME ================= */
  function renderWelcome() {
    app.innerHTML =
      '<section class="welcome">' +
        '<div class="welcome-logo">ELEVO<span>.</span></div>' +
        '<div class="welcome-tag">Your Skills. Real Opportunities.</div>' +
        '<p class="welcome-sub">Bridging the gap between skills and opportunities. GOAL &#8594; LEARN &#8594; PRACTICE &#8594; BUILD &#8594; CONNECT &#8594; OPPORTUNITY - all in one place.</p>' +
        '<div class="journey-strip">' +
          '<span>Goal</span><i>&#8594;</i><span>Learn</span><i>&#8594;</i><span>Practice</span><i>&#8594;</i><span>Build</span><i>&#8594;</i><span>Connect</span><i>&#8594;</i><span>Opportunity</span>' +
        '</div>' +
        '<form class="name-form" id="name-form">' +
          '<input class="search-input" id="name-input" type="text" maxlength="30" placeholder="Your first name (optional)">' +
          '<button class="btn btn-solid" type="submit">Get Started &#8594;</button>' +
        '</form>' +
      '</section>';
    document.getElementById('name-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name-input').value.trim();
      var go = function () { location.hash = '#/goal'; };
      if (name) api('/api/settings', { method: 'POST', body: { name: name } }).then(go, go);
      else go();
    });
    syncShell();
  }

  /* ================= GOAL ================= */
  function renderGoal() {
    app.innerHTML = pageHead('Step 1 of your journey', 'Choose Your Goal', 'What do you want to become? Your roadmap, projects and opportunities will be personalized to this goal.') +
      '<div style="margin-bottom:16px"><input id="goal-search" class="search-input" type="text" placeholder="Search your dream..."></div>' +
      '<div id="goal-list"></div>';

    api('/api/careers').then(function (data) {
      var list = document.getElementById('goal-list');
      function draw(items) {
        list.innerHTML = items.map(function (c) {
          var letter = c.name.charAt(0);
          return '<div class="row-item" data-pick="' + esc(c.id) + '">' +
            '<div class="row-ico">' + esc(letter) + '</div>' +
            '<div class="row-main"><div class="row-title">' + esc(c.name) + '</div>' +
            '<div class="row-sub">' + esc(c.tagline) + ' &middot; ' + c.skillCount + ' skills &middot; ' + c.projectCount + ' projects</div></div>' +
            '<div class="row-arrow">&#8594;</div></div>';
        }).join('') || '<div class="empty">No careers match your search</div>';
        list.querySelectorAll('[data-pick]').forEach(function (el) {
          el.addEventListener('click', function () {
            el.style.opacity = '.5';
            api('/api/goal', { method: 'POST', body: { careerId: el.getAttribute('data-pick') } })
              .then(function () { toast('Goal saved'); location.hash = '#/roadmap'; })
              .catch(function (e) { toast(e.message); el.style.opacity = '1'; });
          });
        });
      }
      draw(data);
      document.getElementById('goal-search').addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        draw(data.filter(function (c) { return (c.name + ' ' + c.tagline).toLowerCase().indexOf(q) !== -1; }));
      });
    });
    syncShell();
  }

  /* ================= HOME / DASHBOARD ================= */
  function renderHome() {
    api('/api/dashboard').catch(function (e) {
      app.innerHTML = pageHead('ELEVO', 'Start your journey', '') + '<div class="empty">' + esc(e.message) + '</div><div style="margin-top:16px"><a class="btn btn-solid" href="#/goal">Choose Your Goal</a></div>';
      syncShell();
    }).then(function (d) {
      if (!d || !d.career) return;
      syncShell().then(function (sh) {
        var first = (sh.name || 'Learner').split(' ')[0];
        var pct = d.totalSkills ? Math.round(d.skillsDone / d.totalSkills * 100) : 0;
        var nextSkill = d.skills.filter(function (s) { return !s.complete; })[0];
        var continueTopic = null;
        if (nextSkill) continueTopic = nextSkill.topics.filter(function (t) { return !t.done; })[0];

        app.innerHTML = pageHead('Home / Dashboard', 'Hi ' + esc(first) + ' &#128075;', 'Small steps. Big dreams. Here is your journey at a glance.') +

          '<div class="roadmap-flow" style="margin-bottom:18px">' +
            ['GOAL', 'LEARN', 'PRACTICE', 'BUILD', 'CONNECT', 'OPPORTUNITY'].map(function (p) {
              var cur = d.nextStep && d.nextStep.phase === p;
              return '<span class="' + (cur ? 'current' : '') + '">' + p + '</span>';
            }).join('<i>&#8594;</i>') + '</div>' +

          '<div class="grid grid-4" style="margin-bottom:18px">' +
            '<div class="stat"><div class="stat-num">' + d.skillsDone + '<span style="font-size:18px;color:var(--grey)">/' + d.totalSkills + '</span></div><div class="stat-label">Skills Done</div></div>' +
            '<div class="stat"><div class="stat-num">' + d.projectsDone + '<span style="font-size:18px;color:var(--grey)">/' + d.totalProjects + '</span></div><div class="stat-label">Projects Done</div></div>' +
            '<div class="stat"><div class="stat-num">' + d.portfolio.length + '</div><div class="stat-label">Portfolio Items</div></div>' +
            '<div class="stat"><div class="stat-num">' + d.certificates.length + '</div><div class="stat-label">Certificates</div></div>' +
          '</div>' +

          (continueTopic ?
            '<div class="card" style="margin-bottom:14px"><div style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag tag-fill">Continue Learning</span>' +
            (nextSkill.complete ? '' : '<span class="badge-done">' + nextSkill.pct + '%</span>') + '</div>' +
            '<div class="card-title">' + esc(continueTopic.title) + '</div>' +
            '<div class="card-text">' + esc(nextSkill.skill.name) + ' &middot; ' + esc(continueTopic.resource.label) + '</div>' +
            '<div class="card-foot"><a class="btn btn-small btn-solid" href="#/learn">Resume &#8594;</a></div></div>' : '') +

          '<div class="next-step-bar"><strong>&#10022; Your next step</strong><span>' + esc(d.nextStep ? d.nextStep.label : 'Apply to opportunities and connect with mentors') + '</span>' +
          '<a class="btn btn-small btn-solid" href="' + (d.nextStep && d.nextStep.phase === 'LEARN' ? '#/learn' : d.nextStep && d.nextStep.phase === 'PRACTICE' ? '#/practice' : '#/opportunities') + '">Go &#8594;</a></div>' +

          '<h2 class="card-title" style="margin-bottom:12px">Skill Progress (' + pct + '%)</h2>' +
          d.skills.map(function (s) {
            return '<div class="skill-row" style="margin-bottom:10px"><div class="skill-head" style="cursor:default">' +
              '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
              progressBar(s.pct, s.done + '/' + s.total) +
              (s.complete ? '<span class="badge-done">Done</span>' : '') + '</div></div>';
          }).join('') +

          '<h2 class="card-title" style="margin:24px 0 12px">Recent Portfolio</h2>' +
          (d.portfolio.length ? '<div class="grid grid-3">' + d.portfolio.slice(-3).reverse().map(function (i) {
            return '<div class="card"><div class="card-title" style="font-size:14px">' + esc(i.title) + '</div><div class="card-text">' + esc(i.date) + '</div></div>';
          }).join('') + '</div>' : '<div class="empty">No portfolio items yet - complete a practice project</div>') +

          '<div style="margin-top:26px;display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="btn btn-solid" href="#/learn">Continue Learning</a>' +
            '<a class="btn" href="#/practice">Practice</a>' +
            '<a class="btn" href="#/opportunities">Opportunities</a>' +
          '</div>';
      });
    });
  }

  /* ================= ROADMAP ================= */
  function renderRoadmap() {
    api('/api/progress').then(function (data) {
      var phaseOrder = ['GOAL', 'LEARN', 'PRACTICE', 'BUILD', 'CONNECT', 'OPPORTUNITY'];
      var currentPhase = data.nextStep ? data.nextStep.phase : 'OPPORTUNITY';
      var html = pageHead('Step 2 - Your personalized path', 'Your Roadmap', 'Goal: ' + data.career.name) +
        '<div class="roadmap-flow">' + phaseOrder.map(function (p) {
          return '<span class="' + (p === currentPhase ? 'current' : '') + '">' + p + '</span>';
        }).join('<i>&#8594;</i>') + '</div>';

      if (data.nextStep) {
        html += '<div class="next-step-bar"><strong>&#10022; Recommended next step</strong><span>' + esc(data.nextStep.label) + '</span>' +
          (data.nextStep.phase === 'LEARN' ? '<a class="btn btn-small btn-solid" href="#/learn">Start Learning</a>'
            : data.nextStep.phase === 'PRACTICE' ? '<a class="btn btn-small btn-solid" href="#/practice">Start Project</a>'
            : '<a class="btn btn-small btn-solid" href="#/connect">Connect</a>') + '</div>';
      }

      html += data.skills.map(function (s, i) {
        return '<div class="skill-row" data-skill="' + esc(s.skill.id) + '">' +
          '<div class="skill-head"><span class="skill-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
          progressBar(s.pct, s.done + '/' + s.total) +
          (s.complete ? '<span class="badge-done">Done</span>' : '') + '</div>' +
          '<div class="skill-body"><p class="card-text" style="margin-bottom:10px">' + s.total + ' topics in this skill.</p>' +
          s.topics.map(function (t) {
            return '<div class="topic" style="opacity:.75;padding:10px 12px"><div class="topic-title" style="font-size:13px">' + esc(t.title) + '</div></div>';
          }).join('') +
          '<a class="btn btn-small btn-solid" href="#/learn" style="margin-top:8px">Open in Learn</a></div></div>';
      }).join('');

      app.innerHTML = html;
      document.querySelectorAll('.skill-head').forEach(function (h) {
        h.addEventListener('click', function () { h.parentElement.classList.toggle('open'); });
      });
      syncShell();
    }).catch(function (e) {
      app.innerHTML = pageHead('Roadmap', 'No goal yet', '') + '<div class="empty">' + esc(e.message) + '</div><div style="margin-top:16px"><a class="btn btn-solid" href="#/goal">Choose Your Goal</a></div>';
      syncShell();
    });
  }

  /* ================= LEARN ================= */
  function renderLearn() {
    app.innerHTML = pageHead('Step 3 - Skill up', 'Learn', 'Open a resource, study, then mark the topic complete. Progress saves instantly.');
    var wrap = document.createElement('div');
    app.appendChild(wrap);

    function draw() {
      return api('/api/progress').then(function (fresh) {
        wrap.innerHTML = fresh.skills.map(function (s, i) {
          return '<div class="skill-row open">' +
            '<div class="skill-head" style="cursor:default">' +
            '<span class="skill-num">' + ('0' + (i + 1)).slice(-2) + '</span>' +
            '<span class="skill-name">' + esc(s.skill.name) + '</span>' +
            progressBar(s.pct, s.done + '/' + s.total) +
            (s.complete ? '<span class="badge-done">Skill Complete</span>' : '') + '</div>' +
            '<div class="skill-body">' +
            s.topics.map(function (t) {
              return '<div class="topic ' + (t.done ? 'complete' : '') + '" data-topic="' + esc(t.id) + '">' +
                '<div class="topic-top"><span class="topic-title">' + esc(t.title) + '</span>' +
                (t.done ? '<span class="badge-done">Complete</span>' : '') + '</div>' +
                '<div class="topic-desc">' + esc(t.description) + '</div>' +
                '<div class="topic-actions">' +
                '<a class="btn btn-small" href="' + esc(t.resource.url) + '" target="_blank" rel="noopener">Start Learning: ' + esc(t.resource.label) + '</a>' +
                '<button class="btn btn-small ' + (t.done ? '' : 'btn-solid') + '" data-toggle="' + esc(t.id) + '">' + (t.done ? 'Undo' : 'Mark Complete') + '</button>' +
                '</div></div>';
            }).join('') + '</div></div>';
        }).join('');

        wrap.querySelectorAll('[data-toggle]').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            var row = wrap.querySelector('[data-topic="' + b.getAttribute('data-toggle') + '"]');
            var willComplete = !row.classList.contains('complete');
            api('/api/topic/' + b.getAttribute('data-toggle') + '/complete', { method: 'POST', body: { complete: willComplete } })
              .then(function (r) {
                toast(willComplete ? 'Topic complete - skill now ' + r.skill.pct + '%' : 'Topic unmarked');
                draw();
              })
              .catch(function (e) { toast(e.message); b.disabled = false; });
          });
        });
      });
    }
    draw().catch(function (e) {
      app.innerHTML = pageHead('Learn', 'No goal yet', '') + '<div class="empty">' + esc(e.message) + '</div><div style="margin-top:16px"><a class="btn btn-solid" href="#/goal">Choose Your Goal</a></div>';
    });
    syncShell();
  }

  /* ================= PRACTICE (Projects + Quizzes) ================= */
  function renderPractice() {
    app.innerHTML = pageHead('Step 4 - Apply your skills', 'Practice', 'Hands-on projects and skill quizzes. Completed projects go straight into your portfolio with a certificate.') +
      '<div class="chips" id="prac-chips">' +
      '<button class="btn btn-small active" data-tab="projects">Projects</button>' +
      '<button class="btn btn-small" data-tab="quiz">Quizzes</button></div>' +
      '<div id="prac-body"></div>';
    var body = document.getElementById('prac-body');
    var tab = 'projects';

    function drawProjects() {
      api('/api/progress').then(function (data) {
        body.innerHTML = '<div class="grid grid-2">' + data.projects.map(function (x) {
          var p = x.project;
          return '<div class="card">' +
            '<div style="display:flex;gap:7px;flex-wrap:wrap"><span class="tag tag-fill">' + esc(p.level) + '</span>' +
            (x.completed ? '<span class="badge-done">Completed</span>' : x.started ? '<span class="tag">In Progress</span>' : '') + '</div>' +
            '<div class="card-title">' + esc(p.title) + '</div>' +
            '<div class="card-text">' + esc(p.description) + '</div>' +
            '<div>' + p.skills.map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join(' ') + '</div>' +
            '<ol class="steps">' + p.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
            '<div class="card-foot">' +
            '<button class="btn btn-small" data-start="' + esc(p.id) + '" ' + (x.started || x.completed ? 'disabled' : '') + '>' + (x.started && !x.completed ? 'Started' : 'Start Project') + '</button>' +
            '<button class="btn btn-small ' + (x.completed ? 'btn-done' : 'btn-solid') + '" data-complete="' + esc(p.id) + '" ' + (x.completed ? 'disabled' : '') + '>' + (x.completed ? 'In Portfolio' : 'Mark Completed') + '</button>' +
            '</div></div>';
        }).join('') + '</div>';

        body.querySelectorAll('[data-start]').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            api('/api/project/' + b.getAttribute('data-start') + '/start', { method: 'POST' })
              .then(function () { toast('Project started - good luck!'); drawProjects(); })
              .catch(function (e) { toast(e.message); b.disabled = false; });
          });
        });
        body.querySelectorAll('[data-complete]').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            api('/api/project/' + b.getAttribute('data-complete') + '/complete', { method: 'POST' })
              .then(function () { toast('Completed! Added to portfolio + certificate earned'); drawProjects(); })
              .catch(function (e) { toast(e.message); b.disabled = false; });
          });
        });
      }).catch(function (e) { body.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
    }

    function drawQuiz() {
      api('/api/quiz').then(function (d) {
        if (!d.questions.length) { body.innerHTML = '<div class="empty">No quiz for this goal yet</div>'; return; }
        body.innerHTML =
          (d.best ? '<div class="next-step-bar" style="margin-bottom:16px"><strong>Best score</strong><span>' + d.best.score + ' / ' + d.best.total + ' (' + esc(d.best.date) + ')</span></div>' : '') +
          d.questions.map(function (q, qi) {
            return '<div class="quiz-q" data-q="' + qi + '"><div class="card-text" style="color:var(--ink);font-weight:800">' + (qi + 1) + '. ' + esc(q.q) + '</div>' +
              q.options.map(function (opt, oi) {
                return '<button class="quiz-opt" data-q="' + qi + '" data-o="' + oi + '">' + esc(opt) + '</button>';
              }).join('') +
              '<div class="quiz-why" data-why="' + qi + '"></div></div>';
          }).join('') +
          '<button class="btn btn-solid btn-block" id="quiz-submit" style="margin-top:8px">Submit Answers</button>' +
          '<div id="quiz-result" style="margin-top:16px"></div>';

        var picks = {};
        body.querySelectorAll('.quiz-opt').forEach(function (b) {
          b.addEventListener('click', function () {
            var qi = b.getAttribute('data-q'), oi = parseInt(b.getAttribute('data-o'), 10);
            picks[qi] = oi;
            body.querySelectorAll('.quiz-opt[data-q="' + qi + '"]').forEach(function (x) { x.classList.remove('picked'); });
            b.classList.add('picked');
          });
        });

        document.getElementById('quiz-submit').addEventListener('click', function () {
          var btn = this; btn.disabled = true;
          var answers = d.questions.map(function (_, i) { return (i in picks) ? picks[i] : null; });
          api('/api/quiz/submit', { method: 'POST', body: { answers: answers } }).then(function (r) {
            r.results.forEach(function (res, i) {
              body.querySelectorAll('.quiz-opt[data-q="' + i + '"]').forEach(function (x) {
                var oi = parseInt(x.getAttribute('data-o'), 10);
                x.disabled = true;
                if (oi === res.correctIndex) x.classList.add('right');
                else if (oi === res.yourIndex) x.classList.add('wrong');
              });
              var why = body.querySelector('[data-why="' + i + '"]');
              why.textContent = (res.right ? 'Correct. ' : 'Not quite. ') + res.why;
              why.classList.add('show');
            });
            document.getElementById('quiz-result').innerHTML =
              '<div class="next-step-bar"><strong>Your score</strong><span>' + r.score + ' / ' + r.total + ' (' + Math.round(r.score / r.total * 100) + '%)' +
              (r.best ? ' &middot; Best: ' + r.best.score + '/' + r.best.total : '') + '</span>' +
              '<button class="btn btn-small" id="quiz-retry">Try Again</button></div>';
            document.getElementById('quiz-retry').addEventListener('click', drawQuiz);
            toast('Quiz graded: ' + r.score + '/' + r.total);
          }).catch(function (e) { toast(e.message); btn.disabled = false; });
        });
      }).catch(function (e) { body.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
    }

    document.querySelectorAll('#prac-chips [data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        tab = b.getAttribute('data-tab');
        document.querySelectorAll('#prac-chips [data-tab]').forEach(function (x) { x.classList.toggle('active', x === b); });
        if (tab === 'projects') drawProjects(); else drawQuiz();
      });
    });
    drawProjects();
    syncShell();
  }

  /* ================= PORTFOLIO ================= */
  function renderPortfolio() {
    app.innerHTML = pageHead('Step 5 - Show your work', 'My Portfolio', 'Showcase your projects, skills and certificates. Share it with recruiters.') +
      '<div class="chips" id="pf-chips">' +
      '<button class="btn btn-small active" data-tab="projects">Projects</button>' +
      '<button class="btn btn-small" data-tab="certificates">Certificates</button></div>' +
      '<div id="pf-body"></div>';
    var body = document.getElementById('pf-body');

    function draw(tab) {
      api('/api/portfolio').then(function (d) {
        if (tab === 'projects') {
          body.innerHTML =
            '<div class="grid grid-4" style="margin-bottom:18px">' +
            '<div class="stat"><div class="stat-num">' + d.items.length + '</div><div class="stat-label">Projects</div></div>' +
            '<div class="stat"><div class="stat-num">' + d.certificates.length + '</div><div class="stat-label">Certificates</div></div>' +
            '<div class="stat"><div class="stat-num">' + (d.career ? d.career.skills.length : 0) + '</div><div class="stat-label">Skills</div></div>' +
            '<div class="stat"><div class="stat-num">' + d.items.length + '</div><div class="stat-label">Items</div></div></div>' +
            (d.items.length ? '<div class="grid grid-2">' + d.items.map(function (i) {
              return '<div class="card">' +
                '<div style="display:flex;justify-content:space-between;gap:8px;align-items:start">' +
                '<div class="card-title">' + esc(i.title) + '</div><span class="tag">' + (i.origin === 'practice' ? 'Practice' : 'My Project') + '</span></div>' +
                '<div class="card-text">' + esc(i.description) + '</div>' +
                '<div>' + (i.skills || []).map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join(' ') + '</div>' +
                '<div class="card-foot"><span class="card-text">' + esc(i.date) + '</span>' +
                '<button class="btn btn-small btn-ghost" data-del="' + esc(i.id) + '">Remove</button></div></div>';
            }).join('') + '</div>' : '<div class="empty">No projects yet - finish a practice project or add one below</div>') +

            '<h2 class="card-title" style="margin:26px 0 12px">Add Project</h2>' +
            '<div class="form-box"><form id="add-pf">' +
            '<div class="field"><label>Project title</label><input id="pf-title" required maxlength="120" placeholder="e.g. Bird Count Web App"></div>' +
            '<div class="field"><label>Description</label><textarea id="pf-desc" required maxlength="600" placeholder="What did you build or research?"></textarea></div>' +
            '<div class="field"><label>Skills used (comma separated)</label><input id="pf-skills" placeholder="Python, Data Analysis"></div>' +
            '<button class="btn btn-solid" type="submit">Add Project</button></form></div>';

          body.querySelectorAll('[data-del]').forEach(function (b) {
            b.addEventListener('click', function () {
              api('/api/portfolio/' + b.getAttribute('data-del'), { method: 'DELETE' })
                .then(function () { toast('Project removed'); draw('projects'); });
            });
          });
          document.getElementById('add-pf').addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = e.target.querySelector('button'); btn.disabled = true;
            api('/api/portfolio', {
              method: 'POST',
              body: {
                title: document.getElementById('pf-title').value,
                description: document.getElementById('pf-desc').value,
                skills: document.getElementById('pf-skills').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
              }
            }).then(function () { toast('Project added'); draw('projects'); })
              .catch(function (e2) { toast(e2.message); btn.disabled = false; });
          });
        } else {
          body.innerHTML = d.certificates.length ? '<div class="grid grid-2">' + d.certificates.map(function (c) {
            return '<div class="card" style="background:var(--soft)">' +
              '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px">Certificate of Completion</div>' +
              '<div class="card-title">' + esc(c.title) + '</div>' +
              '<div class="card-text">Issued by ' + esc(c.issuer) + ' &middot; ' + esc(c.career) + ' &middot; ' + esc(c.date) + '</div></div>';
          }).join('') + '</div>' : '<div class="empty">Complete a practice project to earn your first certificate</div>';
        }
      });
    }

    document.querySelectorAll('#pf-chips [data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#pf-chips [data-tab]').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw(b.getAttribute('data-tab'));
      });
    });
    draw('projects');
    syncShell();
  }

  /* ================= CONNECT ================= */
  function renderConnect() {
    app.innerHTML = pageHead('Step 6 - Grow your network', 'Connect', 'Mentors, creators, fellow learners and organizations matched to your goal.') +
      '<div class="chips" id="cn-chips">' +
      '<button class="btn btn-small active" data-tab="mentorship">Mentorship</button>' +
      '<button class="btn btn-small" data-tab="community">Community</button>' +
      '<button class="btn btn-small" data-tab="orgs">Organizations</button></div>' +
      '<div id="cn-body"></div>';
    var body = document.getElementById('cn-body');

    function personCard(p, actionLabel) {
      return '<div class="card" data-person="' + esc(p.id) + '">' +
        '<div class="row-item" style="border:none;padding:0;margin:0;cursor:default">' +
        '<div class="row-ico">' + esc(p.name.charAt(0)) + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(p.name) + '</div><div class="row-sub">' + esc(p.role) + '</div></div></div>' +
        '<div class="card-text person-bio hidden" style="margin-top:6px">' + esc(p.bio) + '<br><br>' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join(' ') + '</div>' +
        '<div class="card-foot">' +
        '<button class="btn btn-small" data-profile="' + esc(p.id) + '">View Profile</button>' +
        (p.type === 'mentor' ? '<a class="btn btn-small" href="mailto:mentor@elevo.app?subject=' + encodeURIComponent('Session request for ' + p.name) + '">Book a Session</a>' : '') +
        '<button class="btn btn-small ' + (p.connected ? 'btn-done' : 'btn-solid') + '" data-connect="' + esc(p.id) + '" ' + (p.connected ? 'disabled' : '') + '>' + (p.connected ? 'Connected' : actionLabel) + '</button>' +
        '</div></div>';
    }

    function bindCards() {
      body.querySelectorAll('[data-profile]').forEach(function (b) {
        b.addEventListener('click', function () {
          body.querySelector('[data-person="' + b.getAttribute('data-profile') + '"] .person-bio').classList.toggle('hidden');
        });
      });
      body.querySelectorAll('[data-connect]').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true;
          api('/api/connect', { method: 'POST', body: { personId: b.getAttribute('data-connect') } })
            .then(function () { toast('Connected'); draw(activeTab); })
            .catch(function (e) { toast(e.message); b.disabled = false; });
        });
      });
    }

    var activeTab = 'mentorship';
    function draw(tab) {
      activeTab = tab;
      api('/api/people').then(function (d) {
        var list = d.people;
        if (tab === 'mentorship') list = list.filter(function (p) { return p.type === 'mentor' || p.type === 'creator'; });
        else if (tab === 'community') list = list.filter(function (p) { return p.type === 'learner'; });
        else list = list.filter(function (p) { return p.type === 'organization'; });
        body.innerHTML = '<div class="grid grid-2">' + list.map(function (p) {
          return personCard(p, tab === 'community' ? 'Join' : tab === 'orgs' ? 'Follow' : 'Connect');
        }).join('') + '</div>';
        bindCards();
      });
    }

    document.querySelectorAll('#cn-chips [data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#cn-chips [data-tab]').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw(b.getAttribute('data-tab'));
      });
    });
    draw('mentorship');
    syncShell();
  }

  /* ================= OPPORTUNITIES ================= */
  function renderOpportunities() {
    app.innerHTML = pageHead('Final step - Real opportunities', 'Opportunities', 'Internships, research programs, competitions, projects and collaborations.') +
      '<div class="chips" id="opp-chips">' +
      ['All', 'Internship', 'Research', 'Project', 'Competition', 'Collaboration'].map(function (t, i) {
        return '<button class="btn btn-small ' + (i === 0 ? 'active' : '') + '" data-type="' + t + '">' + t + 's</button>';
      }).join('') + '</div><div id="opp-body"></div>';
    var body = document.getElementById('opp-body');
    var all = [], active = 'All';

    function draw() {
      var list = all.filter(function (o) { return active === 'All' || o.type === active; });
      body.innerHTML = '<div class="grid grid-2">' + list.map(function (o) {
        return '<div class="card">' +
          '<div style="display:flex;gap:7px;flex-wrap:wrap"><span class="tag tag-fill">' + esc(o.type) + '</span><span class="tag">' + esc(o.duration) + '</span></div>' +
          '<div class="card-title">' + esc(o.title) + '</div>' +
          '<div class="card-text"><strong>' + esc(o.org) + '</strong><br>' + esc(o.location) + ' &middot; Deadline ' + esc(o.deadline) + '</div>' +
          '<div class="card-foot"><a class="btn btn-small btn-solid" href="#/opportunity/' + esc(o.id) + '">View Details</a></div></div>';
      }).join('') + (list.length ? '' : '<div class="empty">Nothing in this category yet</div>') + '</div>';
    }

    document.querySelectorAll('#opp-chips [data-type]').forEach(function (b) {
      b.addEventListener('click', function () {
        active = b.getAttribute('data-type');
        document.querySelectorAll('#opp-chips [data-type]').forEach(function (x) { x.classList.toggle('active', x === b); });
        draw();
      });
    });
    api('/api/opportunities').then(function (d) { all = d.opportunities; draw(); });
    syncShell();
  }

  function renderOpportunityDetail(id) {
    app.innerHTML = pageHead('Opportunity', 'Loading...', '');
    api('/api/opportunities/' + id).then(function (o) {
      var mailto = 'mailto:' + o.applyTo +
        '?subject=' + encodeURIComponent('Application: ' + o.title) +
        '&body=' + encodeURIComponent(['Hi ' + o.org + ' team,', '', 'I am applying for the ' + o.title + ' opportunity (listed on ELEVO).', '', 'Career goal: ' + o.career, 'Portfolio and certificates: available on request.', '', 'Best regards'].join('\n'));
      app.innerHTML = pageHead(o.type, o.title, o.description) +
        '<ul class="detail-list">' +
        '<li><strong>Organization</strong><span>' + esc(o.org) + '</span></li>' +
        '<li><strong>Location</strong><span>' + esc(o.location) + '</span></li>' +
        '<li><strong>Duration</strong><span>' + esc(o.duration) + '</span></li>' +
        '<li><strong>Stipend/Prize</strong><span>' + esc(o.stipend) + '</span></li>' +
        '<li><strong>Deadline</strong><span>' + esc(o.deadline) + '</span></li></ul>' +
        '<h2 class="card-title" style="margin:18px 0 10px">Requirements</h2>' +
        '<ul class="steps">' + o.requirements.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
        '<div style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<a class="btn btn-solid" href="' + mailto + '">Apply Now (Email)</a>' +
        '<a class="btn" href="#/opportunities">Back</a></div>';
      syncShell();
    }).catch(function (e) {
      app.innerHTML = pageHead('Error', 'Not found', e.message) + '<a class="btn" href="#/opportunities">Back to Opportunities</a>';
      syncShell();
    });
  }

  /* ================= AI MENTOR ================= */
  function renderMentor() {
    app.innerHTML = pageHead('Always here for you', 'AI Mentor', 'Personalized guidance based on your real progress. Connect a free API key in Settings for live AI answers.') +
      '<div class="chat-box" id="chat-box"></div>' +
      '<form class="chat-form" id="chat-form">' +
      '<input id="chat-input" type="text" maxlength="300" placeholder="Ask me anything..." autocomplete="off" required>' +
      '<button class="btn btn-solid" type="submit">Send</button></form>' +
      '<div class="quick-asks">' +
      ['What should I learn next?', 'Create my personalized learning roadmap', 'How can I improve my skills?', 'Suggest a project', 'Show opportunities', 'How am I doing?'].map(function (q) {
        return '<button class="btn btn-small" data-ask="' + esc(q) + '">' + esc(q) + '</button>';
      }).join('') + '</div>' +
      '<div style="margin-top:14px"><a class="btn btn-small btn-ghost" href="#/settings">&#9881; AI Settings</a></div>';

    var box = document.getElementById('chat-box');
    function bubble(role, text, live) {
      var div = document.createElement('div');
      div.className = 'msg ' + (role === 'user' ? 'msg-user' : 'msg-mentor');
      div.innerHTML = '<span class="msg-role">' + (role === 'user' ? 'You' : 'ELEVO Mentor') +
        (role === 'mentor' ? '<span class="live-badge">' + (live ? 'LIVE AI' : 'DEMO') + '</span>' : '') + '</span>' + esc(text);
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
    function send(text) {
      if (!text.trim()) return;
      bubble('user', text);
      var t = document.createElement('div');
      t.className = 'typing'; t.textContent = 'THINKING...';
      box.appendChild(t); box.scrollTop = box.scrollHeight;
      api('/api/mentor', { method: 'POST', body: { message: text } }).then(function (r) {
        t.remove(); bubble('mentor', r.reply, r.live);
      }).catch(function (e) { t.remove(); bubble('mentor', 'Error: ' + e.message); });
    }
    document.getElementById('chat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('chat-input');
      send(input.value); input.value = '';
    });
    document.querySelectorAll('[data-ask]').forEach(function (b) {
      b.addEventListener('click', function () { send(b.getAttribute('data-ask')); });
    });
    api('/api/mentor').then(function (d) {
      box.innerHTML = '';
      if (!d.chat.length) bubble('mentor', 'Welcome to ELEVO. I know your goal, roadmap progress and portfolio in real time. What would you like to work on?', false);
      else d.chat.forEach(function (m) { bubble(m.role, m.text, m.live); });
    });
    syncShell();
  }

  /* ================= SETTINGS ================= */
  function renderSettings() {
    app.innerHTML = pageHead('Preferences', 'Settings', 'Profile, live AI connection and data control.');
    var body = document.createElement('div');
    app.appendChild(body);

    api('/api/settings').then(function (s) {
      body.innerHTML =
        '<div class="form-box" style="margin-bottom:22px"><h2 class="card-title" style="margin-bottom:14px">Profile</h2>' +
        '<div class="field"><label>Your name (used for greeting)</label><input id="st-name" maxlength="30" value="' + esc(s.profile.name) + '" placeholder="e.g. Ranjim"></div>' +
        '<button class="btn btn-small btn-solid" id="st-save-name">Save Name</button></div>' +

        '<div class="form-box" style="margin-bottom:22px"><h2 class="card-title" style="margin-bottom:6px">Live AI Mentor</h2>' +
        '<p class="card-text" style="margin-bottom:14px">Add a free API key to power the mentor with a real LLM. Without a key the built-in demo engine answers instead (always works, no key needed).</p>' +
        '<div class="field"><label>Provider</label><select id="st-provider">' +
        '<option value="openrouter" ' + (s.provider === 'openrouter' ? 'selected' : '') + '>OpenRouter (recommended - free models)</option>' +
        '<option value="huggingface" ' + (s.provider === 'huggingface' ? 'selected' : '') + '>Hugging Face Inference</option></select></div>' +
        '<div class="field"><label>Model</label><input id="st-model" value="' + esc(s.model) + '" placeholder="openrouter/free or HuggingFaceH4/zephyr-7b-beta"></div>' +
        '<div class="field"><label>API key ' + (s.hasKey ? '(saved: ' + esc(s.keyPreview) + ')' : '(not set)') + '</label>' +
        '<input id="st-key" type="password" placeholder="Paste your API key here"></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-small btn-solid" id="st-save-ai">Save AI Settings</button>' +
        '<button class="btn btn-small" id="st-test">Test Connection</button>' +
        (s.hasKey ? '<button class="btn btn-small btn-ghost" id="st-clear">Remove Key</button>' : '') +
        '</div><div id="st-test-out" style="margin-top:12px"></div></div>' +

        '<div class="form-box"><h2 class="card-title" style="margin-bottom:6px">Data</h2>' +
        '<p class="card-text" style="margin-bottom:12px">All your progress is stored locally in this app\'s database file.</p>' +
        '<button class="btn btn-small btn-ghost" id="st-reset">Reset All Progress</button></div>' +

        '<div class="card-text" style="margin-top:16px;font-size:12px">Free keys: OpenRouter &rarr; openrouter.ai/keys &middot; Hugging Face &rarr; huggingface.co/settings/tokens</div>';

      on('st-save-name', function () {
        api('/api/settings', { method: 'POST', body: { name: document.getElementById('st-name').value } })
          .then(function () { toast('Name saved'); });
      });

      function currentAI() {
        return {
          provider: document.getElementById('st-provider').value,
          model: document.getElementById('st-model').value.trim(),
          apiKey: document.getElementById('st-key').value.trim()
        };
      }

      on('st-save-ai', function () {
        var cfg = currentAI();
        if (!cfg.apiKey && !s.hasKey) { toast('Paste an API key first (or leave AI on demo mode)'); return; }
        api('/api/settings', { method: 'POST', body: cfg })
          .then(function () { toast('AI settings saved'); renderSettings(); });
      });

      on('st-test', function () {
        var out = document.getElementById('st-test-out');
        var cfg = currentAI();
        if (!cfg.apiKey) { out.innerHTML = '<div class="empty" style="padding:14px">Paste an API key to test</div>'; return; }
        out.innerHTML = '<div class="typing">TESTING...</div>';
        api('/api/settings/test', { method: 'POST', body: cfg }).then(function (r) {
          out.innerHTML = r.ok
            ? '<div class="next-step-bar" style="margin:0"><strong>Connection OK</strong><span>' + r.latencyMs + 'ms &middot; sample: "' + esc(r.sample) + '"</span></div>'
            : '<div class="empty" style="padding:14px">' + esc(r.error) + '</div>';
        }).catch(function (e) { out.innerHTML = '<div class="empty" style="padding:14px">' + esc(e.message) + '</div>'; });
      });

      var clearBtn = document.getElementById('st-clear');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        api('/api/settings', { method: 'POST', body: { clearKey: true } })
          .then(function () { toast('API key removed - back to demo mode'); renderSettings(); });
      });

      on('st-reset', function () {
        if (!confirm('Reset ALL progress, portfolio, chat and settings?')) return;
        api('/api/reset', { method: 'POST' }).then(function () {
          toast('Everything reset');
          location.hash = '#/welcome';
          setTimeout(function () { location.reload(); }, 400);
        });
      });
    });
    syncShell();
  }

  /* ================= ROUTER ================= */
  function router() {
    closeSheet();
    window.scrollTo(0, 0);
    var raw = location.hash.replace(/^#\/?/, '') || 'welcome';
    var parts = raw.split('/');
    var name = parts[0];
    if (name === 'menu') {
      sheet.classList.remove('hidden');
      backdrop.classList.remove('hidden');
      syncShell();
      return;
    }
    var fns = {
      welcome: renderWelcome, goal: renderGoal, home: renderHome, roadmap: renderRoadmap,
      learn: renderLearn, practice: renderPractice, portfolio: renderPortfolio,
      connect: renderConnect, opportunities: renderOpportunities, mentor: renderMentor,
      settings: renderSettings
    };
    if (name === 'opportunity' && parts[1]) return renderOpportunityDetail(parts[1]);
    (fns[name] || renderWelcome)();
  }

  window.addEventListener('hashchange', router);
  router();
})();
