/* =========================================================
   TALA - public journal logic + view router
   Views: journal (#/) · calendar (#/calendar) · reader (#/entry/id)
   Entries come from Google Apps Script (or demo seed data).
   ========================================================= */

(function () {
  const API = (JOURNAL_CONFIG.API_URL || '').trim();
  const DEMO = API === '';

  const state = {
    entries: [],
    unit: 'All',
    category: 'All',
    module: 0,          // 0 = any
    search: '',
  };

  /* ---------- site settings (v2.2: editable site parts + socials) ---------- */

  const SETCACHE = 'tala_settings_cache';

  function richText(v) {
    return mdInline(escapeHtml(String(v))).replace(/\n/g, '<br>');
  }

  /* setting key → element id → how to render */
  const SETTING_MAP = [
    ['site_name',   'site-name',       'plain'],
    ['rail_sub',    'rail-sub',        'plain'],
    ['hero_kicker', 'hero-kicker',     'rich'],
    ['hero_title',  'hero-title',      'rich'],
    ['hero_lede',   'hero-lede',       'rich'],
    ['hero_note',   'hero-note',       'quill'],
    ['signature',   'hero-signature',  'plain'],
    ['rail_quote',  'rail-quote',      'plain'],
    ['about_role',  'about-role',      'rich'],
    ['about_text',  'about-text',      'rich'],
    ['footer_text', 'footer-text',     'rich'],
  ];

  function renderSocials(sel, s) {
    const box = document.querySelector(sel);
    if (!box) return;
    const pills = [];
    [['social_facebook', 'Facebook'],
     ['social_instagram', 'Instagram'],
     ['social_linkedin', 'LinkedIn'],
     ['social_youtube', 'YouTube']].forEach(([k, label]) => {
      const url = (s[k] || '').trim();
      if (url) pills.push(`<a class="social-pill" href="${escapeHtml(url)}" target="_blank" rel="noopener">${label} ↗</a>`);
    });
    const mail = (s.social_email || '').trim();
    if (mail) pills.push(`<a class="social-pill" href="mailto:${escapeHtml(mail)}">Email ✉</a>`);
    box.innerHTML = pills.join('');
    box.classList.toggle('hidden', pills.length === 0);
  }

  function applySettings(s) {
    if (!s || typeof s !== 'object') return;
    SETTING_MAP.forEach(([key, id, mode]) => {
      const v = (s[key] || '').trim();
      if (!v) return;                       // empty setting: keep the page's built-in text
      const el = document.getElementById(id);
      if (!el) return;
      if (mode === 'plain') el.textContent = v;
      else if (mode === 'quill') el.innerHTML = '✎ ' + richText(v);
      else el.innerHTML = richText(v);
    });

    renderSocials('#hero-socials', s);
    renderSocials('#footer-socials', s);

    const slot = document.getElementById('intro-video-slot');
    const vid = (s.intro_video || '').trim();
    if (slot && vid && typeof playerHtml_ === 'function') {
      const cap = (s.intro_video_caption || '').trim();
      const title = (s.intro_video_title || 'an introduction, on video').trim();
      slot.innerHTML = `
        <section class="intro-video">
          <div class="kicker">${escapeHtml(title)}</div>
          <figure class="media-figure player">
            ${playerHtml_({ alt: cap || 'Video', url: vid })}
            ${cap ? `<figcaption>${richText(cap)}</figcaption>` : ''}
          </figure>
        </section>`;
    }
  }

  async function loadSettings() {
    if (DEMO) return null;
    try {
      const res = await fetch(API + '?action=settings');
      if (!res.ok) return null;
      const data = await res.json();
      return data.ok ? (data.settings || {}) : null;
    } catch (err) { return null; }
  }

  /* ---------- data ---------- */

  async function loadEntries() {
    if (DEMO) {
      document.getElementById('demo-banner').classList.remove('hidden');
      return SEED_ENTRIES.filter(e => e.status === 'published');
    }
    const res = await fetch(API + '?action=list', { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Backend error');
    return data.entries;
  }

  /* ---------- helpers ---------- */

  const $ = sel => document.querySelector(sel);

  function moduleTitle(n) {
    for (const u of COURSE_MAP) {
      const m = u.modules.find(m => m.n === Number(n));
      if (m) return `M${m.n} · ${m.title}`;
    }
    return '';
  }

  function unitOfModule(n) {
    for (const u of COURSE_MAP) {
      if (u.modules.some(m => m.n === Number(n))) return u.unit;
    }
    return 'General';
  }

  function fmtDate(d) {
    if (!d) return '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
    if (isNaN(date)) return escapeHtml(d);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function tagsOf(e) {
    return String(e.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  }

  /* ---------- filtering ---------- */

  function visible() {
    const q = state.search.toLowerCase();
    return state.entries
      .filter(e => state.unit === 'All' || (e.unit || unitOfModule(e.module)) === state.unit)
      .filter(e => state.category === 'All' || e.category === state.category)
      .filter(e => !state.module || Number(e.module) === state.module)
      .filter(e => !q ||
        (e.title + ' ' + (e.excerpt || '') + ' ' + (e.content || '') + ' ' + (e.tags || ''))
          .toLowerCase().includes(q))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  /* ---------- sidebar renderers ---------- */

  function renderUnitFilters() {
    const units = ['All', ...COURSE_MAP.map(u => u.unit), 'General'];
    $('#unit-filters').innerHTML = units.map(u =>
      `<button class="chip ${state.unit === u ? 'is-active' : ''}" data-unit="${u}">${u}</button>`
    ).join('');
    $('#unit-filters').querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', () => {
        state.unit = c.dataset.unit; state.module = 0;
        renderAll();
      }));
  }

  function renderCategoryFilters() {
    const cats = ['All', ...new Set(state.entries.map(e => e.category).filter(Boolean))];
    $('#category-filters').innerHTML = cats.map(c =>
      `<button class="chip ${state.category === c ? 'is-active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('');
    $('#category-filters').querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', () => { state.category = c.dataset.cat; renderAll(); }));
  }

  function renderCourseMap() {
    const counts = {};
    state.entries.forEach(e => { counts[e.module] = (counts[e.module] || 0) + 1; });

    $('#course-map-body').innerHTML = COURSE_MAP.map(u => `
      <div class="unit-block">
        <div class="unit-title"><span>${u.unit} · ${u.theme}</span>
          <span class="count">${u.modules.reduce((s, m) => s + (counts[m.n] || 0), 0)} notes</span></div>
        ${u.modules.map(m => `
          <button class="module-row ${state.module === m.n ? 'is-active' : ''}" data-module="${m.n}">
            <span class="mnum">${m.n}</span>
            <span>${m.title}</span>
            ${counts[m.n] ? `<span class="has-notes" style="margin-left:auto">✎ ${counts[m.n]}</span>` : ''}
          </button>`).join('')}
      </div>`).join('');

    $('#course-map-body').querySelectorAll('.module-row').forEach(r =>
      r.addEventListener('click', () => {
        state.module = state.module === Number(r.dataset.module) ? 0 : Number(r.dataset.module);
        state.unit = 'All';
        renderAll();
        document.getElementById('entries-heading').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
  }

  function renderSources() {
    $('#sources-list').innerHTML = SOURCES.map(s =>
      `<li>${mdInline(escapeHtml(s.label))}<span class="note">${escapeHtml(s.note)}</span></li>`
    ).join('');
  }

  /* ---------- rail navigation (sidebar) ---------- */

  function goJournal() {
    if (location.hash !== '' && location.hash !== '#/') location.hash = '#/';
    else showJournal();
    renderAll();
    const head = document.getElementById('entries-heading');
    if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderRailNav() {
    const counts = {};
    state.entries.forEach(e => { counts[e.module] = (counts[e.module] || 0) + 1; });

    // unit browse
    const units = ['All', ...COURSE_MAP.map(u => u.unit), 'General'];
    $('#rail-units').innerHTML = units.map(u =>
      `<button class="rail-link ${state.unit === u && !state.module ? 'is-active' : ''}" data-unit="${u}">
         ${u === 'All' ? 'All entries' : u}
       </button>`).join('');
    $('#rail-units').querySelectorAll('.rail-link').forEach(b =>
      b.addEventListener('click', () => {
        state.unit = b.dataset.unit; state.module = 0; state.category = 'All';
        goJournal();
      }));

    // module quick-jump
    $('#rail-modules').innerHTML = COURSE_MAP.map(u =>
      `<div class="rail-unit-mini">${u.unit} · ${u.theme}</div>` +
      u.modules.map(m => `
        <button class="rail-link ${state.module === m.n ? 'is-active' : ''}" data-mod="${m.n}">
          <span class="mnum">${m.n}</span>${m.title}
          ${counts[m.n] ? `<span class="rn">${counts[m.n]}</span>` : ''}
        </button>`).join('')
    ).join('');
    $('#rail-modules').querySelectorAll('.rail-link').forEach(b =>
      b.addEventListener('click', () => {
        const n = Number(b.dataset.mod);
        state.module = state.module === n ? 0 : n;
        state.unit = 'All'; state.category = 'All';
        goJournal();
      }));

    // fresh ink: 3 latest entries
    const recent = [...state.entries]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 3);
    $('#rail-recent').innerHTML = recent.length
      ? recent.map(e => `
          <a class="rail-recent-item" href="#/entry/${encodeURIComponent(e.id)}">
            <span class="t">${escapeHtml(e.title)}</span>
            <span class="d">${fmtDate(e.date)}</span>
          </a>`).join('')
      : '<div class="rail-recent-empty">No entries yet.</div>';
  }

  /* ---------- entries ---------- */

  function entryCard(e) {
    const unit = e.unit || unitOfModule(e.module);
    const mod = Number(e.module) ? moduleTitle(e.module) : '';
    const tags = tagsOf(e).slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    return `
      <a class="entry-card" href="#/entry/${encodeURIComponent(e.id)}">
        <div class="meta-row">
          <span class="badge unit">${escapeHtml(unit)}</span>
          ${mod ? `<span class="badge module">${escapeHtml(mod)}</span>` : ''}
          <span class="badge category">${escapeHtml(e.category || 'Note')}</span>
          <span class="date">${fmtDate(e.date)}</span>
        </div>
        <h3>${escapeHtml(e.title)}</h3>
        <p class="excerpt">${escapeHtml(e.excerpt || mdToPlain(e.content).slice(0, 180) + '…')}</p>
        <div class="foot">
          <span class="tags">${tags}</span>
          <span class="read-more">Read entry →</span>
        </div>
      </a>`;
  }

  function renderEntries() {
    const list = visible();
    $('#count-pill').textContent = list.length;
    $('#entries-heading').textContent =
      state.module ? moduleTitle(state.module) :
      state.unit !== 'All' ? state.unit :
      state.category !== 'All' ? state.category : 'All entries';

    $('#entry-grid').innerHTML = list.length
      ? list.map(entryCard).join('')
      : `<div class="empty-state"><div class="big">✎</div>
           Nothing here yet under this filter.<br>Try another module, or clear your search.</div>`;

    $('#stat-entries').textContent = state.entries.length;
    $('#stat-modules').textContent =
      new Set(state.entries.map(e => Number(e.module)).filter(n => n >= 1 && n <= 13)).size + ' / 13';
  }

  function renderAll() {
    renderUnitFilters(); renderCategoryFilters(); renderCourseMap(); renderEntries();
    renderRailNav();
  }

  /* ---------- view router ---------- */

  const VIEWS = ['journal-view', 'calendar-view', 'reader-view'];

  function activate(viewId) {
    VIEWS.forEach(v => document.getElementById(v).classList.toggle('hidden', v !== viewId));
    document.querySelectorAll('.rail-nav a[data-view]').forEach(a => {
      const want =
        (viewId === 'journal-view' || viewId === 'reader-view') ? 'journal' :
        viewId === 'calendar-view' ? 'calendar' : '';
      a.classList.toggle('is-active', a.dataset.view === want);
    });
  }

  function showJournal() {
    activate('journal-view');
    document.title = 'Tala · The Learning Journal of Arnold C. Noda';
  }

  function showCalendar() {
    activate('calendar-view');
    document.title = 'Calendar · Tala';
    window.scrollTo({ top: 0 });
    if (window.TalaCalendar) TalaCalendar.show();
  }

  function showReader(id) {
    const e = state.entries.find(x => String(x.id) === String(id));
    if (!e) { location.hash = '#/'; return; }

    const unit = e.unit || unitOfModule(e.module);
    const mod = Number(e.module) ? moduleTitle(e.module) : '';
    const tags = tagsOf(e).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    // prev (older) / next (newer), by date
    const byDate = [...state.entries].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const idx = byDate.findIndex(x => String(x.id) === String(id));
    const newer = idx > 0 ? byDate[idx - 1] : null;
    const older = idx > -1 && idx < byDate.length - 1 ? byDate[idx + 1] : null;

    $('#reader-view').innerHTML = `
      <a class="back-link" href="#/">← Back to all entries</a>
      <div class="meta-row">
        <span class="badge unit">${escapeHtml(unit)}</span>
        ${mod ? `<span class="badge module">${escapeHtml(mod)}</span>` : ''}
        <span class="badge category">${escapeHtml(e.category || 'Note')}</span>
        <span class="date">${fmtDate(e.date)}</span>
        <button class="btn ghost small copy-btn" id="copy-link">⧉ copy link</button>
      </div>
      <h1 class="title">${escapeHtml(e.title)}</h1>
      <div class="reader-body">${mdToHtml(e.content)}</div>
      ${tags ? `<div class="tags-row">Filed under: ${tags}</div>` : ''}
      <div class="marginalia" style="margin-top:44px">✎ more soon. the semester is still unfolding.<br>- arnold</div>
      <div class="prevnext">
        ${older ? `<a class="pn" href="#/entry/${encodeURIComponent(older.id)}">
            <span class="dir">← previous note</span>
            <span class="t">${escapeHtml(older.title)}</span></a>` : '<span></span>'}
        ${newer ? `<a class="pn right" href="#/entry/${encodeURIComponent(newer.id)}">
            <span class="dir">next note →</span>
            <span class="t">${escapeHtml(newer.title)}</span></a>` : '<span></span>'}
      </div>
    `;
    activate('reader-view');
    window.scrollTo({ top: 0 });
    document.title = e.title + ' · Tala';

    $('#copy-link').addEventListener('click', () => {
      const url = location.href;
      const done = () => toast('Link copied to clipboard');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy this link:', url));
      } else {
        prompt('Copy this link:', url);
      }
    });
  }

  function route() {
    const entry = location.hash.match(/^#\/entry\/(.+)$/);
    if (entry) { showReader(decodeURIComponent(entry[1])); return; }
    if (location.hash === '#/calendar') { showCalendar(); return; }
    showJournal();
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- reading progress ---------- */
  window.addEventListener('scroll', () => {
    const hidden = $('#reader-view').classList.contains('hidden');
    const bar = $('#reader-progress');
    if (hidden) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    const p = total > 0 ? Math.min(h.scrollTop / total, 1) : 0;
    $('#reader-progress-bar').style.width = (p * 100).toFixed(2) + '%';
  }, { passive: true });

  /* ---------- keyboard shortcuts ---------- */
  document.addEventListener('keydown', e => {
    const typing = document.activeElement &&
      /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === 'Escape' && !$('#reader-view').classList.contains('hidden')) {
      location.hash = '#/';
    }
    if (e.key === '/' && !typing && !$('#journal-view').classList.contains('hidden')) {
      e.preventDefault();
      $('#search').focus();
    }
  });

  /* ---------- RSS link (only when backend is connected) ---------- */
  if (!DEMO) {
    const rss = $('#rss-link');
    if (rss) { rss.href = API + '?action=rss'; rss.classList.remove('hidden'); }
  }

  /* ---------- boot (cache-first, then fresh) ---------- */
  const CACHE_KEY = 'tala_entries_cache';

  function paint(entries) {
    state.entries = entries;
    renderSources(); renderAll(); route();
  }

  window.addEventListener('hashchange', route);
  $('#search').addEventListener('input', ev => {
    state.search = ev.target.value; renderEntries();
  });

  // instant paint from cache (backend mode only), then fetch fresh
  if (!DEMO) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.length) { paint(cached); $('#cache-note').classList.remove('hidden'); }
    } catch (e) { /* corrupted cache: ignore */ }
    try {
      const cachedSettings = JSON.parse(localStorage.getItem(SETCACHE) || 'null');
      if (cachedSettings) applySettings(cachedSettings);
    } catch (e) { /* ignore */ }
  }

  loadSettings().then(s => {
    if (!s) return;
    try { localStorage.setItem(SETCACHE, JSON.stringify(s)); } catch (e) { /* full */ }
    applySettings(s);
  });

  loadEntries()
    .then(entries => {
      if (!DEMO) localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
      $('#cache-note').classList.add('hidden');
      paint(entries);
    })
    .catch(err => {
      console.error(err);
      const hadCache = state.entries.length > 0;
      route();
      if (hadCache) {
        $('#cache-note').classList.remove('hidden');
        return; // cached copy already on screen
      }
      $('#entry-grid').innerHTML = `
        <div class="empty-state"><div class="big">⚠</div>
          Couldn't reach your Google Sheet backend.<br>
          Check <b>assets/js/config.js</b> (README, Part 2) and your Apps Script deployment.
        </div>`;
    });
})();
