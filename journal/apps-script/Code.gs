/* ============================================================
   TALA - Google Apps Script backend  (Code.gs)

   HOW TO INSTALL - full screenshots-in-words in README.md Part 2.
   Short version:
     1. Create a Google Sheet → name the tab (bottom)  Entries
     2. Extensions → Apps Script → delete everything → paste this
     3. Change ADMIN_KEY below to your own secret key
     4. Run  setupSheet  once (it will ask for permissions)
     5. Deploy → New deployment → Web app
          Execute as: Me
          Who has access: Anyone
     6. Copy the Web app URL (…/exec) into assets/js/config.js
   ============================================================ */

const ADMIN_KEY  = 'CHANGE-ME-first';   // ← your journal key (used by admin.html)
// ↓ your GitHub Pages address, with trailing slash (used for the RSS feed links)
const SITE_URL   = 'https://YOUR-USERNAME.github.io/journal/';
const SHEET_NAME = 'Entries';           // the tab for journal entries
const EVENTS_SHEET = 'Events';          // the tab for calendar activities
const SETTINGS_SHEET = 'Settings';      // the tab for site settings (v2.2)

const HEADERS = ['ID','Title','Unit','Module','Category','Date',
                 'Excerpt','Content','Tags','Status','Created','Updated'];
const EVENT_HEADERS = ['ID','Title','Date','Type','Note','Scope','Created','Updated'];
const SETTINGS_HEADERS = ['Key','Value','Updated'];

/* ------------------------------------------------------------
   ONE-TIME SETUP - run this from the editor (▶ Run button).
   Creates the Entries tab with headers (if missing).
   ------------------------------------------------------------ */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  makeTab_(ss, SHEET_NAME, HEADERS);
  makeTab_(ss, EVENTS_SHEET, EVENT_HEADERS);
  makeTab_(ss, SETTINGS_SHEET, SETTINGS_HEADERS);
  SpreadsheetApp.getUi().alert('✦ Tala is ready! The "' + SHEET_NAME + '", "' +
    EVENTS_SHEET + '" and "' + SETTINGS_SHEET + '" tabs are set up. Now do Deploy → New deployment → Web app.');
}

function makeTab_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  // Non-destructive: only (re)writes the header row. Existing data is safe,
  // so it is fine to re-run setupSheet() after upgrades.
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#7B1113')
    .setFontColor('#FBF3E4');
  sh.setFrozenRows(1);
  if (name === SHEET_NAME) {
    sh.setColumnWidth(2, 260);  // Title
    sh.setColumnWidth(8, 420);  // Content
  } else {
    sh.setColumnWidth(2, 260);  // Title
    sh.setColumnWidth(5, 320);  // Note
  }
}

/* ------------------------------------------------------------
   GET  →  ?action=list              published entries (public)
           ?action=listAll&key=…     everything (admin desk)
           ?action=ping              health check
   ------------------------------------------------------------ */
function doGet(e) {
  const p = (e && e.parameter) || {};
  let out;

  switch (p.action || 'list') {
    case 'ping':
      out = { ok: true, message: '✦ Tala backend is alive', time: new Date().toISOString() };
      break;

    case 'rss':
      return rss_();

    case 'list':
      out = { ok: true, entries: readEntries_(true) };
      break;

    case 'listAll':
      if (!authorized_(p.key)) return json_({ ok: false, error: 'Unauthorized' });
      out = { ok: true, entries: readEntries_(false) };
      break;

    case 'events':
      out = { ok: true, events: readEvents_(true) };
      break;

    case 'eventsAll':
      if (!authorized_(p.key)) return json_({ ok: false, error: 'Unauthorized' });
      out = { ok: true, events: readEvents_(false) };
      break;

    case 'settings':
      out = { ok: true, settings: readSettings_() };
      break;

    default:
      out = { ok: false, error: 'Unknown action: ' + p.action };
  }
  return json_(out);
}

/* ------------------------------------------------------------
   POST →  { action:'create', key, entry }
           { action:'update', key, id, entry }
           { action:'delete', key, id }
   ------------------------------------------------------------ */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'Bad JSON body' }); }

  if (!authorized_(body.key)) return json_({ ok: false, error: 'Unauthorized' });

  /* media upload sits before the row lock: it writes to Google
     Drive, not to a sheet, so it does not need the lock. */
  if (body.action === 'upload') return uploadMedia_(body);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    switch (body.action) {
      case 'create': {
        const id   = 'e' + Date.now().toString(36);
        const now  = new Date().toISOString();
        appendRow_(rowFromEntry_(body.entry, id, now, now));
        return json_({ ok: true, id: id });
      }
      case 'update': {
        const r = findRow_(body.id);
        if (!r) return json_({ ok: false, error: 'Entry not found: ' + body.id });
        const prev = r.values;
        const row = rowFromEntry_(body.entry, body.id,
                                  prev[CREATED_COL], new Date().toISOString());
        r.range.setValues([row]);
        return json_({ ok: true, id: body.id });
      }
      case 'delete': {
        const r = findRow_(body.id);
        if (!r) return json_({ ok: false, error: 'Entry not found: ' + body.id });
        sheet_().deleteRow(r.rowIndex);
        return json_({ ok: true, id: body.id });
      }

      /* ---------- site settings ---------- */
      case 'saveSettings': {
        writeSettings_(body.settings || {});
        return json_({ ok: true });
      }

      /* ---------- calendar events ---------- */
      case 'eventCreate': {
        const id  = 'v' + Date.now().toString(36);
        const now = new Date().toISOString();
        eventsSheet_().appendRow(rowFromEvent_(body.event, id, now, now));
        return json_({ ok: true, id: id });
      }
      case 'eventUpdate': {
        const r = findEventRow_(body.id);
        if (!r) return json_({ ok: false, error: 'Event not found: ' + body.id });
        r.range.setValues([rowFromEvent_(body.event, body.id,
                                         r.values[ECREATED_COL], new Date().toISOString())]);
        return json_({ ok: true, id: body.id });
      }
      case 'eventDelete': {
        const r = findEventRow_(body.id);
        if (!r) return json_({ ok: false, error: 'Event not found: ' + body.id });
        eventsSheet_().deleteRow(r.rowIndex);
        return json_({ ok: true, id: body.id });
      }

      default:
        return json_({ ok: false, error: 'Unknown action: ' + body.action });
    }
  } finally {
    lock.releaseLock();
  }
}

/* ==================== internals ==================== */

const CREATED_COL = 10; // index of 'Created' within a row array

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('Sheet tab "' + SHEET_NAME + '" not found - run setupSheet() first.');
  return sh;
}

function authorized_(key) {
  return ADMIN_KEY !== 'CHANGE-ME-first' && key === ADMIN_KEY;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(v) {
  // Prevent spreadsheet formula injection from the admin form
  v = String(v == null ? '' : v).trim();
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/** entry object → 12-cell row (order matches HEADERS) */
function rowFromEntry_(entry, id, created, updated) {
  entry = entry || {};
  return [
    id,
    clean_(entry.title),
    clean_(entry.unit),
    Number(entry.module) || 0,
    clean_(entry.category),
    clean_(entry.date),
    clean_(entry.excerpt),
    String(entry.content || ''),
    clean_(entry.tags),
    entry.status === 'published' ? 'published' : 'draft',
    created,
    updated,
  ];
}

/** sheet row → entry object sent to the website */
function entryFromRow_(row) {
  return {
    id:       row[0],
    title:    row[1],
    unit:     row[2],
    module:   row[3],
    category: row[4],
    date:     normalizeDate_(row[5]),
    excerpt:  row[6],
    content:  row[7],
    tags:     row[8],
    status:   row[9] === 'published' ? 'published' : 'draft',
    created:  row[10],
    updated:  row[11],
  };
}

/** Sheets may store the Date column as a real Date object - flatten to YYYY-MM-DD */
function normalizeDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v || '');
}

function readEntries_(publishedOnly) {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  let list = values
    .filter(r => r[0] !== '')                 // skip blank rows
    .map(entryFromRow_)
    .filter(e => !publishedOnly || e.status === 'published');
  // newest first (by Date, then Created)
  list.sort((a, b) => String(b.date + '|' + b.created).localeCompare(String(a.date + '|' + a.created)));
  return list;
}

function appendRow_(row) { sheet_().appendRow(row); }

function findRow_(id) {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return null;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const rowIndex = i + 2;
      return {
        rowIndex: rowIndex,
        values: sh.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0],
        range:  sh.getRange(rowIndex, 1, 1, HEADERS.length),
      };
    }
  }
  return null;
}

/* ==================== RSS feed ==================== */
/* Your feed lives at:  WEB_APP_URL?action=rss               */
/* Remember to set SITE_URL at the top of this file so entry */
/* links point at your real journal pages.                   */

function rss_() {
  const entries = readEntries_(true).slice(0, 20);
  const items = entries.map(e => {
    const link = SITE_URL + '#/entry/' + encodeURIComponent(e.id);
    const pub  = e.date ? new Date(e.date + 'T12:00:00Z').toUTCString()
                        : new Date().toUTCString();
    return '    <item>\n' +
      '      <title>' + xml_(e.title) + '</title>\n' +
      '      <link>' + xml_(link) + '</link>\n' +
      '      <guid isPermaLink="false">' + xml_(String(e.id)) + '</guid>\n' +
      '      <pubDate>' + pub + '</pubDate>\n' +
      '      <category>' + xml_(e.category || 'Note') + '</category>\n' +
      '      <description>' + xml_(e.excerpt || '') + '</description>\n' +
      '    </item>';
  }).join('\n');

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0">\n  <channel>\n' +
    '    <title>Tala - The Learning Journal of Arnold C. Noda</title>\n' +
    '    <link>' + xml_(SITE_URL) + '</link>\n' +
    '    <description>Notes on development, communication and social change.</description>\n' +
    '    <language>en</language>\n' + items + '\n  </channel>\n</rss>';

  return ContentService
    .createTextOutput(xml)
    .setMimeType(ContentService.MimeType.XML);
}

function xml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ==================== calendar events ==================== */

const ECREATED_COL = 6; // index of 'Created' within an event row

function eventsSheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EVENTS_SHEET);
  if (!sh) throw new Error('Sheet tab "' + EVENTS_SHEET + '" not found. Run setupSheet() again to add it.');
  return sh;
}

function rowFromEvent_(ev, id, created, updated) {
  ev = ev || {};
  const type = ['deadline', 'tma', 'activity', 'personal'].indexOf(ev.type) > -1
    ? ev.type : 'personal';
  return [
    id,
    clean_(ev.title),
    clean_(ev.date),
    type,
    clean_(ev.note),
    ev.scope === 'private' ? 'private' : 'public',
    created,
    updated,
  ];
}

function eventFromRow_(row) {
  return {
    id:    row[0],
    title: row[1],
    date:  normalizeDate_(row[2]),
    type:  row[3] || 'personal',
    note:  row[4] || '',
    scope: row[5] === 'private' ? 'private' : 'public',
  };
}

function readEvents_(publicOnly) {
  const sh = eventsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, EVENT_HEADERS.length).getValues();
  const list = values
    .filter(r => r[0] !== '')
    .map(eventFromRow_)
    .filter(e => e.date && (!publicOnly || e.scope === 'public'));
  list.sort((a, b) => a.date.localeCompare(b.date));
  return list;
}

function findEventRow_(id) {
  const sh = eventsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return null;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      const rowIndex = i + 2;
      return {
        rowIndex: rowIndex,
        values: sh.getRange(rowIndex, 1, 1, EVENT_HEADERS.length).getValues()[0],
        range:  sh.getRange(rowIndex, 1, 1, EVENT_HEADERS.length),
      };
    }
  }
  return null;
}

/* ==================== one-time course calendar import ====================
   Run importDevCalendar() from the editor (▶ Run, rights already granted).
   It adds the official DEVC 202 deadlines and module pacing to the Events
   tab. It is safe to run more than once: rows that already exist are
   skipped by ID. No redeploy needed: the live site reads the same tab.
   Source: DEVC 202 Course Guide & Resource Kit (1S 2026-2027), grading
   matrix + recommended study sequence. */

function importDevCalendar() {
  const events = getDevCalendarEvents_();
  const sh = eventsSheet_();
  const last = sh.getLastRow();
  const have = {};
  if (last > 1) {
    sh.getRange(2, 1, last - 1, 1).getValues()
      .forEach(r => { have[String(r[0])] = true; });
  }
  const now = new Date().toISOString();
  let added = 0;
  events.forEach(ev => {
    if (have[ev.id]) return;
    sh.appendRow([ev.id, ev.title, ev.date, ev.type, ev.note, 'public', now, now]);
    added++;
  });
  SpreadsheetApp.getUi().alert(
    '✦ DEVC 202 calendar loaded: ' + added + ' new activities (' +
    (events.length - added) + ' already there). Reload your journal calendar.');
}

function getDevCalendarEvents_() {
  return [
    /* graded deadlines, straight from the grading matrix */
    { id: 'vd01', date: '2026-09-27', type: 'tma', title: 'TMA 1 due (10%)',
      note: 'Societal Problems scrapbook + 10-day inventory. Upload to the submission bin. No submissions after this day.' },
    { id: 'vd02', date: '2026-10-25', type: 'tma', title: 'TMA 2 due (10%)',
      note: 'Study: why is poverty still prevalent in the Philippines?' },
    { id: 'vd03', date: '2026-11-22', type: 'tma', title: 'TMA 3 due (10%)',
      note: 'The Proactive Information Society (Flor, 1983). Instructions in the Course Guide.' },
    { id: 'vd04', date: '2026-11-29', type: 'deadline', title: 'Discussion Forums 1-3 due (10%)',
      note: 'Posts and reactions close today.' },
    { id: 'vd05', date: '2026-12-06', type: 'deadline', title: 'DEVC 202 Journal due (20%)',
      note: 'This journal. The whole point of Tala. Keep writing.' },
    { id: 'vd06', date: '2026-12-06', type: 'deadline', title: 'Reflection Synthesis Piece due (20%)',
      note: 'Weave the journal threads into one piece.' },
    { id: 'vd07', date: '2026-12-18', type: 'deadline', title: 'Vlog due: Looking Back, Moving Forward (20%)',
      note: 'Film and produce. Last submission of the semester.' },

    /* recommended study sequence: one module per week, Mondays */
    { id: 'vd08', date: '2026-09-21', type: 'activity', title: 'Module 4: Of Blind Men and Paradigms',
      note: 'Chapter 4 + activities. TMA 1 week: upload on or before Sep 27.' },
    { id: 'vd09', date: '2026-09-28', type: 'activity', title: 'Module 5: The Communication Process',
      note: 'Chapter 5 + activities. Post to the discussion thread.' },
    { id: 'vd10', date: '2026-10-05', type: 'activity', title: 'Module 6: Communication Media',
      note: 'Chapter 6 + activities.' },
    { id: 'vd11', date: '2026-10-12', type: 'activity', title: 'Module 7: Barriers to Effective Communication',
      note: 'Chapter 7 + activities.' },
    { id: 'vd12', date: '2026-10-19', type: 'activity', title: 'Module 8: Communication Concepts',
      note: 'Chapter 8 + activities. TMA 2 week.' },
    { id: 'vd13', date: '2026-10-26', type: 'activity', title: 'Module 9: Definitions of DevCom',
      note: 'Chapter 9 + activities.' },
    { id: 'vd14', date: '2026-11-02', type: 'activity', title: 'Module 10: Foundations of DevCom',
      note: 'Chapter 10 + activities.' },
    { id: 'vd15', date: '2026-11-09', type: 'activity', title: 'Module 11: DevCom Practice',
      note: 'Chapter 11 + activities.' },
    { id: 'vd16', date: '2026-11-16', type: 'activity', title: 'Module 12: DevCom and Policy',
      note: 'Chapter 12 + activities. TMA 3 week.' },
    { id: 'vd17', date: '2026-11-23', type: 'activity', title: 'Module 13: DevCom Myths',
      note: 'Chapter 13 + activities.' },
    { id: 'vd18', date: '2026-11-30', type: 'activity', title: 'Review week',
      note: 'Finish all activity sheets. Study for the final examination.' },
    { id: 'vd19', date: '2026-12-07', type: 'activity', title: 'Final sprint: film the vlog',
      note: 'Shoot and edit Looking Back, Moving Forward. Due Dec 18.' },
  ];
}

/* ==================== media uploads (v2.1) ====================
   Photos, graphs, audio and small videos posted by the admin desk
   are saved to a Google Drive folder named "TALA Media". The
   folder is created automatically on the first upload and its ID
   is remembered in Script Properties, so it exists exactly once.
   Every uploaded file is set to "anyone with the link can view",
   which is what lets the journal page display it.

   NOTE: this action is new in v2.1. After pasting this Code.gs,
   deploy a NEW VERSION (Deploy → Manage deployments → ✎ → New
   version) and approve the new Google Drive permission once.
   The web app address does not change.
   ============================================================ */

const MEDIA_FOLDER_NAME = 'TALA Media';
const MAX_UPLOAD_BYTES  = 25 * 1024 * 1024; // 25 MB hard stop

function uploadMedia_(body) {
  try {
    if (!body.data) return json_({ ok: false, error: 'No file data received.' });

    let bytes;
    try { bytes = Utilities.base64Decode(body.data); }
    catch (err) { return json_({ ok: false, error: 'Could not decode the file data.' }); }

    if (bytes.length > MAX_UPLOAD_BYTES) {
      return json_({ ok: false, error: 'File too large (25 MB maximum). For big video, upload to YouTube or Drive and use the Video link button instead.' });
    }

    const name = safeFileName_(body.name || 'upload');
    const blob = Utilities.newBlob(bytes, body.contentType || 'application/octet-stream', name);
    const file = mediaFolder_().createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return json_({
      ok: true,
      id: file.getId(),
      name: name,
      url: 'https://lh3.googleusercontent.com/d/' + file.getId(),      // direct link (images, audio)
      view: 'https://drive.google.com/file/d/' + file.getId() + '/view', // player page (video)
      size: bytes.length,
    });
  } catch (err) {
    return json_({ ok: false, error: 'Upload failed: ' + (err && err.message ? err.message : err) });
  }
}

/* Create-or-reuse the media folder, remembered in Script Properties. */
function mediaFolder_() {
  const props = PropertiesService.getScriptProperties();
  const cachedId = props.getProperty('MEDIA_FOLDER_ID');
  if (cachedId) {
    try { return DriveApp.getFolderById(cachedId); }
    catch (err) { /* folder was deleted: fall through and make a new one */ }
  }
  const matches = DriveApp.getFoldersByName(MEDIA_FOLDER_NAME);
  const folder = matches.hasNext() ? matches.next() : DriveApp.createFolder(MEDIA_FOLDER_NAME);
  props.setProperty('MEDIA_FOLDER_ID', folder.getId());
  return folder;
}

/* Tidy file name, prefixed so uploads never collide. */
function safeFileName_(name) {
  const clean = String(name).replace(/[^\w.\- ()]/g, '').replace(/\s+/g, '-').slice(0, 80) || 'file';
  return 'tala-' + Date.now().toString(36) + '-' + clean;
}

/* ==================== site settings store (v2.2) ====================
   The "Settings" tab holds the editable parts of the website:
   hero copy, about card, footer, social media links, intro video.
   Read is public (the site needs it), write needs the ADMIN_KEY.
   The tab is created automatically the first time it is needed,
   so you do not need to re-run setupSheet(). */

function settingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET);
  if (!sh) {
    makeTab_(ss, SETTINGS_SHEET, SETTINGS_HEADERS);
    sh = ss.getSheetByName(SETTINGS_SHEET);
    sh.setColumnWidth(1, 200);
    sh.setColumnWidth(2, 560);
  }
  return sh;
}

function readSettings_() {
  try {
    const sh = settingsSheet_();
    const last = sh.getLastRow();
    if (last < 2) return {};
    const rows = sh.getRange(2, 1, last - 1, 2).getValues();
    const out = {};
    rows.forEach(r => { if (r[0] !== '') out[String(r[0])] = String(r[1]); });
    return out;
  } catch (err) {
    return {}; // no Settings tab yet: the site falls back to its built-in text
  }
}

function writeSettings_(obj) {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const rows = {};
  if (last > 1) {
    sh.getRange(2, 1, last - 1, 1).getValues()
      .forEach((r, i) => { rows[String(r[0])] = i + 2; });
  }
  const now = new Date().toISOString();
  Object.keys(obj).forEach(k => {
    const key = clean_(k);
    const value = clean_(String(obj[k]));
    if (rows[key]) {
      sh.getRange(rows[key], 2, 1, 2).setValues([[value, now]]);
    } else {
      sh.appendRow([key, value, now]);
      rows[key] = sh.getLastRow();
    }
  });
}
