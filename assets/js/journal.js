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

  /* settings store, two sources - native tab (new backend) or a
     hidden "carrier" entry (any backend). The carrier is kept out
     of every list, card, count and search on this page. */
  const SETTINGS_CARRIER_TITLE = '✦ TALA site settings (system entry - do not delete)';
  function isSettingsEntry_(e) { return e && e.title === SETTINGS_CARRIER_TITLE; }
  function parseJson_(t) { try { const j = JSON.parse(t); return (j && typeof j === 'object') ? j : null; } catch (e) { return null; } }
  function hasSettingsValues_(o) { return !!o && Object.keys(o).some(k => String(o[k] || '').trim() !== ''); }

  function richText(v) {
    return mdInline(escapeHtml(String(v))).replace(/\n/g, '<br>');
  }

  /* setting key → element id → how to render */
  const SETTING_MAP = [
    ['site_name',   'site-name',       'plain'],
    ['rail_sub',    'rail-sub',        'plain'],
    ['rail_sub2',   'rail-sub2',       'plain'],
    ['hero_kicker', 'hero-kicker',     'rich'],
    ['hero_title',  'hero-title',      'rich'],
    ['hero_lede',   'hero-lede',       'rich'],
    ['hero_note',   'hero-note',       'quill'],
    ['signature',   'hero-signature',  'plain'],
    ['rail_quote',  'rail-quote',      'plain'],
    ['about_who',   'about-who',       'plain'],
    ['about_role',  'about-role',      'rich'],
    ['about_text',  'about-text',      'rich'],
    ['footer_text', 'footer-text',     'rich'],
    ['footer_req_text', 'footer-req',  'rich'],
    ['footer_ai_text',  'footer-ai',   'rich'],
    ['calendar_title',  'cal-title',   'plain'],
    ['calendar_sub',    'cal-sub',     'rich'],
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
      return (data.ok && hasSettingsValues_(data.settings)) ? data.settings : null;
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
    return 'Personal';
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


/* GENERAL was renamed PERSONAL (v2.16) - keep legacy rows working */
function canonUnit(u) { return (String(u || '').trim().toLowerCase() === 'general') ? 'Personal' : u; }

  /* ---------- sidebar renderers ---------- */

  function renderUnitFilters() {
    const units = ['All', ...COURSE_MAP.map(u => u.unit), 'Personal'];
    $('#unit-filters').innerHTML = units.map(u =>
      `<button class="chip ${state.unit === u ? 'is-active' : ''}" data-unit="${u}">${u}</button>`
    ).join('');
    $('#unit-filters').querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', () => {
        state.unit = canonUnit(c.dataset.unit); state.module = 0;
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
    const units = ['All', ...COURSE_MAP.map(u => u.unit), 'Personal'];
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

  /* ---------- PDF flip-book (v2.19) ----------
     Same-origin PDFs (assets/pdf/...) become a compact, clickable page-flip book
     rendered lazily with pdf.js. Cross-origin/embedded viewers (Google Drive
     preview etc.) keep the built-in scrollable reader - browsers will not hand a
     page the raw bytes of those files, so a flip is not possible for them. */
  function ensurePdfEngine_() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (window.__pdfjsP) return window.__pdfjsP;
    window.__pdfjsP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('pdf engine failed to load'));
      document.head.appendChild(s);
    });
    return window.__pdfjsP;
  }

  function sameOriginPdf_(src) {
    if (/^https?:\/\/(drive|docs)\.google\.com/i.test(src)) return null;      // browser-blocked bytes
    if (!/\.pdf(\?|#|$)/i.test(src)) return null;
    try { new URL(src, location.href); } catch (e) { return null; }
    const abs = new URL(src, location.href);
    if (abs.origin === location.origin || /^\.\.?\//.test(src) || src[0] === '/') return abs.href;
    return null;                                                                  // cross-origin: keep the reader
  }

  function upgradePdfBooks_() {
    const frames = document.querySelectorAll('#reader-view .pdf-embed iframe');
    frames.forEach(fr => {
      const src = fr.getAttribute('src') || '';
      const direct = sameOriginPdf_(src);
      if (!direct) return;
      const wrap = fr.parentElement;
      const title = fr.getAttribute('title') || 'PDF document';
      const book = document.createElement('div');
      book.className = 'pdf-book';
      book.tabIndex = 0;
      book.setAttribute('role', 'group');
      book.setAttribute('aria-label', 'Flip through the PDF: ' + title);
      book.innerHTML =
        '<div class="pb-bar">' +
          '<button class="pb-btn pb-prev" aria-label="Previous page">&lsaquo;</button>' +
          '<span class="pb-page">…</span>' +
          '<button class="pb-btn pb-next" aria-label="Next page">&rsaquo;</button>' +
          '<span class="pb-title">' + escapeHtml(title) + '</span>' +
          '<a class="pb-open" href="' + direct + '" target="_blank" rel="noopener" title="Open the PDF in a new tab">&#8599;</a>' +
          '<button class="pb-btn pb-full" aria-label="Fullscreen">&#x26F6;</button>' +
        '</div>' +
        '<div class="pb-stage"><canvas></canvas><div class="pb-state">tap to flip · loading</div></div>';
      wrap.replaceChildren(book);
      initPdfBook_(book, direct, wrap);
    });
  }

  function initPdfBook_(book, src, originalWrap) {
    const state = { pdf: null, page: 1, n: 0, busy: false };
    const canvas = book.querySelector('canvas');
    const stage  = book.querySelector('.pb-stage');
    const pageEl = book.querySelector('.pb-page');
    const stateEl= book.querySelector('.pb-state');
    const fail = (msg) => {
      const fr = document.createElement('iframe');
      fr.src = src; fr.title = book.querySelector('.pb-title').textContent || 'PDF document'; fr.loading = 'lazy';
      const back = document.createElement('div'); back.className = 'pdf-embed'; back.appendChild(fr);
      book.replaceWith(back); console.warn('pdf flip-book fell back:', msg && msg.message || msg);
    };
    async function render(dir) {
      if (state.busy) return; state.busy = true;
      try {
        const pg = await state.pdf.getPage(state.page);
        const fitW = stage.clientWidth - (book.classList.contains('is-full') ? 96 : 28);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let vp = pg.getViewport({ scale: 1 });
        const scale = (Math.max(fitW, 220) / vp.width) * dpr;
        vp = pg.getViewport({ scale });
        canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
        canvas.style.width = (vp.width / dpr) + 'px'; canvas.style.height = (vp.height / dpr) + 'px';
        await pg.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        stateEl.classList.add('hidden');
        stage.classList.remove('flip-l', 'flip-r');
        void stage.offsetWidth;
        stage.classList.add(dir === 1 ? 'flip-r' : 'flip-l');
        pageEl.textContent = state.page + ' / ' + state.n;
      } catch (e) { fail(e); } finally { state.busy = false; }
    }
    function turn(d) {
      const next = state.page + d;
      if (next < 1 || next > state.n) { stage.classList.remove('flip-l','flip-r'); void stage.offsetWidth; stage.classList.add(d === 1 ? 'flip-r' : 'flip-l'); return; }
      state.page = next; render(d);
      const nx = next + d;
      if (nx >= 1 && nx <= state.n) state.pdf.getPage(nx).then(() => {}).catch(() => {});   // quiet prefetch
    }
    /* wiring (events only - library-free elsewhere) */
    book.querySelector('.pb-prev').addEventListener('click', e => { e.stopPropagation(); turn(-1); });
    book.querySelector('.pb-next').addEventListener('click', e => { e.stopPropagation(); turn(1); });
    stage.addEventListener('click', e => turn(e.offsetX > stage.clientWidth / 2 ? 1 : -1));
    book.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    });
    book.querySelector('.pb-full').addEventListener('click', () => {
      (document.fullscreenElement === book) ? document.exitFullscreen() : book.requestFullscreen().catch(() => {});
    });
    document.addEventListener('fullscreenchange', () => {
      const full = document.fullscreenElement === book;
      book.classList.toggle('is-full', full);
      if (state.pdf) setTimeout(() => render(1), 80);
    });
    /* lazy start: engine loads only when the book scrolls into view */
    const io = new IntersectionObserver(async (ents) => {
      if (!ents.some(en => en.isIntersecting)) return;
      io.disconnect();
      try {
        const lib = await ensurePdfEngine_();
        state.pdf = await lib.getDocument(src).promise;
        state.n = state.pdf.numPages;
        pageEl.textContent = '1 / ' + state.n;
        stateEl.textContent = 'tap to flip';
        render(1);
      } catch (e) { fail(e); }
    }, { rootMargin: '240px' });
    io.observe(book);
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
      <nav class="entry-toc" id="entry-toc" hidden></nav>
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

    buildTOC_();
    if (window.linkCitations) linkCitations(document.querySelector('#reader-view .reader-body'));
    upgradePdfBooks_();
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

  /* ---------- sticky "on this reading" pill bar (v2.10) ----------
     Built from the entry's own headings; sticky under the top bar,
     highlights the section in view via IntersectionObserver (no scroll loops). */
  let tocObserver = null;
  function buildTOC_() {
    const nav = $('#entry-toc');
    if (!nav) return;
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const body = document.querySelector('#reader-view .reader-body');
    const heads = body ? [...body.querySelectorAll('h1,h2,h3,h4,h5,h6')] : [];
    if (heads.length < 3) { nav.hidden = true; nav.innerHTML = ''; return; }
    heads.forEach((h, i) => { if (!h.id) h.id = 'toc-sec-' + i; });
    const trunc = s => (s.trim().length > 48 ? s.trim().slice(0, 47) + '…' : s.trim());
    nav.innerHTML = '<span class="toc-head">On this reading&nbsp;·</span>' +
      heads.map(h => `<a class="toc-pill" href="#${h.id}" data-t="${h.id}">${escapeHtml(trunc(h.textContent))}</a>`).join('');
    nav.hidden = false;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.onclick = e => {
      const a = e.target && e.target.closest ? e.target.closest('a.toc-pill') : null;
      if (!a) return;
      e.preventDefault();
      const el = document.getElementById(a.getAttribute('data-t'));
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    tocObserver = new IntersectionObserver(rows => {
      rows.forEach(r => {
        if (!r.isIntersecting) return;
        nav.querySelectorAll('a.toc-pill').forEach(p =>
          p.classList.toggle('is-active', p.getAttribute('data-t') === r.target.id));
      });
    }, { rootMargin: '-14% 0px -74% 0px' });
    heads.forEach(h => tocObserver.observe(h));
  }

  /* ---------- figure lightbox (v2.10) ----------
     One overlay element; event delegation; Esc/arrows; no library, no loops. */
  function initLightbox_() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', 'Figure viewer');
    lb.innerHTML =
      '<button class="lb-close" type="button" aria-label="Close">×</button>' +
      '<button class="lb-nav lb-prev" type="button" aria-label="Previous figure">‹</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-nav lb-next" type="button" aria-label="Next figure">›</button>';
    document.body.appendChild(lb);

    let figs = [], idx = 0, open = false;
    const imgEl = () => lb.querySelector('img');
    const capEl = () => lb.querySelector('figcaption');

    function collect() {
      figs = [...document.querySelectorAll('#reader-view .reader-body .media-figure img')];
    }
    function show(i) {
      if (!figs.length) return;
      idx = (i + figs.length) % figs.length;
      const im = figs[idx];
      imgEl().src = im.currentSrc || im.src;
      imgEl().alt = im.alt || '';
      const fig = im.closest('figure');
      const cap = fig && fig.querySelector('figcaption');
      capEl().textContent = cap ? cap.textContent : (im.alt || '');
      const multi = figs.length > 1;
      lb.querySelector('.lb-prev').hidden = !multi;
      lb.querySelector('.lb-next').hidden = !multi;
    }
    function openBox(img) {
      collect();
      if (!figs.length) return;
      const at = figs.indexOf(img);
      show(at < 0 ? 0 : at);
      lb.hidden = false; open = true;
      document.body.classList.add('lb-open');
    }
    function closeBox() {
      lb.hidden = true; open = false;
      document.body.classList.remove('lb-open');
      imgEl().src = '';
    }

    document.addEventListener('click', e => {
      if (!open) {
        const img = e.target && e.target.closest ?
          e.target.closest('#reader-view .reader-body .media-figure img') : null;
        if (img) { e.preventDefault(); openBox(img); }
        return;
      }
      if (e.target === lb || (e.target.closest && e.target.closest('.lb-close'))) return closeBox();
      if (e.target.closest && e.target.closest('.lb-next')) return show(idx + 1);
      if (e.target.closest && e.target.closest('.lb-prev')) return show(idx - 1);
    });

    /* capture phase: Esc closes the lightbox before the reader's own Esc handler */
    document.addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closeBox(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    }, true);
  }
  initLightbox_();

  /* ---------- RSS link (only when backend is connected) ---------- */
  if (!DEMO) {
    const rss = $('#rss-link');
    if (rss) { rss.href = API + '?action=rss'; rss.classList.remove('hidden'); }
  }

  /* ---------- boot (cache-first, then fresh) ---------- */
  const CACHE_KEY = 'tala_entries_cache';

  function paint(entries) {
    state.entries = entries.map(e => { e.unit = canonUnit(e.unit); return e; });
    renderSources(); renderAll(); route();
  }

  window.addEventListener('hashchange', route);
  $('#search').addEventListener('input', ev => {
    state.search = ev.target.value; renderEntries();
  });

  let nativeSettingsApplied = false;
  function applySettingsFresh(s) {
    try { localStorage.setItem(SETCACHE, JSON.stringify(s)); } catch (e) { /* full */ }
    applySettings(s);
  }

  // instant paint from cache (backend mode only), then fetch fresh
  if (!DEMO) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.length) {
        paint(cached.filter(e => !isSettingsEntry_(e)));
        $('#cache-note').classList.remove('hidden');
      }
    } catch (e) { /* corrupted cache: ignore */ }
    try {
      const cachedSettings = JSON.parse(localStorage.getItem(SETCACHE) || 'null');
      if (cachedSettings) applySettings(cachedSettings);
    } catch (e) { /* ignore */ }
  }

  loadSettings().then(s => {
    if (!s) return;
    nativeSettingsApplied = true;
    applySettingsFresh(s);
  });

  loadEntries()
    .then(fetched => {
      // the hidden carrier entry supplies settings on any backend version
      const carrier = fetched.find(isSettingsEntry_);
      const entries = fetched.filter(e => !isSettingsEntry_(e));
      if (carrier && !nativeSettingsApplied) {
        const s = parseJson_(carrier.content);
        if (s && hasSettingsValues_(s)) applySettingsFresh(s);
      }
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
