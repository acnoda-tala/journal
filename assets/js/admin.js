/* =========================================================
   TALA - admin desk logic
   Passcode → list all entries → create / edit / publish /
   draft / delete. Talks to the Google Apps Script backend.
   The key is remembered on this device (localStorage) when
   "Keep me signed in" is ticked; otherwise it lives in
   sessionStorage and clears on tab close. Log out clears both.
   ========================================================= */

(function () {
  const API = (JOURNAL_CONFIG.API_URL || '').trim();
  const $ = sel => document.querySelector(sel);

  let KEY = localStorage.getItem('tala_key') || sessionStorage.getItem('tala_key') || '';
  let entries = [];
  let editingId = null;
  let currentTab = 'entries';
  let carrierEntry = null; // system entry that stores site settings on any backend

  /* Site settings live in TWO places, newest backend first:
     1) the native "Settings" tab (Code.gs v2.2+, needs your redeploy)
     2) a hidden published "carrier" entry (works on ANY backend today).
     The carrier is never shown on the site: journal.js filters it out. */
  const SETTINGS_CARRIER_TITLE = '✦ TALA site settings (system entry - do not delete)';

  function isSettingsEntry_(e) { return e && e.title === SETTINGS_CARRIER_TITLE; }
  function parseJson_(t) { try { const j = JSON.parse(t); return (j && typeof j === 'object') ? j : null; } catch (e) { return null; } }
  function hasSettingsValues_(o) { return !!o && Object.keys(o).some(k => String(o[k] || '').trim() !== ''); }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 2800);
  }

  /* ---------- API ----------
     Google occasionally answers a live /exec with a stray 404 or a
     slow edge (a few seconds after a deploy, or a shaky connection).
     Those SHOULD clear on their own, so we retry quietly before
     showing any error - and you are never signed out over a hiccup. */
  const RETRYABLE_HTTP = /HTTP (404|408|409|425|429|500|502|503|504)/;
  const wait_ = ms => new Promise(r => setTimeout(r, ms));

  async function fetchJsonWithRetry_(url, opts) {
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (err) {
        lastErr = err;
        const retriable = RETRYABLE_HTTP.test(err.message) || /Failed to fetch|NetworkError|Load failed/i.test(err.message);
        if (!retriable || i === 2) break;
        await wait_(600 * (i + 1));
      }
    }
    throw lastErr;
  }

  async function apiGet(params) {
    return fetchJsonWithRetry_(API + '?' + new URLSearchParams(params));
  }
  async function apiPost(payload) {
    return fetchJsonWithRetry_(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight
      body: JSON.stringify(payload),
    });
  }

  function setConn(ok, label) {
    const el = $('#conn-status');
    el.className = ok ? 'conn-ok' : 'conn-bad';
    el.querySelector('.conn-label').textContent = label;
  }

  /* ---------- login ---------- */
  async function tryLogin(key) {
    $('#login-btn').disabled = true;
    $('#login-error').textContent = '';
    try {
      const data = await apiGet({ action: 'listAll', key });
      if (!data.ok) throw new Error(data.error || 'Wrong key');
      KEY = key;
      if ($('#remember-device') && $('#remember-device').checked) {
        localStorage.setItem('tala_key', key);
        sessionStorage.removeItem('tala_key');
      } else {
        sessionStorage.setItem('tala_key', key);
        localStorage.removeItem('tala_key');
      }
      carrierEntry = (data.entries || []).find(isSettingsEntry_) || null;
      entries = (data.entries || []).filter(e => !isSettingsEntry_(e));
      showDashboard();
    } catch (err) {
      const hint404 = /HTTP 404/.test(err.message)
        ? ' Google sometimes answers a stray 404 right after a deploy or on a slow line - wait 30 seconds and press Open the desk again.'
        : '';
      $('#login-error').textContent = 'Could not sign in - check your key. (' + err.message + ')' + hint404;
    } finally {
      $('#login-btn').disabled = false;
    }
  }

  function showDashboard() {
    $('#login-card').classList.add('hidden');
    $('#dashboard').classList.remove('hidden');
    setConn(true, 'connected to Google Sheet');
    renderTable();
    loadRemoteSettings();
  }

  /* ---------- tabs: entries vs site settings ---------- */
  function switchTab(which) {
    currentTab = which;
    const onSettings = which === 'settings';
    $('#settings-view').classList.toggle('hidden', !onSettings);
    $('#list-view').classList.toggle('hidden', onSettings);
    $('#editor-view').classList.add('hidden');
    $('#tab-entries').classList.toggle('is-active', !onSettings);
    $('#tab-settings').classList.toggle('is-active', onSettings);
  }

  /* ---------- table ---------- */
  function renderTable() {
    const sorted = [...entries].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!sorted.length) {
      $('#entries-tbody').innerHTML =
        `<tr><td colspan="6" style="text-align:center;color:var(--ink-faint);padding:40px">
           No entries yet - click <b>✎ New entry</b> to write your first one.</td></tr>`;
      return;
    }
    $('#entries-tbody').innerHTML = sorted.map(e => `
      <tr>
        <td>
          <div class="t-title">${escapeHtml(e.title || '(untitled)')}</div>
          <div class="t-sub">${escapeHtml(mdToPlain(e.excerpt || e.content || '').slice(0, 70))}…</div>
        </td>
        <td>${escapeHtml(e.unit || '')}${Number(e.module) ? ' · M' + e.module : ''}</td>
        <td>${escapeHtml(e.category || '')}</td>
        <td>${escapeHtml(e.date || '')}</td>
        <td><button class="status-pill ${e.status === 'published' ? 'published' : 'draft'}"
                    data-act="toggle" data-id="${e.id}"
                    title="Click to ${e.status === 'published' ? 'unpublish' : 'publish'}">${e.status || 'draft'}</button></td>
        <td>
          <div class="row-actions" style="justify-content:flex-end">
            <button class="btn ghost small" data-act="edit" data-id="${e.id}">Edit</button>
            <button class="btn ghost small" data-act="delete" data-id="${e.id}" style="color:#a52929">Delete</button>
          </div>
        </td>
      </tr>`).join('');

    $('#entries-tbody').querySelectorAll('button[data-act]').forEach(btn =>
      btn.addEventListener('click', () => handleRowAction(btn.dataset.act, btn.dataset.id)));
  }

  async function handleRowAction(act, id) {
    const entry = entries.find(x => String(x.id) === String(id));
    if (!entry) return;

    if (act === 'edit') { openEditor(entry); return; }

    if (act === 'toggle') {
      const newStatus = entry.status === 'published' ? 'draft' : 'published';
      try {
        const res = await apiPost({ action: 'update', key: KEY, id, entry: { ...entry, status: newStatus } });
        if (!res.ok) throw new Error(res.error);
        entry.status = newStatus;
        renderTable();
        toast(newStatus === 'published' ? '✦ Published - live on the journal' : 'Moved back to drafts');
      } catch (err) { toast('Error: ' + err.message, true); }
      return;
    }

    if (act === 'delete') {
      if (!confirm(`Delete "${entry.title}" permanently? This cannot be undone.`)) return;
      try {
        const res = await apiPost({ action: 'delete', key: KEY, id });
        if (!res.ok) throw new Error(res.error);
        entries = entries.filter(x => String(x.id) !== String(id));
        renderTable();
        toast('Entry deleted');
      } catch (err) { toast('Error: ' + err.message, true); }
    }
  }

  /* ---------- editor ---------- */
  function fillStaticDropdowns() {
    $('#f-unit').innerHTML =
      ['Personal', ...COURSE_MAP.map(u => u.unit)]
        .map(u => `<option>${u}</option>`).join('');
    $('#f-module').innerHTML =
      `<option value="0">Personal / no module</option>` +
      COURSE_MAP.map(u =>
        `<optgroup label="${u.unit} · ${u.theme}">` +
        u.modules.map(m => `<option value="${m.n}">M${m.n} · ${m.title}</option>`).join('') +
        `</optgroup>`).join('');
    $('#category-list').innerHTML = CATEGORIES.map(c => `<option value="${c}">`).join('');
  }

  function openEditor(entry) {
    if (!$('#editor-view').classList.contains('hidden') && !confirmDiscard_()) return;
    editingId = entry ? String(entry.id) : null;
    $('#editor-heading').textContent = entry ? 'Edit entry' : 'New entry';
    $('#f-title').value = entry ? entry.title || '' : '';
    $('#f-unit').value = canonUnitAdmin_(entry && entry.unit) || (entry && entry.unit ? entry.unit : 'Personal');
    $('#f-module').value = entry ? String(entry.module || 0) : '0';
    $('#f-category').value = entry ? entry.category || '' : 'Reflection';
    $('#f-date').value = entry && entry.date ? entry.date : new Date().toISOString().slice(0, 10);
    $('#f-tags').value = entry ? entry.tags || '' : '';
    $('#f-status').value = entry && entry.status ? entry.status : 'draft';
    /* separate the [refs] block into its own box (keeps body clean) - wherever it sits */
    let body = entry ? entry.content || '' : '';
    let refsVal = '';
    const rm = body.match(/\[refs\][\s\S]*?\[\/refs\]/);
    if (rm) {
      body = (body.slice(0, rm.index) + body.slice(rm.index + rm[0].length))
        .replace(/\n{3,}/g, '\n\n').trimEnd();
      refsVal = rm[0].replace(/^\s*\[refs\]/, '').replace(/\[\/refs\]\s*$/, '').trim();
    }

    /* still empty? harvest citations pasted at the end of the body itself (toast lets Arnold undo) */
    if (!refsVal) {
      const paras = body.split(/\n{2,}/);
      const cites = [];
      const looksLikeCite = b => b.length >= 35 && /[(](?:\d{4}[a-z]?|n\.d\.)[),.\]]?/.test(b)
        && !/^(?:#{1,3}\s|>\s|[-*]\s|\d[).]\s|!\[|\[)/.test(b.trim());
      while (paras.length) {
        const last = paras[paras.length - 1].trim();
        if (!last) { paras.pop(); continue; }
        if (looksLikeCite(last)) cites.unshift(paras.pop());
        else break;
      }
      if (cites.length >= 2) {
        body = paras.join('\n\n').trimEnd();
        body = body.replace(/\n?\*?\*?\s*!!?\s*RE?FE?RE?N?C?E?S?\s*!!?\s*\*?\*?\s*$/i, '');
        refsVal = cites.map(c => c.trim()).join('\n');
        toast('✦ Found ' + cites.length + ' references at the end of the text - moved to the References box');
      }
    }
    $('#f-content').value = body;
    $('#f-refs').value = refsVal;
    $('#f-excerpt').value = entry ? entry.excerpt || '' : '';
    updatePreview();
    $('#list-view').classList.add('hidden');
    $('#settings-view').classList.add('hidden');
    $('#editor-view').classList.remove('hidden');
    markDirty_(false);
    tipShown_ = false;
    window.scrollTo({ top: 0 });
    $('#f-title').focus();
  }

  function canonUnitAdmin_(u) { return (String(u || '').trim().toLowerCase() === 'general') ? 'Personal' : u; }

  /* ---- unsaved-changes guardian (v2.16) ---- */
  let formDirty_ = false, tipShown_ = false;
  function markDirty_(d) {
    formDirty_ = !!d;
    document.body.classList.toggle('unsaved', formDirty_);
    if (formDirty_ && !tipShown_) { tipShown_ = true; toast('Editing... remember to SAVE before leaving this page'); }
  }
  function confirmDiscard_() {
    return !formDirty_ || confirm('You have UNSAVED changes.\n\nOK = discard them and leave the editor\nCancel = stay and keep writing (then press Save entry)');
  }
  window.addEventListener('beforeunload', (e) => {
    if (formDirty_ && !$('#editor-view').classList.contains('hidden')) { e.preventDefault(); e.returnValue = ''; }
  });

  function closeEditor() {
    if (!confirmDiscard_()) return;
    markDirty_(false);
    tipShown_ = false;
    editingId = null;
    $('#editor-view').classList.add('hidden');
    switchTab(currentTab);
  }

  /* ---------- site settings (v2.2) ---------- */

  const SETTINGS_FIELDS = Object.keys(SITE_DEFAULTS);

  function fillSettingsForm(values) {
    const merged = Object.assign({}, SITE_DEFAULTS, values || {});
    SETTINGS_FIELDS.forEach(k => {
      const el = document.getElementById('s-' + k);
      if (el && typeof merged[k] === 'string') el.value = merged[k];
    });
  }

  async function loadRemoteSettings() {
    // native Settings tab wins when it actually holds values
    try {
      const data = await apiGet({ action: 'settings' });
      if (data.ok && hasSettingsValues_(data.settings)) { fillSettingsForm(data.settings); return; }
    } catch (err) { /* older backend without the settings action: fall through */ }
    // hidden carrier entry (works with ANY backend version, no redeploy needed)
    if (carrierEntry) {
      const s = parseJson_(carrierEntry.content);
      if (s && hasSettingsValues_(s)) { fillSettingsForm(s); return; }
    }
    fillSettingsForm({});
  }

  async function saveSettingsViaCarrier_(settings) {
    const payload = {
      title: SETTINGS_CARRIER_TITLE,
      unit: 'Personal', module: 0, category: 'System', date: '2019-01-01',
      tags: 'system, settings', status: 'published',
      excerpt: 'TALA site settings storage. Not a journal entry - please do not edit it by hand.',
      content: JSON.stringify(settings),
    };
    const res = carrierEntry
      ? await apiPost({ action: 'update', key: KEY, id: carrierEntry.id, entry: payload })
      : await apiPost({ action: 'create', key: KEY, entry: payload });
    if (!res.ok) throw new Error(res.error || 'save failed');
    if (!carrierEntry) carrierEntry = { ...payload, id: res.id };
  }

  function collectSettings() {
    const out = {};
    SETTINGS_FIELDS.forEach(k => {
      const el = document.getElementById('s-' + k);
      if (el) out[k] = el.value.trim();
    });
    return out;
  }

  async function saveSettings() {
    const btn = $('#save-settings-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
    const settings = collectSettings();
    let saved = false;
    let lastErr = '';

    // 1) native Settings tab (new backend)
    try {
      const res = await apiPost({ action: 'saveSettings', key: KEY, settings });
      if (res.ok) saved = true;
      else lastErr = res.error || 'save failed';
    } catch (err) { lastErr = err.message; }

    // 2) carrier entry (every backend). If native failed, this is the store.
    //    If native succeeded and a carrier exists, keep it in sync quietly.
    try {
      if (!saved || carrierEntry) { await saveSettingsViaCarrier_(settings); saved = true; }
    } catch (err) { if (!saved) lastErr = err.message; /* native already saved: ignore carrier glitch */ }

    btn.disabled = false;
    btn.textContent = 'Save site settings';
    if (saved) toast('✦ Site settings saved - reload the journal to see them');
    else toast('Error saving settings: ' + lastErr, true);
  }

  /* body + references box, merged for storage; the box always wins */
  function mergedContent_() {
    let out = $('#f-content').value.replace(/\s+$/, '');
    const refsEl = $('#f-refs');
    const refs = refsEl ? refsEl.value.trim() : '';
    if (!refs) return out;
    const rx = /\[refs\][\s\S]*?\[\/refs\]/;
    if (rx.test(out)) out = out.replace(rx, '[refs]\n' + refs + '\n[/refs]');
    else out += '\n\n[refs]\n' + refs + '\n[/refs]';
    return out;
  }

  function collectForm() {
    const content = mergedContent_();
    return {
      title: $('#f-title').value.trim() || '(untitled)',
      unit: $('#f-unit').value,
      module: Number($('#f-module').value),
      category: $('#f-category').value.trim() || 'Note',
      date: $('#f-date').value,
      tags: $('#f-tags').value.trim(),
      status: $('#f-status').value,
      excerpt: $('#f-excerpt').value.trim() || mdToPlain($('#f-content').value).slice(0, 200),
      content,
    };
  }

  async function saveEntry() {
    const entry = collectForm();
    const btn = $('#save-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      const payload = editingId
        ? { action: 'update', key: KEY, id: editingId, entry }
        : { action: 'create', key: KEY, entry };
      const res = await apiPost(payload);
      if (!res.ok) throw new Error(res.error || 'save failed');

      if (editingId) {
        Object.assign(entries.find(x => String(x.id) === String(editingId)), entry);
      } else {
        entries.push({ ...entry, id: res.id });
      }
      markDirty_(false);
      closeEditor();
      renderTable();
      toast(entry.status === 'published' ? '✦ Saved & published' : 'Saved to drafts');
    } catch (err) {
      toast('Error saving: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save entry';
    }
  }

  /* ---------- markdown toolbar + preview ---------- */
  function updatePreview() {
    const src = (typeof mergedContent_ === 'function' ? mergedContent_() : $('#f-content').value).trim();
    const prev = $('#preview-body');
    prev.innerHTML = src
      ? mdToHtml(src)
      : '<span class="placeholder">Your entry will preview here as you write…</span>';
    if (src && window.linkCitations) linkCitations(prev); // same treatment the live reader gets
  }

  function wrapSelection(before, after) {
    const ta = $('#f-content');
    const [s, e] = [ta.selectionStart, ta.selectionEnd];
    ta.value = ta.value.slice(0, s) + before + ta.value.slice(s, e) + after + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = e + before.length;
    updatePreview();
  }

  document.querySelectorAll('.md-toolbar button[data-md]').forEach(btn =>
    btn.addEventListener('click', () => {
      const md = btn.dataset.md;
      if (btn.dataset.wrap) wrapSelection(md, md);
      else if (btn.dataset.block) wrapSelection('\n\n' + md + '\n\n', '');
      else wrapSelection('\n' + md, '');
    }));
  $('#md-marginalia').addEventListener('click', () => wrapSelection('\n\n!! ', '\n\n'));

  /* ---------- media: upload + links (v2.1) ----------

     Photos and graphs upload to a folder named "TALA Media" in
     your Google Drive, through the Apps Script backend. The entry
     only stores the returned web address, as a Markdown token:

       ![caption](https://lh3.googleusercontent.com/d/…)
       ![video: caption](youtube / drive / .mp4 link)
       ![audio: caption](.mp3 / .m4a link)
  */

  const UPLOAD_CAPS_MB = { image: 15, audio: 12, video: 12, pdf: 20, file: 15 }; // bigger files: use a link instead

  function insertAtCursor(token) {
    const ta = $('#f-content');
    const s = ta.selectionStart, e = ta.selectionEnd;
    const snip = '\n\n' + token + '\n';
    ta.value = ta.value.slice(0, s) + snip + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + snip.length;
    updatePreview();
    ta.scrollTop = ta.scrollHeight;
  }

  function altFromName(name) {
    const base = String(name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
    return base || 'journal photo';
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = () => reject(new Error('could not read the file'));
      r.readAsDataURL(blob);
    });
  }

  /* Downscale big photos so uploads stay fast and Sheets stays
     light. PNGs (screenshots, graphs) stay PNG; the rest become
     JPEG. Never returns a file heavier than the original. */
  function shrinkImage(file) {
    return new Promise(resolve => {
      if (file.size <= 600 * 1024) return resolve(file); // small already: untouched
      const keepPng = file.type === 'image/png';
      const img = new Image();
      img.onload = () => {
        const MAX = 1600;
        const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k));
        c.height = Math.max(1, Math.round(img.naturalHeight * k));
        const ctx = c.getContext('2d');
        if (!keepPng) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(b => resolve(b && b.size < file.size ? b : file),
                 keepPng ? 'image/png' : 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file); // unreadable as image: send as-is
      img.src = URL.createObjectURL(file);
    });
  }

  function kindOfFile(file) {
    const t = file.type || '';
    const ext = (String(file.name).match(/\.([a-z0-9]+)$/i) || [,''])[1].toLowerCase();
    if (/^image\//.test(t)) return 'image';
    if (/^audio\//.test(t)) return 'audio';
    if (/^video\//.test(t)) return 'video';
    if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
    return 'file';
  }

  async function uploadMedia(file) {
    const kind = kindOfFile(file);
    const cap = UPLOAD_CAPS_MB[kind];
    if (file.size > cap * 1024 * 1024) {
      toast(kind === 'video'
        ? 'Video is over ' + cap + ' MB - upload it to YouTube or Google Drive, then use the ▶ Video link button.'
        : 'File is over ' + cap + ' MB - too large. Try a smaller or scaled copy.', true);
      return;
    }

    const btn = $('#md-upload');
    const oldLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> uploading';
    try {
      const blob = kind === 'image' && !/image\/(gif|svg)/.test(file.type)
        ? await shrinkImage(file) : file;
      const data = await blobToBase64(blob);
      const res = await apiPost({ action: 'upload', key: KEY, name: file.name,
                                  contentType: blob.type, data });
      if (!res.ok) throw new Error(res.error || 'upload failed');

      const alt = altFromName(file.name);
      let token;
      if (kind === 'image') token = '![' + alt + '](' + res.url + ')';
      else if (kind === 'audio') token = '![audio: ' + alt + '](' + res.url + ')';
      else if (kind === 'video') token = '![video: ' + alt + '](' + res.view + ')';
      else if (kind === 'pdf') token = '![pdf: ' + alt + '](' + res.view + ')';
      else token = '![file: ' + alt + '](' + res.view + ')';
      insertAtCursor(token);
      toast('✦ Uploaded - stored in "TALA Media" in your Google Drive');
    } catch (err) {
      toast('Upload error: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldLabel;
    }
  }

  function insertImageLink() {
    const url = (prompt(
      'Paste the web address of the image.\n\n' +
      'A Google Drive share link works: it is converted into a direct photo link automatically.') || '').trim();
    if (!url) return;
    const cap = prompt('Caption under the image (or leave blank):') || '';
    insertAtCursor('![' + cap.trim() + '](' + url + ')');
  }

  function insertVideoLink() {
    const url = (prompt(
      'Paste a video link.\n\nWorks with:\n' +
      '· YouTube (watch, share, or shorts link)\n' +
      '· a Google Drive video ("Share → anyone with the link")\n' +
      '· a direct video file address ending in .mp4') || '').trim();
    if (!url) return;
    const cap = prompt('Caption under the video (or leave blank):') || '';
    insertAtCursor('![video' + (cap.trim() ? ': ' + cap.trim() : '') + '](' + url + ')');
  }

  function insertAudioLink() {
    const url = (prompt(
      'Paste an audio file address ending in .mp3, .m4a, or similar.') || '').trim();
    if (!url) return;
    const cap = prompt('Caption under the player (or leave blank):') || '';
    insertAtCursor('![audio' + (cap.trim() ? ': ' + cap.trim() : '') + '](' + url + ')');
  }

  function insertPdfLink() {
    const url = (prompt(
      'Paste the PDF address.\n\nTip: a Google Drive "Share → anyone with the link" address\n' +
      'gives the nicest reading experience: a full page viewer embedded in your entry.\n' +
      'A direct link ending in .pdf works too.') || '').trim();
    if (!url) return;
    const cap = prompt('Title under the PDF reader (or leave blank):') || '';
    insertAtCursor('![pdf' + (cap.trim() ? ': ' + cap.trim() : '') + '](' + url + ')');
  }

  /* ---------- events ---------- */
  $('#login-btn').addEventListener('click', () => {
    const k = $('#key-input').value.trim();
    if (!API) { $('#login-error').textContent = 'API_URL is empty - finish README Part 2 (deploy Apps Script, paste the URL into assets/js/config.js).'; return; }
    if (k) tryLogin(k);
  });
  $('#key-input').addEventListener('keydown', ev => { if (ev.key === 'Enter') $('#login-btn').click(); });

  $('#logout-btn').addEventListener('click', () => {
    if (!confirmDiscard_()) return;
    localStorage.removeItem('tala_key');
    sessionStorage.removeItem('tala_key');
    location.reload();
  });
  $('#new-entry-btn').addEventListener('click', () => openEditor(null));
  $('#cancel-edit-btn').addEventListener('click', closeEditor);
  $('#editor-view').addEventListener('input', () => markDirty_(true));
  $('#save-btn').addEventListener('click', saveEntry);
  $('#f-content').addEventListener('input', updatePreview);
  $('#f-refs').addEventListener('input', updatePreview);

  /* media bar */
  $('#md-upload').addEventListener('click', () => $('#media-file').click());
  $('#media-file').addEventListener('change', ev => {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (f) uploadMedia(f);
  });
  $('#md-imglink').addEventListener('click', insertImageLink);
  $('#md-video').addEventListener('click', insertVideoLink);
  $('#md-audio').addEventListener('click', insertAudioLink);
  $('#md-pdflink').addEventListener('click', insertPdfLink);
  $('#md-link').addEventListener('click', insertTextLink);

  /* words-you-choose link: [CLICK HERE](https://...) */
  function insertTextLink() {
    const ta = $('#f-content');
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
    const label = prompt('Words to show (they become the clickable text):', sel || 'CLICK HERE');
    if (label === null) return;
    const url = prompt('Paste the web address it should open:', 'https://');
    if (!url || !/^https?:\/\/\S+/i.test(url.trim())) { if (url !== null) toast('That does not look like a web address', true); return; }
    const piece = '[' + (label.trim() || 'CLICK HERE') + '](' + url.trim() + ')';
    ta.setRangeText(piece, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }
  $('#refresh-btn').addEventListener('click', async () => {
    try {
      const data = await apiGet({ action: 'listAll', key: KEY });
      if (!data.ok) throw new Error(data.error);
      carrierEntry = (data.entries || []).find(isSettingsEntry_) || null;
      entries = (data.entries || []).filter(e => !isSettingsEntry_(e));
      renderTable();
      setConn(true, 'connected to Google Sheet');
      if (currentTab === 'settings') loadRemoteSettings();
      toast('⟳ Refreshed from the Sheet');
    } catch (err) { setConn(false, 'connection lost'); toast('Error: ' + err.message, true); }
  });

  /* tabs + settings save */
  $('#tab-entries').addEventListener('click', () => switchTab('entries'));
  $('#tab-settings').addEventListener('click', () => switchTab('settings'));
  $('#save-settings-btn').addEventListener('click', saveSettings);
  $('#save-settings-btn-2').addEventListener('click', () => $('#save-settings-btn').click());

  /* ---------- boot ---------- */
  fillStaticDropdowns();
  if (KEY && API) tryLogin(KEY);
})();
