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
  // links: [text](url)
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');
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
