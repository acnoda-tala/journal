# ✦ TALA - The Learning Journal of Arnold C. Noda

## 🦄 STARTING A FRESH CHAT? Read this first (30 seconds)

- **This workspace IS the whole project.** The website lives in `journal/` (HTML + css/js in
  `assets/`); publish = upload the journal folder's **CONTENTS** to
  https://github.com/acnoda-tala/journal via "Add file → Upload files" - NEVER drag the folder
  itself and never include `_sources/` (copyrighted course pack). `entries/` is staging only.
- **Live site:** https://acnoda-tala.github.io/journal/ · **Backend:** a Google Apps Script web app
  (URL pinned in `assets/js/config.js`) reading/writing Arnold's own Google Sheet - entries,
  calendar events, and Site settings live there, NOT in the repo. After every Code.gs edit, the
  deployment needs **New version → Deploy**.
- **Owner conventions:** no frameworks, no external JS libs; maroon/ink paper aesthetic; mobile-first;
  the assistant documents every change in the **📝 Maintenance Log** (bottom of this file) and names
  each version. Current: **v2.18**. If live files differ from the workspace, upload the files listed
  under the newest log entries.
- **To brief a new AI chat, paste:**

  > *"You are continuing work on Arnold Noda's Tala journal. Open and read journal/README.md
  > in this workspace for full context: architecture, standing rules, the maintenance log,
  > and the current todo list. Then wait for my task."*

> *Tala* - Filipino for both **a written record** and **a star**. A journal, and something to steer by.

A personal learning journal for **DEVC 202 - Development Communication Concepts and
Approaches** (Master of Development Communication, UP Open University, 1st Semester
2026-2027), designed in the **University of the Philippines** visual language -
UP Maroon `#7B1113`, UP Forest Green `#014421`, gold accents, academic serif type -
minimalist edition: white canvas, one maroon accent, a permanent left rail, with
personal touches (handwritten margin notes, "ni arnold" in script, a Caveat signature).

- **Front end (public):** `index.html` - the journal
- **Front end (private):** `admin.html` - your writing desk
- **Backend:** Google Apps Script (a free web API you own)
- **Database:** one Google Sheet tab called `Entries`
- **Hosting:** GitHub Pages (free)

No frameworks, no build step, no npm. Three files to open in a browser; everything
else is copy-paste.

---

## ⚡ Work state (last verified 2026-09-19)

**Live addresses**
- Journal: https://acnoda-tala.github.io/journal/
- Admin desk: https://acnoda-tala.github.io/journal/admin.html
- Course digest: https://acnoda-tala.github.io/journal/course.html
- Backend (Apps Script, healthy): `https://script.google.com/macros/s/AKfycby…m6aSQ4/exec`

**Pending on Arnold's side** (one sitting, about 10 minutes):
1. Upload the changed files to GitHub (see 🔁 Installing every update, PART A).
   ⚠️ Upload the folder CONTENTS, never the `journal` folder itself (nested-folder
   mistake, found live 2026-09-19), and don't cherry-pick either (that mixed old and
   new versions and caused the 404 logout scare).
2. Paste the newest `apps-script/Code.gs` into Apps Script, re-apply `ADMIN_KEY` and
   `SITE_URL`, deploy a **New version**, approve the Drive permission (PART B).
3. In the Apps Script editor, run `importDevCalendar` **once** (fills the calendar;
   last check of `/exec?action=events` returned 0 events).
4. In the admin desk → ⚙ Site settings: fill the social media links (FB/IG/LinkedIn/email).

**Verify after**: open the journal (entries + your texts), the calendar (19 events),
and try a photo upload in the editor. Curl health check:
`curl -sL "…/exec?action=ping"` should answer `{"ok":true,…}`.

**Current version: v2.5.** Details per version in the Maintenance Log at the bottom.

---

## 🔁 Installing every update (THE checklist)

Every version of TALA ends with the same routine. Do PART A every time files change;
do PART B only when the Maintenance Log entry says the **backend** changed
(Code.gs); do PART C always.

### PART A - put the new files on GitHub (about 4 minutes)

1. Open https://github.com/acnoda-tala/journal and **sign in**.
2. Click **Add file → Upload files**.
3. From the downloaded workspace, upload **exactly the files listed under
   "Files touched"** in the newest Maintenance Log entry - or for a full refresh,
   everything at once.
   ⚠️ **DRAG THE CONTENTS, NEVER THE FOLDER.** Open the `journal` folder on your
   computer, select what's inside (Ctrl+A), and drag the SELECTED ITEMS into the
   upload area. Dragging the *folder itself* creates a nested `journal/` folder
   inside the repo - GitHub happily commits it, and your live site keeps serving
   the old files (this exact thing happened in v2.7). Before committing, read
   the file list: every path should start like `admin.html` or `assets/js/…`,
   NEVER `journal/admin.html`.
   (Keep the paths identical: `assets/js/…` files must replace the same paths.
   Never include `_sources/`.)
4. Check the list shows the right file names, then click **Commit changes**
   (message suggestion: `v2.x - <the log entry title>`).
5. Wait 1-2 minutes for GitHub Pages to rebuild, then hard-refresh the site
   (Ctrl+Shift+R / Cmd+Shift+R) to see it live.

**If the site didn't change after uploading:** look at your repo's main page.
If you see a folder called **`journal`** there next to `admin.html`, open it,
click **⋯ (three dots, top right) → Delete folder → Commit changes**, and redo
PART A selecting the *contents* of your local folder.

### PART B - update the backend (only when Code.gs is listed)

1. Open https://script.google.com → your TALA project.
2. In the editor, select ALL of `Code.gs` (Ctrl+A) and paste the newest
   `apps-script/Code.gs` over it.
3. **Re-apply your two personal lines at the top**: your `ADMIN_KEY` (your journal
   key, don't leave `CHANGE-ME-first`) and `SITE_URL`
   (`https://acnoda-tala.github.io/journal/`).
4. Click **Save** (disk icon).
5. **Deploy → Manage deployments → ✎ (pencil) → Version: New version → Deploy.**
   The web app address does **not** change. Approve any permission prompts
   (Drive access was added in v2.1).
6. If the log entry names a one-time function (e.g. `importDevCalendar`),
   pick it in the function dropdown and press **▶ Run** once. Green alert = done.

### PART C - verify (1 minute)

- Admin desk opens and stays signed in ("Keep me signed in" ticked).
- The calendar shows events (if the import ran).
- Site settings save and show up after reloading the journal.

---

## 📁 What's in this folder

```
journal/
├── index.html              ← the public journal (your site)
├── admin.html              ← your private writing desk
├── course.html             ← the DEVC 202 course digest (one-page reference)
├── assets/
│   ├── css/style.css       ← the whole UP-inspired design
│   └── js/
│       ├── config.js       ← ⚙️ THE ONLY FILE YOU EDIT (paste API URL here)
│       ├── seed-data.js    ← sample entries (demo mode; delete after launch)
│       ├── markdown.js     ← tiny Markdown renderer (shared)
│       ├── calendar.js     ← personal calendar (month grid, add/edit events)
│       ├── journal.js      ← journal logic + view router
│       └── admin.js        ← admin logic (login, editor, publish)
├── VOICE.md                ← ✎ ARNOLD'S STYLE GUIDE (read before writing entries)
├── apps-script/Code.gs     ← paste this into Google Apps Script
├── .gitignore              ← keeps _sources/ off GitHub (copyrighted readings)
├── _sources/               ← local copies of the course PDFs (NOT uploaded)
└── README.md               ← this file
```

---

## 🧩 Course content analysis (what the design is based on)

The Drive folder **DEVC202** contained 5 documents. Findings that shaped this site:

| Document | What it is | How it shaped the site |
|---|---|---|
| **Course Guide & Resource Kit (1S 2026-2027)** | DEVC 202 - *Development Communication Concepts and Approaches*, intro course of the MDC program, UP Open University. FICs: Emely M. Amoloza, PhD & Shaira F. Tanay | The **3 units / 13 modules** course map in the sidebar, module tags on entries |
| **Ongkiko & Flor - *Introduction to Development Communication*** | Main textbook (Societal Problems, Communication Process, DevCom Myths…) | "Resisting desensitization" theme in the hero copy |
| **Quebral - *Development Communication Primer* (2012)** | The UPLB definition of devcom, evolving over 40 years | Quebral quote styling, "confluence of two processes" framing |
| **Hemer & Tufte - *Voice & Matter* (2016)** | Nordicom anthology; the "cultural return" of communication for development | The journal's *voice/participation* motif |
| **Servaes (ed.) - *Communication for Development and Social Change* (UNESCO, 2008)** | Approaches: modernization → dependency → multiplicity | "Communication carries development" tagline ideas |

**The 13 modules** (baked into the site as `COURSE_MAP` in `assets/js/config.js`):

- **Unit I · Development** - 1 Societal Problems · 2 Underdevelopment Problematique · 3 What is Development? · 4 Of Blind Men and Paradigms
- **Unit II · Communication** - 5 The Communication Process · 6 Communication Media · 7 Barriers to Effective Communication · 8 Communication Concepts
- **Unit III · Development Communication** - 9 Definitions · 10 Foundations · 11 Practice · 12 Policy · 13 Myths

---

# 🚀 SETUP, STEP BY STEP

Do these parts in order. Total time: **~20 minutes**.

## Part 1 - Put the code on GitHub (5 min)

1. Download this workspace folder (`journal/`) to your computer.
2. Go to [github.com](https://github.com) → sign up / log in.
3. Click the **＋** (top right) → **New repository**.
   - Name: `journal` (or `tala-journal` - anything)
   - **Public** ✅ (required for free GitHub Pages)
   - ✅ Check **Add a README file** is *not* needed - we already have one. Leave it unchecked.
4. Click **Create repository**.
5. On the repo page, click **uploading an existing file** (or **Add file → Upload files**).
6. Open the `journal/` folder on your computer so you see its **contents**, then
   drag **the contents** into the upload box - NOT the `journal` folder itself.
   Drag exactly these items:
   ```
   index.html      admin.html      assets/  (whole folder)
   apps-script/    README.md       VOICE.md
   ```
   > ⚠️ If you drag the `journal` folder itself, everything lands one level too
   > deep (`journal/journal/index.html`) and the site breaks. The repo root must
   > contain `index.html` directly.
   > ⚠️ Leave out `_sources/` (copyrighted course PDFs) and any hidden dotfiles.
   > Web upload often skips files starting with a dot - that's fine, we add
   > `.nojekyll` separately in step 8.
   > ⚠️ After dragging, the upload list must show paths like `assets/css/style.css`.
   > If you only see loose filenames with no `assets/` prefix, cancel and re-drag.
7. Scroll down → **Commit changes**. ✅ Code is now on GitHub.
8. Now disable Jekyll (it injects GitHub's default theme into your site):
   **Add file → Create new file** → name it exactly `.nojekyll` → leave it empty →
   **Commit changes**.
9. **Check the file list on your repo page.** At the root you must see
   `index.html`, `admin.html`, and a folder named `assets` (with `css/style.css`
   and 6 JS files inside). No `journal` subfolder. If so, you are correctly
   structured.

*(Optional, better long-term: install [GitHub Desktop](https://desktop.github.com), clone the repo, and drag the files in - uploading folders via the browser works but Desktop is easier for updates.)*

## Part 2 - Build the Google Sheets backend (10 min)

### 2.1 Create the sheet
1. Go to [sheets.google.com](https://sheets.google.com) → **Blank** spreadsheet.
2. Name it (top-left): `Tala Journal DB`.
3. Leave it open - we come back to it.

### 2.2 Add the Apps Script
1. In the sheet menu: **Extensions → Apps Script**. A new tab opens.
2. You'll see one file `Code.gs` with an empty `myFunction`. **Select all, delete.**
3. Open our file [`apps-script/Code.gs`](apps-script/Code.gs), copy **all of it**, paste it in.
4. Near the top, change your secret key:
   ```js
   const ADMIN_KEY = 'CHANGE-ME-first';
   ```
   to something only you know, e.g.
   ```js
   const ADMIN_KEY = 'arnold-tala-2026-mabuhay';
   ```
   *(This is the password for your admin desk. Don't use your real Google password.)*
5. Click **💾 Save** (name the project `Tala Backend`).

### 2.3 Run the one-time setup
1. In the toolbar dropdown (says `myFunction` or `doGet`), choose **`setupSheet`**.
2. Click **▶ Run**.
3. Google shows **"Authorization required"** → click **Review permissions** → choose your account → **Advanced** → **Go to Tala Backend (unsafe)** → **Allow**.
   *("Unsafe" appears because it's your own unverified script - that's normal and safe here.)*
4. Run `setupSheet` again if needed. You'll get a popup: **"✦ Tala is ready!"**
5. Go back to your spreadsheet - there's now a maroon-headed **`Entries`** tab. ✅

### 2.4 Deploy as a web app
1. In Apps Script (top right): **Deploy → New deployment**.
2. Click the ⚙️ gear → type: **Web app**.
3. Settings:
   - Description: `Tala API v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy** → authorize again if asked.
5. Copy the **Web app URL** - it ends in `/exec`. Keep it somewhere.

> ⚠️ "Anyone" means anyone *with the URL* can **read published entries** -
> writing still needs your `ADMIN_KEY`. That's exactly what a public journal needs.
> Your drafts stay private; the key is never on GitHub.

## Part 3 - Connect the site to the backend (2 min)

1. In your repo, open **`assets/js/config.js`** (click it on GitHub → ✎ pencil icon).
2. Paste your URL between the quotes:
   ```js
   API_URL: 'https://script.google.com/macros/s/AKfyc…/exec',
   ```
3. **Commit changes.**

✅ **Done.** Your journal is live and connected.

## Part 4 - Turn on GitHub Pages (2 min)

1. Repo page → **Settings** (top tab) → **Pages** (left sidebar).
2. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** · folder: **/ (root)** → **Save**.
3. Wait 1-2 minutes, refresh - you'll see a green box with your URL:
   ```
   https://YOUR-USERNAME.github.io/journal/
   ```
4. Visit it. Your journal loads from the Google Sheet. 🎉
5. Your admin desk is at:
   ```
   https://YOUR-USERNAME.github.io/journal/admin.html
   ```

*(Optional: on the repo's main page, ⚙️ next to "About" → paste your site URL + topics like `devcom`, `upou`, `journal`.)*

---

## ✍️ Daily workflow (writing entries)

1. Open `…/admin.html`, enter your **journal key** (the `ADMIN_KEY`), click **Open the desk**.
   Leave **"Keep me signed in on this device"** ticked and you will not be asked again
   on this browser (the calendar desk shares the same sign-in). Untick it on shared
   computers; **Log out** always clears it.
2. Click **✎ New entry**.
3. Fill in: title → unit → module → category → date → status.
4. Write in the big box using **Markdown**:
   - `**bold**`, `*italic*`, `### Heading`, `> quote`, `- list item`, `---` divider
   - `!! your margin note` → renders as a handwritten note
   - Media: use the toolbar buttons in the media bar (see the next section)
5. Watch the **live preview** on the right.
6. Keep it **Draft** while working; switch to **Published** when ready → **Save entry**.
7. The public site updates instantly (no re-deploy needed - the site reads the Sheet live).

**Editing / publishing / deleting later:** in the desk's list, click **Edit**, click the colored **status pill** to toggle publish/draft, or **Delete**.

---

## 🖼 Media in entries (photos, graphs, audio, video)

Entries carry real media, not just text. All buttons live in the editor's media bar.

| Button | What it does | Best for |
| --- | --- | --- |
| **⬆ Upload file** | Uploads the file to a folder called **`TALA Media`** in your Google Drive (auto-created on first upload), then inserts it into your entry. **PDFs appear embedded in the entry with a full page reader.** Word/Excel/other files become an open/download card. | Photos, graphs, PDFs, readings, slides, any file |
| **⧉ Image link** | Asks for a web address and a caption, then inserts it. A Google Drive share link is converted into a direct photo link automatically. | Any image already on the web |
| **▶ Video** | Asks for a YouTube, Google Drive, or `.mp4` link and a caption, then inserts a real video player into the entry. | Your clips, and eventually the course vlog |
| **♫ Audio** | Asks for an audio link (`.mp3`, `.m4a`, …) and caption, then inserts a small audio player. | Recorded interviews, voice notes |
| **▤ PDF link** | Asks for a Google Drive or direct `.pdf` link, then inserts an embedded page reader into the entry. | PDFs already on the web |

Things to know:

- **PDFs are viewable in the entry itself.** Uploaded PDFs use Google Drive's page viewer; direct `.pdf` links use the browser's own reader. Both scroll inside the post. (In print, the reader is hidden; in the excerpt it leaves no noise.)
- **Sizes.** Photos upload up to 15 MB, PDFs up to 20 MB, other files up to 15 MB. Big photos are shrunk in the browser before upload (max 1600 px on the long edge), so uploads stay fast and your Sheet stays light. PNG files (screenshots, graphs) keep their sharpness.
- **Big video.** Anything over 12 MB (e.g. the 5-minute course vlog) should go on YouTube or straight to Google Drive first (Share → "anyone with the link"), then use **▶ Video** with that link. The journal embeds a proper player for it.
- **Where files live.** Everything ends up in `TALA Media` at the top level of your Google Drive, shared as "anyone with the link can view" (that is what lets the site display them). Delete a file there and it disappears from the journal too.
- **Markdown form.** If you ever type it by hand: `![caption](https://image-link)`, `![video: caption](link)`, `![audio: caption](link)`, `![pdf: title](link)`, `![file: name](link)`, each on its own line with a blank line above and below.
- **Course or personal.** Course entries get a unit and module in the editor. Your own musings do not need either: choose category **Personal Tala** and leave Module at "General / no module". The course requires a journal; it never said your other thoughts are not welcome in it.
- **The one-time setup bump.** Uploads use a new `upload` action in `Code.gs`. After pasting the new `Code.gs` into Apps Script, do **Deploy → Manage deployments → ✎ → New version → Deploy** once (the address does not change), and approve the new Google Drive permission when Google asks.

---

## ⚙ Site settings (edit the website's own text, socials, intro video)

The admin desk has a second tab now, **⚙ Site settings**, next to "✎ Entries".
Everything the public site says - without editing HTML:

- **The site**: site name, the line under it, the small kicker, the big headline, the welcome paragraph, the margin note, the signature line. `*italic*` and `**bold**` work; new lines are kept.
- **Sidebar & footer**: rail quote, the About card's role lines and text, the footer motto line.
- **Social media**: Facebook, Instagram, LinkedIn, YouTube channel, email. Pasted links appear as pills on the home page and in the footer. Blank fields stay hidden.
- **Intro video**: paste a YouTube, Google Drive, or `.mp4` link and a playable video player appears on the home page under the welcome text, with your own heading and caption. Blank = no video.

How it works: you save → the values are stored → the site fetches them on load and swaps
the built-in text. Readers see the change on their next visit.

**Two storage homes, best available one wins** (since v2.5):
1. With the newest `Code.gs` deployed: a **`Settings`** tab in your Google Sheet
   (auto-created; public read, key-gated write).
2. With ANY backend version, **no redeploy needed**: a hidden published
   "carrier" entry titled `✦ TALA site settings (system entry - do not delete)`.
   It is filtered out of every card, count, search and the reader. Do not
   delete or edit it by hand; deleting it is harmless - the next save recreates it.)

⚠️ Media uploads still need the newest `Code.gs` deployed (**New version**, one time).

---

## ➚ RSS feed (optional, 1 step)

Your journal has a real RSS feed for readers who follow by feed reader.

1. In `apps-script/Code.gs`, edit this line near the top to your real site address:
   ```js
   const SITE_URL = 'https://YOUR-USERNAME.github.io/journal/';
   ```
2. Redeploy (Manage deployments → ✎ → **New version** → Deploy).
3. Done. Your feed is `WEB_APP_URL?action=rss`, and the site footer lights up an
   **"RSS feed ➚"** link automatically once the backend is connected.

## ◴ The personal calendar

- Open it from the left rail: **Calendar**. Anyone sees your **public** activities.
- To add/edit/delete: sign in once at the **admin desk** (`admin.html`), then return
  to the calendar. It unlocks editing while your tab stays open (session key).
- Types: **Deadline** (maroon), **TMA** (gold), **Activity** (green), **Personal** (gray).
- **"Show on the public calendar"** unchecked = private, visible only to you.
- Data lives in the **`Events`** tab of the same Google Sheet.

### 📅 Load the official DEVC 202 semester map (one-time)

The Course Guide's grading matrix + study sequence are baked into Apps Script as a
ready importer: **7 graded deadlines** (TMA 1-3, forums, journal, synthesis piece,
vlog) and **12 weekly module milestones** (one module per week, Mondays, Sep 21 to
Dec 18).

1. In Apps Script, replace `Code.gs` with the latest version from this repo
   (re-apply your `ADMIN_KEY` and `SITE_URL` lines after pasting). Save. No
   redeploy needed.
2. Function dropdown → **`importDevCalendar`** → ▶ Run.
3. Alert says how many were added. It is safe to run twice (skips existing rows).
4. Reload your calendar. Edit or delete any item through the normal calendar UI.

**If your backend was deployed before the calendar existed (v1.3 or earlier):**
1. Apps Script → paste the new `Code.gs` → Save.
2. Run **`setupSheet`** once more. It only writes header rows; your entries are safe.
3. **Deploy → Manage deployments → ✎ → Version: New version → Deploy.**
   (The Web app URL stays the same. Without this, the calendar returns an error.)
4. Reload the site.

## 🔧 Updating the site after setup

- **Change design** → edit `assets/css/style.css` on GitHub → Commit. Pages auto-rebuilds in ~1 min.
- **Change course map / categories / sources** → edit `assets/js/config.js`.
- **⚠️ If you ever EDIT the Apps Script code** → you must **Deploy → Manage deployments → ✎ → Version: New version → Deploy**, otherwise the old code keeps running. (First deploy doesn't need this.)

## 🆘 Troubleshooting

| Symptom | Fix |
|---|---|
| **Site didn't change at all after "Upload files"; repo shows a folder called `journal`** | The folder itself got uploaded instead of its contents, nesting everything as `journal/journal/...`. Open the `journal` folder in the repo → **⋯ → Delete folder** → Commit. Redo PART A: open your local folder, Ctrl+A to select its **contents**, and drag those items (not the folder). |
| **Site is plain text, no design; calendar stuck on "Drawing…"; banner and sections all visible at once** | Your `assets` folder did not upload (very common with web upload). Repo page must show an `assets` folder containing `css/style.css` and `js/` (6 files). Re-upload `assets` (dragging that inner folder by name is fine). Also make sure an empty file named `.nojekyll` exists in the repo root (create via Add file → Create new file). Wait 1-2 min, hard-refresh (Ctrl+Shift+R). |
| **GitHub Pages serves a "theme" instead of your design** (blue GitHub-style links, wrong CSS) | A Jekyll theme got attached. The empty `.nojekyll` file in the repo root disables Jekyll completely - our plain HTML is then served as-is. If `_config.yml` exists in your repo (from picking a theme), you can also delete it. |
| Site shows the **demo banner & sample entries** | `API_URL` in `config.js` is empty or wrong - redo Part 3. |
| **"Couldn't reach your backend"** | Deployment access wasn't **Anyone** → Manage deployments → ✎ → set access → **New version** → Deploy. Or you edited Code.gs without a new version. |
| Admin says **"Wrong key"** | The typed key ≠ `ADMIN_KEY` in Code.gs (spelling/spaces). |
| Admin says **"API_URL is empty"** | Same as row 1. |
| **"Sheet tab Entries not found"** | Run `setupSheet` in Apps Script again. |
| Nothing happens after editing Code.gs | You must redeploy a **New version** (see above). |
| Date shows weirdly | Keep dates as `YYYY-MM-DD` typed in the admin form (it does this automatically). |

---

## 💬 Resuming work in a new chat (important!)

You asked to be able to start fresh chats anytime. Do this:

1. **Download this workspace** (the whole `journal/` folder, as a zip) to your computer.
2. In the new chat, **upload the folder** and say:
   > "This is my Tala journal project. Read README.md top to bottom - especially the
   > Work state, the Install checklist, the Maintenance Log, and VOICE.md - then let's
   > continue: *[what you want]*."
3. The **Work state** block above tells the new chat what is live and what is pending;
   the **Maintenance Log** below records every version. Both are updated on every change.

### Conventions the next chat must follow

- **Voice**: read `VOICE.md` before writing any entry or site copy. Simple, direct
  words. **No em-dashes anywhere** (before shipping, grep for the characters U+2014 and U+2013).
- **Every change** ends with the Maintenance Log entry (version number + title +
  files touched) AND the Work state block updated AND the reply ends with PART A/B/C
  install steps for Arnold.
- **Backend changes** always warn that a **New version redeploy** is needed; editor-only
  functions (like `importDevCalendar`) do not.
- Plain static HTML/CSS/JS only. No frameworks, no build. Backend stays
  Google Apps Script + Google Sheets (+ Drive for media).
- Never commit `_sources/` (course PDFs are copyrighted).
- Site identity: TALA ni Arnold, UP-minimalist white design, left rail, maroon accents,
  handwritten touches. Admin = `admin.html`. Public = `index.html` + `course.html`.

---

## 📝 Maintenance Log

*(newest first - updated on every change)*

### 2026-09-20 - v2.18 "Links in your words"
- **Words-as-links, one button.** New 🔗 Link tool in the editor: the words you pick
  become the clickable text (default "CLICK HERE") hiding the URL underneath. Syntax
  `[words](https://...)` was already supported site-wide; now it is one tap. Selecting
  text first pre-fills the words.
- **PDF layout re-tuned:** with an embedded PDF, the reading page widens to 1680px and
  the split keeps the text column full-size while the PDF soaks up ALL of the right
  space (sticky, full viewport height, soft card shadow). On narrower screens it falls
  back to stacking below the text, unchanged.
- **Course digest retired** (course.html removed): nav links, page, settings fields,
  planner plan-links, and config defaults all pruned. Planner items now point at the
  course pack itself. The static footer AI sentence mentions only journal+calendar+planner.
  NOTE on publish: a zip overlay cannot delete files - delete `course.html` from the
  local clone (Explorer) so Desktop commits the removal.
- Files touched: `assets/js/admin.js`, `assets/js/journal.js`, `assets/js/config.js`,
  `assets/css/style.css`, `admin.html`, `planner.html`, `index.html`, `README.md`;
  deleted: `course.html`.

- **Home redesign (per Arnold):** the journal entries now lead the home page - the
  About-TALA hero became a compact card pinned BELOW the entries ("smaller box, like
  about the author"). Same settings ids, so Site settings still drive every word.
- **Editor squeeze fixed:** pasting long links into references used to blow out the
  Live preview column and compress the Write pane (CSS-grid min-content expansion).
  Now `minmax(0, ...)` + `min-width: 0` locks both columns, and long URLs wrap
  (`overflow-wrap: anywhere`) in the preview AND the live reader. Preview body font
  also aligned to Arial (it had kept the serif stack).
- Files touched: `index.html` (hero moved), `assets/css/style.css`, `README.md`.

- **Arial for all reading text** (per Arnold: easy on the eyes). Long-form body,
  excerpts and the editor are now Arial; headings/wordmark keep the UP serif identity.
- **Favicon can no longer disappear**: the pen-star is INLINED into every page head as
  a data-URI (works even with zero assets uploaded). The assets/img file stays as
  the high-res/OG source. (Root cause of the last disappearance: assets/img/ was still
  not uploaded since v2.13 - this makes the visible icon survive that anyway.)
- **Entries above the fold**: the home hero is compressed (padding 78px→30px, h1 and
  lede and meta tightened) so the journal entries are visible immediately on load,
  desktop and phone alike.
- **Unsaved-changes guardian**: typing marks the editor "• unsaved" (header badge +
  glowing Save button + one-time reminder toast); leaving Cancel, switching entry,
  logging out, or closing the tab now asks "discard or keep writing" first. Saving
  clears the flag.
- **GENERAL -> PERSONAL** everywhere it shows (editor unit select, home pills, rail
  nav). Legacy entries stored as "General" are auto-canonicalized on load, both
  front-ends - old content keeps filtering correctly, no Sheet edits needed.
- **PDF beside the text**: a `[pdf]`-style embedded PDF (the scrollable Drive/browser
  reader) is parked in a sticky column alongside the entry on screens 1040px+; on
  phones/tablets it follows the text at a readable 520px. Read on one side, consult
  the source on the other.
- **Device pass**: global overflow-x clipped (no horizontal scroll ever), tables
  scroll inside the text column, text-size-adjust fixed for iOS, extra-small phone
  adjustments (≤420px), sticky PDF column checked against 320px→desktop widths.
- Files touched: `assets/css/style.css`, `assets/js/journal.js`, `assets/js/admin.js`,
  + favicon lines of `index.html`, `admin.html`, `planner.html`, `course.html`,
  `README.md`. (markdown.js unchanged this round but must ship for v2.15 features.)
- Delivery: `tala-update-v2.16.zip` = exact files to overlay (extract over your
  GitHub Desktop clone, Commit & Push).

### 2026-09-19 - v2.15 "References, unbreakable"
- ROOT CAUSE (live diagnosis): live JS/CSS were still v2.7-era while pages were v2.13+,
  so the newest reference machinery (apa indent, refs box merge, citation links,
  lightbox/TOC) never loaded upfront: pasted references vanished on save.
  Remedy = upload the files listed below plus `assets/img/` (still missing since v2.13).
- **Renderer toughened:** `[refs]` blocks tolerate blank lines between citations; a plain
  list of citations pasted at the very END of an entry (with or without its
  "REFERENCES" header) is detected, cleaned, sorted, hung-indented, and linked - no
  markers at all required. A lone trailing citation sentence is never misread as a list.
- **Editor heals itself:** opening an entry whose body ends in citation paragraphs
  auto-moves them into the References box (a toast says what it did). Once live, older
  saved entries style themselves on page render - no re-saving needed.
- Files touched: `assets/js/markdown.js`, `assets/js/admin.js`, `admin.html`, `README.md`.
  Tests: 13/13 including the real Module-1 legacy shape.
- README gained the 🦄 "STARTING A FRESH CHAT" bootstrap box at the very top.

### 2026-09-19 - v2.14 "The desk knows APA"
- **Separate References box in the editor.** Paste ALL your citations into the new
  "References" textarea under the body, one full APA citation per line - no [refs]
  markers needed. On save the box is appended (or replaced) at the end of the entry;
  on edit it is lifted back out into its box. Tail content after the block (like the
  AI-disclosure note) is preserved; box always wins.
- **Smarter-than-typing citation LINKING.** After render, the entry finds matching
  in-text citations on its own - "(Author, 2023)", multi-part
  "Name & Name (2021)", acronym citations like "(PSA, 2025c)", "(NEDA, 2023)",
  "(CPBRD, 2026)", "(BTr, n.d.; De Leon, 2026)" - and wraps each in a highlighted,
  dotted link. Click: smooth-jumps to the exact reference (flash pulse). The
  reference's printed URL is the second click out to the source. Guards: a year (or
  n.d.) must sit after a comma inside parentheses, so codes like
  "(PSA Board Resolution 13-2024)" never become fake links; print strips the tint.
- For the real Module 1 entry it finds **11 working citation jumps automatically**
  (16 references).
- **Already true, now truer:** the Write panel and the Live preview were one page -
  preview is now sticky on desktop, syncs the References box as you paste, and shows
  citation highlights exactly as the public entry renders them.
- **Divider upgrade:** "---" on its own line now renders as a rule centred on a ✦
  (hmm, elegant) - use it between Activity 1.1 and 1.2. Same look in the editor preview.
- **Brand check (per Arnold's note):** verified the live site shows NO "Mga" anywhere;
  it already reads "TALA ni Arnold · a journal blog." (v2.13 HTML went live but
  `assets/img/` still needs uploading - tab logo 404s until then.)
- Files touched: `assets/js/markdown.js`, `assets/js/admin.js`, `assets/js/journal.js`,
  `admin.html`, `assets/css/style.css`, `README.md`.

### 2026-09-19 - v2.13 "The pen-star"
- **Logo developed.** `assets/img/logo-star.svg` - a five-point star traced by one
  fountain-pen stroke with its ink dot above (tala = star = note, the whole poetry)
  - hand-authored vector, ~800 bytes, crisp at favicon size. Plus
  `assets/img/logo-tala.svg`, the full lockup (star + TALA + ni arnold) for future
  posters, slides, or the printed journal cover. All four pages now USE the star
  as their favicon (replacing the provisional emoji circle).
- **Name decided: "Tala ni Arnold" stays** (Arnold's call, per brand review).
  New subtitle under the wordmark: **"a journal blog"** - shown in the left rail on
  the journal + digest, and beside the planner's top brand. Editable as a new Site
  setting: `rail_sub2` (defaults to "a journal blog"; the Admin desk panel gains the
  field, so you may rename it anytime without touching code).
- Files touched: `assets/img/logo-star.svg` (NEW), `assets/img/logo-tala.svg` (NEW),
  `index.html`, `course.html`, `planner.html`, `admin.html`, `assets/js/config.js`,
  `assets/js/journal.js`, `assets/css/style.css`, `README.md`.

### 2026-09-19 - v2.12 "Share, print, pocket"
All byte-zero for visitors: metatags only, a 528-byte manifest, and print CSS that
activates solely under Ctrl+P. No service worker - deliberate (staleness risk > value).
- **Print stylesheet (`@media print`):** sidebars, pill bar, nav rows, toggles, and
  chrome vanish; article body, module badge, figures, and APA references stay, with
  smart page-breaks (no heading orphaned, no figure/ref split mid-box). The footer
  course-requirement + AI-disclosure statements REMAIN printed - graders must see them.
- **Share cards:** per-page `og:title/description/url/image`, site name, and
  `twitter:card` (large summary) on journal, digest, planner, and admin. One hand-drawn
  maroon star + fountain-pen card (`assets/img/og-card.jpg`, 1430x750) serves all pages.
  Pasted links now arrive with an elegant preview in Messenger/Discord/class group chats.
- **PWA lite:** `manifest.webmanifest` + maroon star app icons (192/512, optimized
  1.36MB -> 305KB + 38KB) + theme-color (maroon day / ink night, follows v2.11).
  Chrome/Android: the journal can be "Add to Home Screen"-ed as an app-shell icon,
  tabs open standalone. iOS: Apple touch icon set; planner got its missing favicon.
- Files touched: `index.html`, `course.html`, `planner.html`, `admin.html`,
  `assets/css/style.css`, `manifest.webmanifest` (NEW), `assets/img/` (NEW: 3 images),
  `README.md`.

### 2026-09-19 - v2.11 "Day and night"
- **Dark/light switch on all four pages** (journal, digest, planner, admin desk):
  a round toggle fixed bottom-right (☾ to go dark, ☀ to go light). Your choice
  saves in `tala_theme`; first visit follows your device preference
  (`prefers-color-scheme`), with no white flash (a 3-line head script applies the
  theme before first paint).
- Dark palette is a warm-night inversion via the existing CSS custom properties:
  same maroon family (brightened to readable rose-maroon), paper -> deep sepia,
  ink -> cream; matched tints for the module badge, pill bar, planner highlights,
  and the lightbox. No library, no repaint loops; reduced-motion users get an
  instant flip.
- **Confirmed live:** both course entries (Module 1 + Scrapbook) still published
  from the Sheet - theme work touches zero data.
- Files touched: `index.html`, `course.html`, `planner.html`, `admin.html`,
  `assets/css/style.css`, `README.md`.

### 2026-09-19 - v2.10 "Zoom and bearings"
Two reader-side upgrades, built strictly lean per Arnold's call ("no laggy extras"):
zero libraries, zero polling loops, everything delegation- or observer-based.
- **Figure lightbox.** Any table/graph image in an entry's reader now opens full-size
  in a dark overlay (click again, the ×, or Esc to close; ←/→ arrow keys and on-image
  buttons walk through every figure in the entry; one figure = buttons hidden; nav
  buttons hidden on phones). Esc is captured so it closes the lightbox, not the entry.
  Reader body scroll is locked while open. `reduced-motion` users get no pop animation.
- **"On this reading" pill bar.** Long entries (>= 3 headings, like the module
  entries) get a sticky pill strip of their own section headings; clicking pills
  smooth-scrolls (instant for reduced-motion users) and the section in view is
  highlighted live via IntersectionObserver. Headings get scroll-margin so they
  never dock under the sticky bar. Short entries (< 3 headings) skip it entirely.
- Files touched: `assets/js/journal.js`, `assets/css/style.css`, `README.md`.

### 2026-09-19 - v2.9 "Ledger locked, references lazy"
- **Planner gate.** The study desk is now read-only for visitors: checkboxes are
  greyed and guarded (a stray click auto-reverts), while the signed-in admin
  (`tala_key` present) ticks freely. Where you signed in on the admin desk you've
  ALSO unlocked editing: every day row gets a ✎ pencil - reword an objective
  inline, Enter saves, Esc cancels, empty save restores the planned line. Ticks
  and edits stay on that device (it is YOUR ledger), the page says so plainly.
  Unfolded blocks stay open across re-renders now.
- **Auto-APA references in entries.** New shortcode, teach it once:
      [refs]
      Surname, I. (Year). Title of the work. *Journal Name*, 11(5), 4-9. https://...
      [/refs]
  One citation per line (no blank lines inside). The renderer alphabetizes by
  author, drops exact dupes, ensures a trailing period, italicizes whatever you
  marked with *asterisks* (APA's journal/book titles and volume), linkifies bare
  URLs (trailing punctuation kept OUT of the href), and hangs the indent under a
  clean "REFERENCES" rule - per APA 7th, the style UPOU DevComm expects.
- **Module badge** for course entries: first line  [module N · subtitle]  paints
  the maroon-kick module banner at the top of the entry body. Works on every
  future module entry - same line, different N.
- Admin compose hint on the body textarea now documents both constructs.
- **Entry rebuilds staged (live audit, same day):** `entries/module-1-development.REBUILT.md`
  and `entries/societal-problems-scrapbook.REBUILT.md` are cleaned versions of the two
  live entries (verbatim text; 8/8 Drive figures + the scrapbook PDF preserved). Use
  them to overwrite the live bodies from the admin desk AFTER the v2.9 files are up:
  the `[module]` badge and `[refs]` blocks need the new renderer. Fixes applied:
  underscore rulers -> real `---`; duplicate "FINDINGS" relabeled "DATA TRAIL";
  stray "note"/"!! Padagos!" lines removed; references moved into `[refs]` (16 and 7
  sources, alphabetized; title italics applied per APA). `entries/` is a staging
  folder - it does not need to be uploaded with the site files.
- Files touched: `assets/js/markdown.js`, `assets/css/style.css`, `planner.html`,
  `admin.html`, `README.md`. Tests 18/18. No backend change.

### 2026-09-19 - v2.8 "The study desk"
- **New page: `planner.html`** - "Study planner.", built from the course guide's
  milestone calendar (digest #weeks). One objective for **every day of the term**
  (116 days, Aug 31 - Dec 18): orientation and Prologue/Ch 1, the three TMA pushes
  (27 Sep / 25 Oct / 22 Nov), forum-sprint blocks (5 reactions x3), forum close
  (29 Nov), journal + RSP finals (06 Dec), a respit-and-review week for the final
  exam, and the reflection vlog (18 Dec).
- **Today card** shows today's dated objective; ticking it saves to
  `localStorage` (`tala_plan_<date>`), syncs with the day rows, and earns the
  footer's **progress rails** (this block / whole term, against days elapsed).
- Every block is a card you can unfold: **Read / Produce-Submit / Do** columns
  (with digest deep-links) plus its dated day rows with tick boxes; DUE days are
  flagged. The hero shows today, the block in session, and a **countdown to the
  nearest deadline**. A "shape of my week" note explains the Mon-Fri evening +
  Saturday long-block rhythm (asks for a day of rest on Sundays).
- **No backend change.** The page self-reads the same public events feed for a
  "Next up in the calendar" strip (falls back silent on failure).
- All dates anchor to `TERM_START = '2026-08-31'` plus per-block `from/to` at the
  top of planner.html - one comment explains how to shift them if the guide moves.
- Journal + Digest **footers now link Planner** ("Digest · Planner · Admin"); the
  **sidebar rail-nav** on both pages now carries "☑ Planner" between the digest and
  the admin desk too.
- Files touched: `planner.html` (NEW), `index.html`, `course.html`, `README.md`.
- Install: PART A with the touched files (planner.html is new - make sure it
  lands at repo root, next to index.html).

### 2026-09-19 - v2.7 "Speed and the smooth"
- **The 404 logout, dissected.** Live site was serving a STALE MIX of files (admin.js /
  journal.js / calendar.js / admin.html / course.html were several versions behind the
  workspace - cherry-picked file uploads). Backend itself verified ALIVE the whole time
  (ping answered `{"ok":true …}`). Google's /exec also occasionally answers a live
  deployment with a stray 404 on slow lines, so:
  - `admin.js` + `calendar.js` now **retry quietly (3 attempts, backoff)** on
    HTTP 404/408/409/425/429/5xx and network hiccups before showing any error -
    and a remembered key is never dropped over a transient failure.
  - The login error explains the 404-after-deploy case and asks you to press once more.
- **Real speed work:**
  - Calendar now paints **instantly from a localStorage cache** (`tala_events_cache`)
    and refreshes live after; a failed refresh keeps the cached copy instead of a dead
    end. Edits update the cache immediately.
  - `preconnect` hints for script.google.com + script.googleusercontent.com on all pages.
  - `content-visibility: auto` on the long digest sections.
- **Smooth, light animations** (transform/opacity only, cheap one-time plays; the global
  prefers-reduced-motion rule already zeroes them): staggered hero entrance, entry cards
  rising in, gentle card hover lift, view fade-ins, calendar cell hover, reader settle.
- **Editing coverage widened ("all parts")**: new editable zones - About-card name,
  calendar page title + intro, footer course-requirement statement, footer AI
  disclosure, digest kicker/headline/lede. They flow through the same Site settings
  storage (native tab, carrier fallback). `course.html` now self-applies them with a
  small inline loader (no extra files). The digest's seven chapters stay in
  course.html by design (reference material).
- `markdown.js` links now accept relative paths (`[admin desk](admin.html)`);
  `javascript:`/`data:` protocols are stripped.
- **Post-ship trims (Arnold's call, same day):** removed the "set in Fraunces & Archivo
  · entries and calendar in Google Sheets · served by Apps Script · hosted on GitHub
  Pages" tech line from both footers (kept the padagos! signature + nav); removed the
  "IO III, Bicol University" line from both sidebars (kept name, DevCom student UPOU,
  and the DEVC 202 line). `admin.html` had neither; no new settings keys.
- Files touched: `index.html`, `course.html`, `admin.html`, `assets/js/config.js`,
  `assets/js/journal.js`, `assets/js/admin.js`, `assets/js/calendar.js`,
  `assets/js/markdown.js`, `assets/css/style.css`, `README.md`.
- **No backend change.** Install: upload the whole `journal/` folder (PART A) - do not
  cherry-pick files; mixing old and new versions is exactly what caused the 404 logout.

### 2026-09-19 - v2.6 "No borrowed links"
- **Removed the public links to the course pack** (textbook PDF, DevCom Primer, scrapbook
  reference) from `course.html`: those files live in UPOU's space and are licensed for
  enrolled students, not for republishing. Titles stay as plain citations, with one line
  noting that links are withheld on purpose. The sample student journal link stays
  (it is a public blog, not course pack). The sidebar "Course sources" panel was always
  citation-only, no changes needed.
- Files touched: `course.html`, `README.md`.

### 2026-09-19 - v2.5 "Stay signed in, write anywhere"
- **Persistent admin sign-in.** New "Keep me signed in on this device" checkbox on the
  login card (ticked by default): the journal key now lives in localStorage and survives
  closed tabs and restarts. Unticked = sessionStorage as before. Log out clears both.
  `calendar.js` reads the same storage, so the calendar stays editable too.
- **Site settings that save on ANY backend.** The "I can't edit the home texts" bug was
  the old live backend not knowing the `settings`/`saveSettings` actions (Code.gs was
  never redeployed after v2.2). Now there is a second home: on save, the desk falls back
  to a hidden published **carrier entry** (`✦ TALA site settings (system entry - do not
  delete)`) written through the plain create/update actions the original backend has had
  since v1.0. `journal.js` reads it and filters it out of every card, count, filter,
  search and the reader. Native Settings tab still wins once the new backend is
  deployed (empty native tab correctly falls back to the carrier). 7/7 carrier tests pass.
- **README reworked as the standing manual** (Arnold's request): new "⚡ Work state"
  block (live URLs, pending steps, verification), new "🔁 Installing every update"
  PART A/B/C checklist, expanded "💬 Resuming work" with the conventions the next chat
  follows (voice, no em-dashes, always end with install steps, per-version log).
- Files touched: `admin.html`, `assets/js/admin.js`, `assets/js/calendar.js`,
  `assets/js/journal.js`, `assets/css/style.css`, `README.md`.
- Backend: **no new requirement** (works on today's deployed Code.gs). The one-time
  New-version redeploy remains pending for media uploads (v2.1) and the native
  Settings tab (v2.2).

### 2026-09-19 - v2.4 "The fine print"
- **New footer (site and digest pages).** The old three-column footer is replaced with a
  clean colophon: the handwritten TALA ni Arnold mark, the editable motto line, and two
  honest statements:
  - **A course requirement** - this journal is published as a requirement of DEVC 202
    (Development Communication Concepts and Approaches), 20% of the final grade, MDC
    program, UP Open University, 1S 2026-2027; entries are his own writing, views his own.
  - **AI assistance, disclosed** - the site (design, code, calendar, digest) was drafted
    by an AI assistant under Arnold's direction; entries are chosen, written, edited and
    approved by him.
- Small links row preserved (Journal/Calendar/Digest/Admin/RSS), plus the social pills
  and the signature. Settings key `footer_text` now refers to the motto line
  (admin label updated accordingly).
- Files touched: `index.html`, `course.html`, `admin.html`, `assets/css/style.css`, `README.md`.



### 2026-09-19 - v2.3 "TALA ni Arnold + PDFs on the page"
- **New wordmark**: the rail now reads **TALA** with a handwritten **"ni arnold"** under it
  (Caveat script, maroon). Updated on the site rail and the digest page; the browser tab
  and share titles now say "TALA ni Arnold". It stays editable: Site settings → "Line
  under the name".
- **PDFs embed in entries.** New media kind: `![pdf: title](link)` renders a full page
  reader inside the entry - Drive links get Drive's page viewer, direct `.pdf` links get
  the browser's own reader. Files uploaded via ⬆ (now "Upload file") route PDFs this way
  automatically. Other file types (docx, pptx, zip…) render as a clean open/download card.
- **Personal Tala category.** A journal is a journal: the category list now includes
  "Personal Tala" for notes the course never asked for. Course entries still get their
  unit + module; personal notes just leave Module at 0. Helper hint added under Category.
- `markdown.js` grew `pdf` and `file` media kinds (keywords `pdf:`/`file:`, auto-detect
  `.pdf`), `mdToPlain` strips them from excerpts.
- `admin.html` media bar: ⬆ **Upload file** (any file type), new **▤ PDF link** button,
  expanded file picker accept list, updated hints.
- Files touched: `index.html`, `course.html`, `assets/js/config.js`, `assets/js/markdown.js`,
  `assets/js/admin.js`, `admin.html`, `assets/css/style.css`, `README.md`.
- **No backend change** this round (`Code.gs` v2.1/v2.2 upload action already accepts any
  file type). Still pending on your side: the one-time New-version redeploy.

### 2026-09-19 - v2.2 "Site settings, socials and the video box"
- **The site becomes editable from the admin desk.** New "⚙ Site settings" tab (next to
  "✎ Entries") covers: site name, rail line, kicker, headline, welcome paragraph, margin
  note, signature, rail quote, About card, footer text. Values save into a `Settings` tab
  in the Google Sheet (auto-created, public read, key-gated write); `journal.js` fetches
  them at load, with a localStorage cache for instant first paint. Empty setting = the
  built-in text stays.
- **Social media links**: Facebook, Instagram, LinkedIn, YouTube, email - set any of them
  and pills appear in the hero and the footer. Blank = hidden.
- **Intro video on the home page**: paste a YouTube, Google Drive, or .mp4 link in Site
  settings and a playable player renders under the welcome text (reuses the v2.1 media
  player). Optional heading and caption.
- **Course digest refined from the Google Docs version**: real material links (textbook
  PDF, primer, scrapbook reference, sample journal), TMA 1 chapter/TOC detail, TMA 2's
  seven steps, TMA 3 restored to "five pages or less" per the Course Guide (the Docs
  digest says three; the Guide wins), journal = "passport" to the Finals, Dec 6 = 40%.
- **Calendar audit (live)**: `?action=events` returned `{"ok":true,"events":[]}` -
  backend healthy, but the semester map import has NOT been run yet. Expected 19 events.
  Fix: run `importDevCalendar` in the Apps Script editor once (see "Load the official
  DEVC 202 semester map").
- New backend: `GET ?action=settings` + `POST saveSettings` in `Code.gs`, plus the
  `Settings` tab in setupSheet(). ⚠️ Needs a **New version** redeploy, same one as v2.1
  media uploads - paste the newest Code.gs once and redeploy a new version.
- Files touched: `config.js` (SITE_DEFAULTS), `index.html` (ids + slots), `journal.js`
  (applySettings), `admin.html` + `admin.js` (tabs + settings form), `style.css`
  (pills, tabs, settings grid, intro video), `apps-script/Code.gs`, `course.html`, `README.md`.

### 2026-09-19 - v2.1 "Media and the digest"
- **Media in entries.** The journal now carries photos, graphs, audio and video:
  - `assets/js/markdown.js` learned media: a line like `![caption](https://…)` on its own
    becomes a captioned figure; `![video: caption](YouTube/Drive/.mp4)` becomes a real
    player (responsive 16:9 embed or native `<video>`); `![audio: caption](.mp3/.m4a)` an
    audio player. Google Drive share links to photos are rewritten into direct image links.
    Media used inside prose still works (inline image, small audio chip).
  - `admin.html` + `admin.js` gained a **media bar**: ⬆ Photo / graph (upload, with
    browser-side shrinking to 1600 px so Sheets stays light), ⧉ Image link, ▶ Video, ♫ Audio.
  - `apps-script/Code.gs` gained an **`upload` action**: the file lands in a `TALA Media`
    folder in Google Drive (created once, ID remembered in Script Properties), shared
    "anyone with the link can view", and the site stores only the returned address.
    ⚠️ **New backend version needed**: after pasting the new Code.gs, Deploy → Manage
    deployments → New version → Deploy, and approve the Google Drive permission once.
    The web app address stays the same.
- **`course.html` added**: the DEVC 202 course digest on one page (lineage, 7 course goals,
  problematique + 8 problems, Lasswell, media comparison, noise, Quebral definition, 5
  areas of practice, MUAR model, grading matrix, output specs, milestone weeks),
  condensed from the Course Guide and the course pack.
- Nav links to the digest added on the site rail, admin rail, and both footers.
- `style.css` v2.1 pack: `.media-figure` + captions, `.video-embed`, `.audio-chip`,
  `.md-sep`, digest tables (`.tbl`), contrast cards.
- Files touched: `index.html`, `admin.html`, `course.html` (new), `assets/js/markdown.js`,
  `assets/js/admin.js`, `assets/css/style.css`, `apps-script/Code.gs`, `README.md`.
- Site behavior unchanged for everything else; no Sheets schema change.

### 2026-09-19 - v2.0 "Semester map"
- **Real DEVC 202 dates extracted from the Course Guide** (grading matrix p.4):
  TMA 1 (scrapbook + inventory) 27 Sep · TMA 2 (poverty study) 25 Oct · TMA 3
  (Proactive Information Society) 22 Nov · Discussion Forums 1-3 29 Nov ·
  **Journal 6 Dec (20%, this very site!)** · Reflection Synthesis Piece 6 Dec ·
  Looking Back, Moving Forward Vlog 18 Dec. Study sequence confirms TMAs attach to
  Modules 4, 8 and 12, one module per week.
- **New `importDevCalendar()` in Apps Script** (run once from the editor, no
  redeploy): writes 19 events (7 graded deadlines + 12 weekly module milestones,
  Mondays Sep 21 to Dec 18) into the Events tab. Idempotent: skips IDs already
  present. All scope=public.
- Demo seeds in `calendar.js` replaced with the same real semester map.
- Note: the course makes a "DEVC 202 Journal" a graded requirement (20%), which
  this website now fulfills. TMA 1 due date is only days away at build time;
  reminders ("in N days") already highlight it.

### 2026-09-19 - v1.9 "Calendar self-heals"
- **Live bug fix:** the calendar showed "Could not load your calendar from the
  Google Sheet" even though the backend answered fine. Root cause: if a stale or
  mistyped ADMIN_KEY was sitting in the browser (sessionStorage from an earlier admin
  visit), the calendar asked for `eventsAll` with it, got `Unauthorized`, and gave
  up with a generic message. The public journal looked fine because it never uses
  the key.
- `calendar.js loadRemote()` rewritten: keyed request first (all events incl.
  private) → on any refusal it **drops the stale key and retries as public**, so the
  calendar always renders. Non-JSON replies (e.g. an Apps Script HTML error page)
  are detected and reported properly. The error panel now prints the **actual
  reason** plus correct links, instead of always blaming the v1.4 redeploy.
- Verified Arnold's backend end-to-end from curl: `action=events` returns ok,
  wrong-key `eventsAll` returns a graceful `{"ok":false,"error":"Unauthorized"}`,
  live config.js holds a correct API_URL. No backend changes were needed for this
  fix; updating the single file `assets/js/calendar.js` on GitHub is enough.

### 2026-09-19 - v1.8 "Flatten it"
- **Root cause of the plain-text live site found via the GitHub API:** Arnold uploaded
  the `journal` folder itself, so every file sits one level too deep
  (`repo/journal/index.html` instead of `repo/index.html`). On top of that, GitHub's
  default Jekyll run (primer theme) substituted our styles, all JS 404ed, and the
  `_sources/` course PDFs went public by accident.
- **Backend verified healthy meanwhile:** `action=ping`, `action=list`, and
  `action=events` on Arnold's deployed script all return ok. His `/exec` URL is
  baked into `assets/js/config.js` in this workspace (recovered from the broken
  repo so it survives the reset).
- **Prescribed fix:** delete + recreate the repo, upload the folder CONTENTS (not
  the folder), skip `_sources`, create `.nojekyll` via "Create new file", re-enable
  Pages. README Part 1 upload steps now explicitly warn against folder nesting and
  dotfile-skipping by the web uploader.

### 2026-09-19 - v1.7 "Live fix"
- **Diagnosed Arnold's live GitHub Pages site** (acnoda-tala.github.io/journal)
  rendering as plain text: the `assets/` folder never uploaded (style.css was being
  substituted by a GitHub Jekyll theme's normalize CSS at the same path; every JS
  file 404ed - confirmed `assets/js/config.js` 404).
- **Added empty `.nojekyll`** to the project root so GitHub Pages skips Jekyll
  entirely and serves our plain HTML/CSS/JS as-is (also defeats any theme that got
  attached in Pages settings).
- README upload step hardened: explicitly warns to drag the `assets` **folder**,
  verify the upload list shows `assets/css/style.css` paths, and visually confirm the
  `assets` folder on the repo page. Troubleshooting table gained the plain-text-site
  and Jekyll-theme symptoms at the top.

### 2026-09-18 - v1.6 "Pro pass"
- **Bug found & fixed:** `admin.html` still used the old `.site-header` markup, whose
  CSS was removed in v1.3, leaving the admin header unstyled. Admin now ships the
  **same left-rail shell as the site** (Entries / Calendar / View site).
- **Performance & resilience:** skeleton loaders while entries load; **cache-first
  boot** - the last fetched entry list renders instantly from localStorage with a
  discreet "offline copy" note, then silently refreshes; if the fetch fails, the
  cached copy stays up.
- **Reader upgrades:** thin maroon **reading-progress bar** at the top; **copy link**
  button (with clipboard fallback); **previous / next note** navigation by date;
  maroon drop cap retained.
- **Keyboard:** `/` focuses search from the journal view; `Esc` exits the reader.
- **Accessibility:** visible focus rings (`:focus-visible`) on everything
  interactive; full `prefers-reduced-motion` support; semantic nav active states.
- **Print:** a real `@media print` stylesheet - sidebar/footer/progress strip away,
  reader prints like a clean journal page.
- **SEO/social:** author, theme-color, Open Graph and Twitter card meta tags.
- **Calendar:** countdown labels everywhere (today / tomorrow / in N days / N days
  ago); items within 3 days highlight in maroon on the Coming up list and day panel.
- **RSS:** `GET ?action=rss` on the backend returns a full RSS 2.0 feed (20 latest
  published entries); footer link auto-appears once connected. Requires `SITE_URL`
  in Code.gs + a New-version redeploy (see "RSS feed" section).
- Code.gs passes a JS syntax check; zero em dashes project-wide, still true.

### 2026-09-18 - v1.5 "True sidebar"
- **The left rail is now a full navigation sidebar** (per Arnold's request for a
  "sidebar of easy navigation"), widened to 272px and scrollable:
  - **Journal section** - one-click unit filters (All entries, Unit I/II/III, General)
  - **Modules section** - all 13 DEVC 202 modules grouped by unit with live note
    counts; clicking scrolls you straight to the filtered entry list; modules list
    scrolls internally (max-height 34vh) so short screens keep everything reachable
  - **Fresh ink** - your 3 latest entries as serif links
  - quote + identity block stay pinned near the bottom
- `journal.js`: new `renderRailNav()` + `goJournal()` helpers; rail highlights follow
  whatever filter is active, and clicking from the calendar or reader routes you
  back to the journal view.
- Mobile (max-width 980px): the sidebar keeps collapsing into a swipeable top bar;
  the extra sections hide there (the journal view's own filter panels still serve
  small screens).

### 2026-09-18 - v1.4 "Left rail + calendar"
- **Permanent left rail navigation** (`index.html` restructured): fixed white rail on
  the left with the TALA wordmark, nav items (Journal, Calendar, Admin desk), a
  handwritten quote, and Arnold's identity block pinned at the bottom. Active view
  gets a maroon edge marker. On phones (max-width: 980px) the rail collapses into a
  sticky top bar with horizontally scrollable nav; the identity block hides.
- **Personal calendar** (`assets/js/calendar.js`, view at `#/calendar`): month grid
  with prev/next/today, event pills color-coded by type (Deadline maroon, TMA gold,
  Activity green, Personal gray), selected-day panel, "Coming up" next-5 list.
  Add/edit/delete unlocked after signing in at the admin desk (session key).
  Events carry a public/private scope; public visitors only ever receive public
  ones from the API. Demo mode: 6 sample events + localStorage persistence, clearly
  labeled in the UI.
- **Backend v2** (`apps-script/Code.gs`): new **`Events`** tab; `setupSheet()` now
  builds both tabs and is **non-destructive** (no more clearContents, safe to re-run);
  new API actions: GET `events` / `eventsAll`, POST `eventCreate` / `eventUpdate` /
  `eventDelete`. Ids prefixed `v`.
- `journal.js` became a 3-view router (journal/calendar/reader) with rail active
  states; admin desk gained Calendar links (header nav + dashboard button).
- ⚠️ Existing deployments MUST redeploy as a New version and re-run setupSheet
  (README "The personal calendar" section). Calendar shows a clear error message
  until then.

### 2026-09-18 - v1.3 "White room"
- **Full minimalist redesign** (`assets/css/style.css` rewritten from scratch) per
  Arnold's request: beige/paper texture is gone, replaced by a **white canvas**.
- One accent color only: **UP maroon** (#7B1113), used sparingly for the wordmark ✦,
  links, unit badges, blockquote rules, marginalia, and focus states. Green and gold
  survive only as quiet functional colors (publish/draft states).
- Removed all decoration: no sablay woven bands (deleted from both HTML files), no
  gradients, no shadows, no filled colored blocks. Header is now a white sticky bar
  with a hairline; footer is light with a hairline top.
- Entry list redesigned from boxed cards to a **quiet editorial index**: hairline
  separators, small-caps metadata, serif titles that turn maroon on hover.
- Reader view: no card box, just a clean centered column; blockquote = thin maroon
  left rule; marginalia = 2px maroon hairline with handwriting, no yellow box.
- Kept intact: Fraunces serif + Archivo sans + Caveat handwriting; all class names
  unchanged so `journal.js` / `admin.js` needed no changes; admin matches the same
  minimalist language.

### 2026-09-17 - v1.2 "Full shelf"
- **Content pass across the whole site**, all in Arnold's voice (VOICE.md rules applied,
  zero em dashes, no AI-isms).
- **`seed-data.js` now has 8 entries** (7 published + 1 draft): welcome, Module 5
  "Who Says What to Whom" (guard's three questions), Module 1 "The Problems We Got
  Used To", Module 6 field note "The Radio at the Sari-Sari Store" (brownout week),
  Module 9 "Development Is Not Buildings", Module 10 "Who Gets Heard", the COLORS
  archive piece, and the TMA 1 draft. Course map now shows 5 of 13 modules with
  entries; categories in use: Milestone, Personal Essay, Reflection, Reading Notes,
  Field Notes, TMA Draft.
- **Homepage:** added a handwritten "on the desk this week" margin note under the
  signature so the hero feels alive; easy to edit in `index.html` (search for
  "on the desk this week").
- Voice spot-check: entries follow his signature moves (opening question, Bicol
  scene pivot, newsroom anchor, repetition, one-line moral, callback ending).

### 2026-09-17 - v1.1 "Arnold's voice"
- **Found Arnold online:** Information Officer III, Bicol University CPRO (Legazpi);
  former Media Production Specialist I and Media Content Coordinator; news writer for
  BUzzette; bylines on BU news stories (NSCON champs, bar passers, PASUC, IT Skills
  Olympics). Bio added to the site's About card and `config.js`.
- **Created `VOICE.md`:** the style bible built from his essay COLORS plus his news
  register. Rules: simple and direct words, opening question, a real Bicol scene as
  pivot, one pop-culture anchor, repetition that builds, a moral landing in one short
  sentence, callback ending. **No em dashes, ever. No AI-isms.** Read it before
  writing any entry or site copy.
- **Rewrote all 6 seed entries in his voice** (`seed-data.js`), including reposting
  his actual piece COLORS (Pride Month essay) as an archive entry with a margin note;
  new entries use his newsroom lens (Bicol University, "I write good news for a
  living") and his Bikol sign-off "padagos!"
- **Site copy voiced** (`index.html`): hero lede now his words, About card mentions
  BU + Legazpi beside Mayon, signature line now "padagos! ✎ arnold c. noda".
- **Zero em/en dashes project-wide:** scrubbed every file (grep-verified). Reader
  marginalia now ends "- arnold".
- New category added: **Personal Essay** (for archive pieces like COLORS).

### 2026-09-17 - v1.0 "First light"
- **Analyzed** the DEVC202 Drive folder (5 PDFs): course guide (3 units/13 modules, MDC/UPOU, 1S 2026-2027), Ongkiko & Flor textbook, Quebral Primer, *Voice & Matter*, Servaes/UNESCO *Communication for Development and Social Change*.
- **Built the journal site** `index.html` - UP-maroon/green academic design, sablay-inspired band, handwritten accents; hero with live stats; filters by unit/category; **course map sidebar with all 13 modules**; sources list; hash-based reader view (works on GitHub Pages); demo mode with 6 seed entries written from the actual readings.
- **Built the admin desk** `admin.html` - passcode login (session-only), entries table, one-click publish/draft toggle, delete with confirm, Markdown editor with toolbar + **live preview**, auto-excerpt, drafts stay private.
- **Backend** `apps-script/Code.gs` - `doGet` (list/listAll/ping), `doPost` (create/update/delete), `setupSheet()` one-click initializer, formula-injection guard, LockService for safe writes, date normalization.
- **Docs** - this README with full step-by-step setup; `.gitignore` guards `_sources/`.
- **Known limitations / next ideas:** single-user passcode (fine for personal use); images need external URLs; search is local (instant) rather than server-side; possible v1.1 items: photo essays, entry reactions, RSS feed, "TMA tracker" widget, dark mode.

---
*"Communication is not the megaphone of development; it is the space where development gets defined."* - journal epigraph, A.C.N.
