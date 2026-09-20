/* =========================================================
   TALA - tiny Markdown renderer (shared by journal + admin)
   Supports: headings, bold, italic, code, quotes, lists,
   links, images with captions, video players, audio players,
   horizontal rules, paragraphs, line breaks.

   Media, one item per line (blank line above and below):
     ![caption](https://photo-link)        photo or graph
     ![video: caption](youtube or drive or .mp4 link)
     ![audio: caption](.mp3 or .m4a link)
     ![pdf: caption](drive or .pdf link)   embedded PDF reader
     ![file: name](any link)               open/download card
   Plain YouTube and Google Drive links are detected and
   turned into the right player automatically; .pdf links
   become the PDF reader.

   Source text is HTML-escaped first, so it is safe to render.
   ========================================================= */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- media helpers ---------- */

/* YouTube id from watch?v=, youtu.be, /shorts/, /embed/, /live/ */
function ytId_(url) {
  const m = String(url).match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?[^ ]*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,15})/
  );
  return m ? m[1] : null;
}

/* Google Drive file id from /file/d/ID or ?id=ID */
function driveId_(url) {
  const m = String(url).match(/(?:drive|docs)\.google\.com\/file\/d\/([\w-]{10,})/)
         || String(url).match(/(?:drive|docs)\.google\.com\/.*?[?&]id=([\w-]{10,})/);
  return m ? m[1] : null;
}

const VIDEO_EXT = /\.(mp4|webm|ogv|mov)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac|opus|aac)(\?|#|$)/i;
const PDF_EXT   = /\.pdf(\?|#|$)/i;

/* Decide what kind of media a token is, and normalize its URL.
   Note: works on ALREADY-escaped text (that is how mdToHtml feeds us),
   which is exactly what we want to inject into attributes. */
function classifyMedia_(alt, url) {
  alt = String(alt || '').trim();
  let kind = 'image';
  const kw = alt.match(/^(video|audio|pdf|file)\b[:\s]*/i);
  if (kw) {
    kind = kw[1].toLowerCase();
    alt = alt.slice(kw[0].length).trim();
  } else if (ytId_(url) || VIDEO_EXT.test(url)) {
    kind = 'video';
  } else if (AUDIO_EXT.test(url)) {
    kind = 'audio';
  } else if (PDF_EXT.test(url)) {
    kind = 'pdf';
  }
  if (kind === 'image') {
    const dv = driveId_(url);
    // A Drive share link to a photo becomes a direct image link.
    if (dv) url = 'https://lh3.googleusercontent.com/d/' + dv;
  }
  return { kind: kind, alt: alt, url: url };
}

/* full-line token, e.g. `![video: my caption](https://...)` */
function parseMediaToken_(line) {
  const m = String(line).match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
  return m ? classifyMedia_(m[1], m[2]) : null;
}

/* the player itself (no caption/figure wrapper) */
function playerHtml_(t) {
  const yt = ytId_(t.url), dv = driveId_(t.url);
  const title = t.alt || 'Video';
  if (yt) {
    return '<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + yt +
      '" title="' + title + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; ' +
      'encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
  }
  if (dv) {
    return '<div class="video-embed"><iframe src="https://drive.google.com/file/d/' + dv +
      '/preview" title="' + title + '" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe></div>';
  }
  return '<video controls preload="metadata" src="' + t.url + '">Your browser cannot play this video.</video>';
}

/* PDF reader: Drive files use Drive's own page viewer; a direct
   .pdf link is shown by the browser's built-in PDF reader. */
function pdfHtml_(t) {
  const dv = driveId_(t.url);
  const src = dv ? 'https://drive.google.com/file/d/' + dv + '/preview' : t.url;
  return '<div class="pdf-embed"><iframe src="' + src + '" title="' +
    (t.alt || 'PDF document') + '" loading="lazy"></iframe></div>';
}

/* files that cannot embed (docx, pptx, zip…) become a neat open/download card */
function fileCardHtml_(t) {
  const host = (String(t.url).match(/^https?:\/\/([^\/]+)/) || [,'file'])[1];
  return '<a class="file-card" href="' + t.url + '" target="_blank" rel="noopener">' +
    '<span class="fc-glyph">▨</span>' +
    '<span class="fc-main"><b>' + (t.alt || 'Attached file') + '</b>' +
    '<span class="fc-sub">' + host + ' · opens in a new tab</span></span>' +
    '<span class="fc-open">Open ↗</span></a>';
}

/* block-level render: figure + optional caption */
function mediaHtml_(t) {
  const cap = t.alt ? '<figcaption>' + mdInline(t.alt) + '</figcaption>' : '';
  if (t.kind === 'image') {
    return '<figure class="media-figure"><img src="' + t.url + '" alt="' + t.alt +
      '" loading="lazy">' + cap + '</figure>';
  }
  if (t.kind === 'audio') {
    return '<figure class="media-figure audio"><audio controls preload="metadata" src="' +
      t.url + '"></audio>' + cap + '</figure>';
  }
  if (t.kind === 'pdf') {
    return '<figure class="media-figure pdfdoc">' + pdfHtml_(t) + cap + '</figure>';
  }
  if (t.kind === 'file') {
    return fileCardHtml_(t);
  }
  return '<figure class="media-figure player">' + playerHtml_(t) + cap + '</figure>';
}

/* inline render: a media token that sits inside prose */
function mediaInlineHtml_(t) {
  if (t.kind === 'image') {
    return '<img src="' + t.url + '" alt="' + t.alt + '" loading="lazy" class="media-inline">';
  }
  if (t.kind === 'audio') {
    return '<span class="audio-chip"><audio controls preload="metadata" src="' + t.url + '"></audio></span>';
  }
  if (t.kind === 'pdf' || t.kind === 'file') {
    return fileCardHtml_(t);
  }
  return playerHtml_(t);
}

/* ---------- inline markdown ---------- */

function mdInline(s) {
  // images & media first: ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (m, alt, url) => mediaInlineHtml_(classifyMedia_(alt, url)));
  // links: [text](url) - absolute or relative; dangerous protocols dropped
  s = s.replace(/\[([^\]]+)\]\(([^()\s]+)\)/g, (m, t, url) => {
    if (/^(?:javascript|data|vbscript):/i.test(url)) return t;
    const ext = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + url + '"' + ext + '>' + t + '</a>';
  });
  // bold then italic then inline code
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function mdToHtml(src) {
  const text = escapeHtml(String(src || '')).replace(/\r\n?/g, '\n');
  const blocks = text.split(/\n{2,}/);
  const html = [];

  for (let raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    if (/^-{3,}$/.test(block)) { html.push('<hr>'); continue; }

    // [module N · subtitle] - a badge banner for course-module entries
    const moduleM = block.match(/^\[module\s+([^\]]+)\]$/);
    if (moduleM) {
      const parts = moduleM[1].split('·').map(x => x.trim()).filter(Boolean);
      const num = parts[0] || '';
      const ttl = parts.slice(1).join(' · ');
      html.push(
        '<div class="module-badge"><span class="mb-kick">DEVC 202 · Module ' + mdInline(num) + '</span>' +
        (ttl ? '<span class="mb-title">' + mdInline(ttl) + '</span>' : '') + '</div>');
      continue;
    }

    // [refs] ... [/refs] - APA reference list: one citation per line;
    // auto-sorted A-Z by author, deduped, trailing period, hanging indent.
    // Use *asterisks* for the bits APA italicizes (journal/book titles, volume).
    if (/^\[refs\][\s\S]*?\[\/refs\]$/.test(block)) {
      const inner = block.replace(/^\[refs\]/, '').replace(/\[\/refs\]\s*$/, '');
      const items = inner.split('\n').map(l => l.trim()).filter(Boolean);
      if (items.length) {
        const norm = items
          .map(l => l.replace(/\s{2,}/g, ' ').replace(/[\s.;,]*$/, '') + '.')
          .filter((l, i, a) => a.indexOf(l) === i);
        const key = s => s.replace(/^[*_]+/, '').toLowerCase();
        norm.sort((a, b) => key(a).localeCompare(key(b)));
        const linkify = s => s.replace(/href="([^"]*)"|(https?:\/\/[^\s<]*[^\s<.,;:!?'")])/g,
          (m, existing, bare) => existing ? m :
            '<a href="' + bare + '" target="_blank" rel="noopener">' + bare + '</a>');
        html.push('<section class="apa-refs"><h4 class="apa-h">References</h4><div class="apa-list">' +
          norm.map((l, i) => '<p class="apa-ref" id="ref-' + (i + 1) + '">' + linkify(mdInline(l)) + '</p>').join('') +
          '</div></section>');
      }
      continue;
    }

    const h = block.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length + 2; // start at h3 for document outline safety
      html.push(`<h${level}>${mdInline(h[2])}</h${level}>`);
      continue;
    }

    /* handwritten margin note: !! your note */
    if (block.startsWith('!!')) {
      html.push(`<div class="marginalia">✎ ${mdInline(block.slice(2).trim())}</div>`);
      continue;
    }

    if (block.startsWith('&gt;')) {
      const quote = block.split('\n')
        .map(l => l.replace(/^&gt;\s?/, ''))
        .join('\n');
      html.push(`<blockquote>${mdToHtmlInner(quote)}</blockquote>`);
      continue;
    }

    /* media block: one or more lines of only ![...](...)
       becomes figures, video players, audio players */
    {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const tokens = lines.map(parseMediaToken_);
      if (lines.length && tokens.every(Boolean)) {
        html.push(tokens.map(mediaHtml_).join('\n'));
        continue;
      }
    }

    if (/^[-*]\s+/m.test(block)) {
      const items = block.split('\n')
        .filter(l => /^[-*]\s+/.test(l))
        .map(l => `<li>${mdInline(l.replace(/^[-*]\s+/, ''))}</li>`)
        .join('');
      if (items) { html.push(`<ul>${items}</ul>`); continue; }
    }

    html.push(`<p>${mdInline(block).replace(/\n/g, '<br>')}</p>`);
  }
  return html.join('\n');
}

/* inner helper so blockquotes can contain simple inline markup */
function mdToHtmlInner(text) {
  return text.split(/\n{2,}/)
    .map(p => `<p>${mdInline(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/* Plain-text excerpt helper (used by admin auto-excerpt).
   Media blocks collapse to their captions; players vanish. */
function mdToPlain(src) {
  return String(src || '')
    .replace(/!\[(?:video|audio|pdf|file)\b[^\]]*\]\([^)]+\)/gi, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- intelligent citation linking (v2.14) ----------
   After an entry is rendered, every in-text citation that matches a listed
   reference - "(Author, 2023)", "(Ongkiko & Flor, 2021)", narrative
   "Author (2023)" - becomes a link that scrolls to that reference.
   The reference's own URL stays clickable: first click finds it, second
   click goes to the source. Pure-text core (mdCiteMarkText) under a DOM
   wrapper (linkCitations) so the matcher can be unit-tested. */

function mdCiteCandidates(refTexts) {
  const out = [];
  (refTexts || []).forEach((txt, i) => {
    const yearM = String(txt || '').match(/\((\d{4}[a-z]?|n\.d\.)/);
    const c = { id: i + 1, year: yearM ? yearM[1] : null, tokens: new Set() };
    /* author = text before the date parenthesis (APA 7: "Surname, initials. (year)."
       and "Organization Name. (year).") - handles dates containing commas */
    const sm = String(txt || '').match(/^(.+?)\.? \(/);
    let author = sm ? sm[1] : '';
    author = author.replace(/^[*_]+/, '').replace(/[.;,]\s*$/, '').trim();
    const surname = author.split(',')[0].trim();
    if (!surname) return;
    c.tokens.add(surname);
    if (/&/.test(author)) {
      const parts = author.split('&');
      if (parts.length >= 2) {
        const s1 = parts[0].split(',')[0].trim(), s2 = parts[1].split(',')[0].trim();
        c.tokens.add(s1); c.tokens.add(s2);            // Ongkiko + Flor
        c.tokens.add(s1 + ' & ' + s2);                 // "Ongkiko & Flor"
      }
    }
    const words = surname.split(/\s+/).filter(w => /^[A-Z0-9]/.test(w));
    if (words.length >= 2) {
      c.tokens.add(words.map(w => w[0]).join(''));                                    // PSA, NEDA, CPBRD
      if (words.length <= 3) c.tokens.add(words[0][0] + words[words.length - 1][0] + (words[words.length - 1][1] || ''));  // BTr
    }
    out.push(c);
  });
  return out;
}

const CITE_OPEN = '⟨cite:', CITE_CLOSE = '⟩', CITE_END = '⟨/cite⟩';

function mdCiteMarkText(text, cands) {
  if (!cands || !cands.length) return text;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flat = [];
  cands.forEach(c => c.tokens.forEach(t => { if (t.length > 2) flat.push({ token: t, id: c.id, year: c.year }); }));
  flat.sort((a, b) => b.token.length - a.token.length);

  /* (a) parenthetical citations - a year (or n.d.) must follow a comma inside,
         so "(PSA Board Resolution 13-2024)" and plain parentheses do NOT link */
  text = text.replace(/\(([^()]{3,90})\)/g, function (m, inner) {
    const years = (inner.match(/,\s*(\d{4}[a-z]?|n\.d\.)/g) || []).map(y => y.replace(/^,\s*/, ''));
    if (!years.length) return m;
    for (const c of flat) {
      if (c.year && years.indexOf(c.year) === -1) continue;
      if (new RegExp('(^|[\\s,;])' + esc(c.token) + '(?=$|[\\s,;])', 'i').test(inner)) {
        return CITE_OPEN + c.id + CITE_CLOSE + m + CITE_END;
      }
    }
    return m;
  });

  /* (b) narrative citations - "Token (Year)" */
  flat.forEach(c => {
    if (!c.year) return;
    const rx = new RegExp('(^|[\\s>])(' + esc(c.token) + ') \\(' + esc(c.year) + '\\)(?![a-z0-9])', 'gi');
    text = text.replace(rx, (m, pre, tok) => pre + CITE_OPEN + c.id + CITE_CLOSE + tok + ' (' + c.year + ')' + CITE_END);
  });
  return text;
}

function linkCitations(container) {
  if (!container || !container.querySelectorAll) return;
  const refEls = Array.prototype.slice.call(container.querySelectorAll('.apa-refs .apa-ref'));
  if (!refEls.length) return;
  if (refEls[0].id === '' ) { /* ids come from the renderer */ }
  const cands = mdCiteCandidates(refEls.map(p => p.textContent || ''));
  if (!cands.length) return;
  refEls.forEach((p, i) => { if (!p.id) p.id = 'ref-' + (i + 1); }); // renderer already ids them; belt + suspenders

  const SKIP = { A: 1, CODE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, BUTTON: 1 };
  const walker = document.createTreeWalker(container, 4 /* SHOW_TEXT */);
  const jobs = [];
  let node;
  while ((node = walker.nextNode())) {
    const v = node.nodeValue || '';
    if (v.length < 6) continue;
    let bad = false, p = node.parentElement;
    while (p && p !== container) {
      if (SKIP[p.tagName] || (p.classList && (p.classList.contains('apa-refs') || p.classList.contains('toc-pill')))) { bad = true; break; }
      p = p.parentElement;
    }
    if (bad || !/(\(\d{4}[a-z]?|\(n\.d\.|, 1[0-9]{3}|[A-Z][A-Za-zÀ-ž.·'&-]+ \(\d{4})/.test(v)) continue;
    const marked = mdCiteMarkText(v, cands);
    if (marked !== v) jobs.push([node, marked]);
  }
  jobs.forEach(([node, marked]) => {
    const frag = document.createDocumentFragment();
    const rx = /⟨cite:(\d+)⟩([\s\S]*?)⟨\/cite⟩/g;
    let last = 0, m;
    while ((m = rx.exec(marked))) {
      if (m.index > last) frag.appendChild(document.createTextNode(marked.slice(last, m.index)));
      const a = document.createElement('a');
      a.className = 'cite-link';
      a.setAttribute('href', '#ref-' + m[1]);
      a.setAttribute('title', 'Jump to the reference - its link is the final step.');
      a.textContent = m[2];
      frag.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < marked.length) frag.appendChild(document.createTextNode(marked.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });

  if (!container.__citeWired) {
    container.__citeWired = true;
    container.addEventListener('click', e => {
      const a = e.target && e.target.closest ? e.target.closest('a.cite-link') : null;
      if (!a) return;
      e.preventDefault();
      const t = document.getElementById((a.getAttribute('href') || '').slice(1));
      if (!t) return;
      const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      t.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' });
      t.classList.remove('ref-flash');
      void t.offsetWidth;
      t.classList.add('ref-flash');
    });
  }
}
