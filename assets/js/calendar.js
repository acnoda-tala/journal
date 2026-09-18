/* =========================================================
   TALA - personal calendar
   Deadlines, activities, readings, personal notes.

   Data source:
   - Backend connected (config.js API_URL): Google Sheet
     "Events" tab via Apps Script. Public visitors see only
     events marked public; after signing in at the admin desk
     (key saved in this tab), Arnold sees and edits all.
   - Demo mode: built-in sample events plus anything you add,
     kept in this browser's localStorage until the backend
     is connected.

   Exposes window.TalaCalendar for the router in journal.js.
   ========================================================= */

const TalaCalendar = (function () {
  const API = (JOURNAL_CONFIG.API_URL || '').trim();
  const DEMO = API === '';

  const TYPES = [
    { id: 'deadline', label: 'Deadline', css: 't-deadline' },
    { id: 'tma',      label: 'TMA',      css: 't-tma' },
    { id: 'activity', label: 'Activity', css: 't-activity' },
    { id: 'personal', label: 'Personal', css: 't-personal' },
  ];
  const typeCss  = t => (TYPES.find(x => x.id === t) || TYPES[3]).css;
  const typeName = t => (TYPES.find(x => x.id === t) || TYPES[3]).label;

  /* Demo-mode events: the real DEVC 202 semester map (1S 2026-2027),
     from the Course Guide grading matrix and recommended study sequence.
     Once live, these come from your Sheet instead (importDevCalendar). */
  const SEED_EVENTS = [
    { id: 'sv01', date: '2026-09-21', type: 'activity', title: 'Module 4: Of Blind Men and Paradigms', note: 'Chapter 4 + activities. TMA 1 week.', scope: 'public' },
    { id: 'sv02', date: '2026-09-27', type: 'tma', title: 'TMA 1 due (10%)', note: 'Societal Problems scrapbook + 10-day inventory. No submissions after this day.', scope: 'public' },
    { id: 'sv03', date: '2026-09-28', type: 'activity', title: 'Module 5: The Communication Process', note: 'Chapter 5 + activities.', scope: 'public' },
    { id: 'sv04', date: '2026-10-05', type: 'activity', title: 'Module 6: Communication Media', note: 'Chapter 6 + activities.', scope: 'public' },
    { id: 'sv05', date: '2026-10-12', type: 'activity', title: 'Module 7: Barriers to Effective Communication', note: 'Chapter 7 + activities.', scope: 'public' },
    { id: 'sv06', date: '2026-10-19', type: 'activity', title: 'Module 8: Communication Concepts', note: 'Chapter 8 + activities. TMA 2 week.', scope: 'public' },
    { id: 'sv07', date: '2026-10-25', type: 'tma', title: 'TMA 2 due (10%)', note: 'Study: why is poverty still prevalent in the Philippines?', scope: 'public' },
    { id: 'sv08', date: '2026-10-26', type: 'activity', title: 'Module 9: Definitions of DevCom', note: 'Chapter 9 + activities.', scope: 'public' },
    { id: 'sv09', date: '2026-11-02', type: 'activity', title: 'Module 10: Foundations of DevCom', note: 'Chapter 10 + activities.', scope: 'public' },
    { id: 'sv10', date: '2026-11-09', type: 'activity', title: 'Module 11: DevCom Practice', note: 'Chapter 11 + activities.', scope: 'public' },
    { id: 'sv11', date: '2026-11-16', type: 'activity', title: 'Module 12: DevCom and Policy', note: 'Chapter 12 + activities. TMA 3 week.', scope: 'public' },
    { id: 'sv12', date: '2026-11-22', type: 'tma', title: 'TMA 3 due (10%)', note: 'The Proactive Information Society (Flor, 1983).', scope: 'public' },
    { id: 'sv13', date: '2026-11-23', type: 'activity', title: 'Module 13: DevCom Myths', note: 'Chapter 13 + activities.', scope: 'public' },
    { id: 'sv14', date: '2026-11-29', type: 'deadline', title: 'Discussion Forums 1-3 due (10%)', note: 'Posts and reactions close today.', scope: 'public' },
    { id: 'sv15', date: '2026-11-30', type: 'activity', title: 'Review week', note: 'Finish all activity sheets. Study for the final examination.', scope: 'public' },
    { id: 'sv16', date: '2026-12-06', type: 'deadline', title: 'DEVC 202 Journal due (20%)', note: 'This journal. The whole point of Tala. Keep writing.', scope: 'public' },
    { id: 'sv17', date: '2026-12-06', type: 'deadline', title: 'Reflection Synthesis Piece due (20%)', note: 'Weave the journal threads into one piece.', scope: 'public' },
    { id: 'sv18', date: '2026-12-07', type: 'activity', title: 'Final sprint: film the vlog', note: 'Shoot and edit. Due Dec 18.', scope: 'public' },
    { id: 'sv19', date: '2026-12-18', type: 'deadline', title: 'Vlog due: Looking Back, Moving Forward (20%)', note: 'Last submission of the semester.', scope: 'public' },
  ];

  const state = {
    events: [],
    loaded: false,
    year: 0, month: 0,             // current grid
    selected: todayISO(),          // selected day
    editingId: null,
  };

  function KEY() { return sessionStorage.getItem('tala_key') || ''; }
  function editable() { return DEMO || !!KEY(); }

  /* ---------- helpers ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function ofDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return { y, m, d };
  }
  function fmtLong(iso) {
    const { y, m, d } = ofDate(iso);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  /* "today" / "tomorrow" / "in 5 days" / "3 days ago" + urgency flag */
  function relDay(iso) {
    const t = new Date(todayISO() + 'T00:00:00');
    const d = new Date(iso + 'T00:00:00');
    const n = Math.round((d - t) / 86400000);
    if (n === 0)  return { text: 'today', urgent: true };
    if (n === 1)  return { text: 'tomorrow', urgent: true };
    if (n === -1) return { text: 'yesterday', urgent: false };
    if (n > 1)    return { text: 'in ' + n + ' days', urgent: n <= 3 };
    return { text: (-n) + ' days ago', urgent: false };
  }
  function esc(s) { return escapeHtml(s || ''); }

  /* ---------- data ---------- */
  function loadLocal() {
    let user = [];
    try { user = JSON.parse(localStorage.getItem('tala_events_local') || '[]'); } catch (e) {}
    state.events = [...SEED_EVENTS, ...user];
    state.loaded = true;
  }
  function saveLocalUser() {
    const user = state.events.filter(e => String(e.id).startsWith('loc'));
    localStorage.setItem('tala_events_local', JSON.stringify(user));
  }

  async function loadRemote() {
    async function attempt(params) {
      const res = await fetch(API + '?' + new URLSearchParams(params));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let data;
      try { data = await res.json(); }
      catch (e) { throw new Error('backend returned a non-JSON reply'); }
      if (!data.ok) throw new Error(data.error || 'backend error');
      return data;
    }

    // First choice: everything, if we hold a valid journal key.
    if (KEY()) {
      try {
        const d = await attempt({ action: 'eventsAll', key: KEY() });
        state.events = d.events;
        state.loaded = true;
        return;
      } catch (e) {
        // A stale or mistyped key should never break the calendar.
        // Drop it; the admin desk will simply ask for it again.
        console.warn('calendar: keyed load failed (' + e.message + '). Falling back to public events.');
        sessionStorage.removeItem('tala_key');
        state.keyDropped = true;
      }
    }

    // Fallback: public events only.
    const d = await attempt({ action: 'events' });
    state.events = d.events;
    state.loaded = true;
  }

  async function ensureLoaded() {
    if (state.loaded) return;
    if (DEMO) { loadLocal(); return; }
    try { await loadRemote(); }
    catch (err) {
      console.error(err);
      document.getElementById('calendar-root').innerHTML =
        '<div class="empty-state"><div class="big">⚠</div>Could not load your calendar from the Google Sheet.<br>' +
        '<b>Reason: ' + esc(String((err && err.message) || err)) + '</b><br><br>' +
        'Usual fixes: sign in again at the <a href="admin.html">admin desk</a> with the exact ADMIN_KEY, ' +
        'or re-run setupSheet and redeploy Apps Script as a <b>New version</b> (README, "The personal calendar").</div>';
      throw err;
    }
  }

  async function persist(action, payload) {
    if (DEMO) {
      if (action === 'eventCreate') {
        payload.event.id = 'loc' + Date.now().toString(36);
        state.events.push(payload.event);
      } else if (action === 'eventUpdate') {
        const i = state.events.findIndex(e => String(e.id) === String(payload.id));
        if (i > -1) state.events[i] = { ...state.events[i], ...payload.event };
      } else if (action === 'eventDelete') {
        state.events = state.events.filter(e => String(e.id) !== String(payload.id));
      }
      if (!String((payload.event || {}).id || payload.id || '').startsWith('sev') || action === 'eventCreate') saveLocalUser();
      return { ok: true };
    }
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, key: KEY() }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'save failed');
    if (action === 'eventCreate') {
      state.events.push({ ...payload.event, id: data.id });
    } else if (action === 'eventUpdate') {
      const i = state.events.findIndex(e => String(e.id) === String(payload.id));
      if (i > -1) state.events[i] = { ...state.events[i], ...payload.event };
    } else if (action === 'eventDelete') {
      state.events = state.events.filter(e => String(e.id) !== String(payload.id));
    }
    return data;
  }

  /* ---------- rendering ---------- */
  function eventsOn(iso) {
    return state.events.filter(e => e.date === iso)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  function renderGrid() {
    const { y, m } = { y: state.year, m: state.month };
    const first = new Date(y, m - 1, 1);
    const startDow = first.getDay();               // 0 = Sunday
    const daysIn = new Date(y, m, 0).getDate();
    const daysPrev = new Date(y, m - 1, 0).getDate();
    const today = todayISO();

    const monthLabel = first.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

    let cells = '';
    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dows.forEach(d => { cells += `<div class="cal-dow">${d}</div>`; });

    for (let i = 0; i < 42; i++) {
      let iso, dim = false;
      if (i < startDow) {
        dim = true;
        iso = `${y}-${pad(m - 1 || 12)}-${pad(daysPrev - startDow + i + 1)}`;
      } else if (i >= startDow + daysIn) {
        dim = true;
        iso = `${y}-${pad(m + 1 > 12 ? 1 : m + 1)}-${pad(i - startDow - daysIn + 1)}`;
      } else {
        iso = `${y}-${pad(m)}-${pad(i - startDow + 1)}`;
      }
      const { d } = ofDate(iso);
      const evs = eventsOn(iso);
      const shown = evs.slice(0, 2);
      cells += `
        <div class="cal-day ${dim ? 'dim' : ''} ${iso === today ? 'is-today' : ''} ${iso === state.selected ? 'is-selected' : ''}"
             data-date="${iso}">
          <span class="num">${d}</span>
          ${!dim && evs.length ? `<div class="cal-events">
            ${shown.map(e => `<div class="ev-pill ${typeCss(e.type)}" title="${esc(e.title)}">${esc(e.title)}</div>`).join('')}
            ${evs.length > 2 ? `<div class="ev-more">+${evs.length - 2} more</div>` : ''}
          </div>` : ''}
        </div>`;
    }

    const legend = TYPES.map(t =>
      `<span><i class="legend-dot" style="background:${{ deadline: 'var(--maroon)', tma: 'var(--gold)', activity: 'var(--green)', personal: '#7c7c76' }[t.id]}"></i>${t.label}</span>`).join('');

    document.getElementById('cal-grid-slot').innerHTML = `
      <div class="cal-toolbar">
        <button class="cal-nav-btn" data-nav="-1" aria-label="Previous month">←</button>
        <button class="cal-nav-btn" data-nav="1" aria-label="Next month">→</button>
        <span class="month-label">${monthLabel}</span>
        <button class="btn ghost small cal-today-btn" data-nav="today">Today</button>
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend">${legend}</div>`;

    document.getElementById('cal-grid-slot').querySelectorAll('.cal-day').forEach(c =>
      c.addEventListener('click', () => {
        state.selected = c.dataset.date;
        const { y, m } = ofDate(state.selected);
        state.year = y; state.month = m;
        renderGrid(); renderPanel();
      }));
    document.getElementById('cal-grid-slot').querySelectorAll('[data-nav]').forEach(b =>
      b.addEventListener('click', () => {
        if (b.dataset.nav === 'today') {
          const t = ofDate(todayISO());
          state.year = t.y; state.month = t.m; state.selected = todayISO();
        } else {
          let { year, month } = state;
          month += Number(b.dataset.nav);
          if (month < 1) { month = 12; year--; }
          if (month > 12) { month = 1; year++; }
          state.year = year; state.month = month;
        }
        renderGrid();
      }));
  }

  function renderPanel() {
    const evs = eventsOn(state.selected);
    const can = editable();
    const listHtml = evs.length
      ? evs.map(e => {
        const rel = relDay(e.date);
        return `
        <div class="ev-item ${typeCss(e.type)}">
          <div class="t">${esc(e.title)}</div>
          ${e.note ? `<div class="n">${esc(e.note)}</div>` : ''}
          <div class="meta">${typeName(e.type)} · <span class="${rel.urgent ? 'relup' : ''}">${rel.text}</span>${e.scope === 'private' ? ' · private' : ''}</div>
          ${can ? `<div class="row-actions">
            <button class="btn ghost small" data-edit="${e.id}">Edit</button>
            <button class="btn ghost small" data-del="${e.id}" style="color:#a52929">Delete</button>
          </div>` : ''}
        </div>`;
      }).join('')
      : '<div class="ev-none">Nothing on this day. A quiet day is also a gift.</div>';

    const formHtml = can ? `
      <div class="ev-form">
        <div class="hint-edit" id="ev-form-title">${state.editingId ? 'Editing activity' : 'Add to this day'}</div>
        <form id="ev-form">
          <div class="field">
            <label for="ev-title">Title</label>
            <input type="text" id="ev-title" placeholder="e.g. TMA 1 due, read Module 4" required>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="ev-date">Date</label>
              <input type="date" id="ev-date" value="${state.selected}" required>
            </div>
            <div class="field">
              <label for="ev-type">Type</label>
              <select id="ev-type">${TYPES.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</select>
            </div>
          </div>
          <div class="field">
            <label for="ev-note">Note <span style="font-weight:400;text-transform:none">(optional)</span></label>
            <input type="text" id="ev-note" placeholder="short note to self">
          </div>
          <label class="scope-row"><input type="checkbox" id="ev-scope" checked> Show on the public calendar</label>
          <div class="row-actions">
            <button type="submit" class="btn maroon small" id="ev-save">${state.editingId ? 'Save changes' : 'Add activity'}</button>
            ${state.editingId ? '<button type="button" class="btn ghost small" id="ev-cancel">Cancel</button>' : ''}
          </div>
        </form>
      </div>` : `
      <div class="cal-foot-note">✎ Yours to fill. Sign in at the <a href="admin.html">admin desk</a>, then return here to add deadlines and activities.</div>`;

    document.getElementById('cal-side-slot').innerHTML = `
      <div class="panel day-panel">
        <div class="panel-head">◴ Selected day</div>
        <div class="panel-body">
          <h3>${fmtLong(state.selected)}</h3>
          <div class="day-list">${listHtml}</div>
          ${formHtml}
        </div>
      </div>
      <div class="panel upcoming-panel">
        <div class="panel-head">→ Coming up</div>
        <div class="panel-body" id="upcoming-slot"></div>
      </div>`;

    renderUpcoming();

    if (can) {
      const form = document.getElementById('ev-form');
      form.addEventListener('submit', onSave);
      const cancel = document.getElementById('ev-cancel');
      if (cancel) cancel.addEventListener('click', () => { state.editingId = null; renderPanel(); });
      document.getElementById('cal-side-slot').querySelectorAll('[data-edit]').forEach(b =>
        b.addEventListener('click', () => startEdit(b.dataset.edit)));
      document.getElementById('cal-side-slot').querySelectorAll('[data-del]').forEach(b =>
        b.addEventListener('click', () => onDelete(b.dataset.del)));
      if (state.editingId) fillForm();
    }
  }

  function renderUpcoming() {
    const today = todayISO();
    const next = state.events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
    document.getElementById('upcoming-slot').innerHTML = next.length
      ? next.map(e => {
          const { d } = ofDate(e.date);
          const mon = new Date(e.date + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short' });
          const rel = relDay(e.date);
          return `<div class="up-item">
            <span class="d">${d}<small>${mon}</small></span>
            <span><span class="t">${esc(e.title)}</span><br><span class="ty">${typeName(e.type)} · <span class="${rel.urgent ? 'relup' : ''}">${rel.text}</span></span></span>
          </div>`;
        }).join('')
      : '<div class="ev-none">Nothing ahead. The semester is quiet, for now.</div>';
  }

  function fillForm() {
    const e = state.events.find(x => String(x.id) === String(state.editingId));
    if (!e) return;
    document.getElementById('ev-title').value = e.title;
    document.getElementById('ev-date').value = e.date;
    document.getElementById('ev-type').value = e.type;
    document.getElementById('ev-note').value = e.note || '';
    document.getElementById('ev-scope').checked = e.scope !== 'private';
    document.getElementById('ev-title').focus();
  }

  function startEdit(id) { state.editingId = id; renderPanel(); }

  async function onSave(ev) {
    ev.preventDefault();
    const btn = document.getElementById('ev-save');
    btn.disabled = true;
    const event = {
      title: document.getElementById('ev-title').value.trim(),
      date: document.getElementById('ev-date').value,
      type: document.getElementById('ev-type').value,
      note: document.getElementById('ev-note').value.trim(),
      scope: document.getElementById('ev-scope').checked ? 'public' : 'private',
    };
    if (!event.title || !event.date) { btn.disabled = false; return; }
    try {
      if (state.editingId) {
        const id = state.editingId;
        await persist('eventUpdate', { action: 'eventUpdate', id, event });
        state.editingId = null;
      } else {
        await persist('eventCreate', { action: 'eventCreate', event });
      }
      state.selected = event.date;
      const { y, m } = ofDate(event.date);
      state.year = y; state.month = m;
      renderGrid(); renderPanel();
    } catch (err) {
      alert('Could not save: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  }

  async function onDelete(id) {
    const e = state.events.find(x => String(x.id) === String(id));
    if (!e || !confirm(`Remove "${e.title}" from the calendar?`)) return;
    try {
      await persist('eventDelete', { action: 'eventDelete', id });
      if (String(state.editingId) === String(id)) state.editingId = null;
      renderGrid(); renderPanel();
    } catch (err) { alert('Could not delete: ' + err.message); }
  }

  /* ---------- public API for the router ---------- */
  let booted = false;
  async function show() {
    if (!booted) {
      document.getElementById('calendar-root').innerHTML = `
        <div class="cal-wrap">
          <div id="cal-grid-slot"><div class="loading-wrap">drawing…</div></div>
          <div id="cal-side-slot"></div>
        </div>
        ${DEMO ? '<div class="cal-foot-note">✎ Demo mode: activities you add are saved in this browser only, and samples marked "(sample)" can be deleted anytime. Connect the backend (README Part 2) to keep them in your Google Sheet.</div>' : ''}`;
      booted = true;
    }
    await ensureLoaded();
    const t = ofDate(todayISO());
    if (!state.year) { state.year = t.y; state.month = t.m; state.selected = todayISO(); }
    renderGrid(); renderPanel();
  }

  document.addEventListener('DOMContentLoaded', () => {
    /* deep link straight to the calendar */
    if (location.hash === '#/calendar') show();
  });

  return { show };
})();
