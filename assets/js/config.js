/* =========================================================
   TALA - Journal Configuration
   ---------------------------------------------------------
   STEP 1: Deploy your Google Apps Script (see README.md).
   STEP 2: Paste your Web App URL below (it ends with /exec).
   Leave API_URL empty to run the site in "demo mode" with
   the built-in sample entries.
   ========================================================= */

const JOURNAL_CONFIG = {
  /* ⬇️⬇️⬇️ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE ⬇️⬇️⬇️ */
  API_URL: 'https://script.google.com/macros/s/AKfycbyr3FvzVgsD5_NTdbMHkCM-oDqG0_g1aVVbnQSRmX3pSxHksXf8z0LYwOvj_zm6aSQ4/exec',
  /* Example: 'https://script.google.com/macros/s/AKfycbx.../exec' */

  SITE_TITLE: 'Tala',
  SITE_TAGLINE: 'Notes on development, communication, and social change',
  AUTHOR: 'Arnold C. Noda',
  AUTHOR_ROLE: 'Information Officer III, Bicol University · DevCom student, UP Open University',
  COURSE: 'DEVC 202 · Development Communication Concepts & Approaches',
  SCHOOL: 'University of the Philippines Open University',
};

/* Course map - straight from the DEVC 202 Course Guide (1S 2026-2027). */
const COURSE_MAP = [
  {
    unit: 'Unit I',
    theme: 'Development',
    modules: [
      { n: 1, title: 'Societal Problems' },
      { n: 2, title: 'Underdevelopment Problematique' },
      { n: 3, title: 'What is Development?' },
      { n: 4, title: 'Of Blind Men and Paradigms' },
    ],
  },
  {
    unit: 'Unit II',
    theme: 'Communication',
    modules: [
      { n: 5, title: 'The Communication Process' },
      { n: 6, title: 'Communication Media' },
      { n: 7, title: 'Barriers to Effective Communication' },
      { n: 8, title: 'Communication Concepts' },
    ],
  },
  {
    unit: 'Unit III',
    theme: 'Development Communication',
    modules: [
      { n: 9, title: 'Definitions of Development Communication' },
      { n: 10, title: 'Foundations of Development Communication' },
      { n: 11, title: 'Development Communication Practice' },
      { n: 12, title: 'Development Communication and Policy' },
      { n: 13, title: 'Development Communication Myths' },
    ],
  },
];

/* Categories offered in the admin editor (you can also type your own). */
const CATEGORIES = [
  'Reflection',
  'Personal Tala',    // your uncourse notes: write them whenever you feel like it
  'Personal Essay',
  'Reading Notes',
  'Field Notes',
  'TMA Draft',
  'Insight',
  'Milestone',
];

/* The readings from the course pack - shown in the "Sources" section. */
const SOURCES = [
  {
    label: 'Ongkiko, I.V.C. & Flor, A. - *Introduction to Development Communication*',
    note: 'Main course textbook; one chapter per module.',
  },
  {
    label: 'Quebral, N.C. - *Development Communication Primer* (2012)',
    note: 'The UPLB definition of devcom, in Q&A form.',
  },
  {
    label: 'Hemer & Tufte (eds.) - *Voice & Matter: Communication, Development and the Cultural Return* (2016)',
    note: 'Nordicom anthology on communication for development today.',
  },
  {
    label: 'Servaes, J. (ed.) - *Communication for Development and Social Change* (UNESCO/SAGE, 2008)',
    note: 'Approaches to development: from modernization to participation.',
  },
  {
    label: 'Amoloza & Tanay - *DEVC 202 Course Guide & Resource Kit* (1S 2026-2027)',
    note: 'Outline, activities, TMAs, and additional readings.',
  },
];

/* =========================================================
   SITE DEFAULTS (v2.2)
   The starting text of the site's editable parts. The admin
   desk's "Site settings" tab pre-fills from these; whatever
   you save there is stored in the "Settings" tab of your
   Google Sheet and overrides these defaults on the live site.
   ========================================================= */

const SITE_DEFAULTS = {
  /* --- the site --- */
  site_name:  'TALA',
  rail_sub:   'ni arnold',
  rail_sub2:  'a journal blog',
  hero_kicker: 'DEVC 202 · Development Communication Concepts & Approaches',
  hero_title:  'Notes on *development*, *communication*, and social change.',
  hero_lede:   'In Filipino, **tala** means two things: a note, and a star.\nThis journal will be both. By day I write news for **Bicol University**.\nBy night I study **Development Communication** at the\n**University of the Philippines Open University**. This is where the two meet.\nNo press release here. Just one man, his readings, and the questions he cannot shake off.',
  hero_note:   'on the desk this week: Ongkiko & Flor, Chapter 3. What is development, really?',
  signature:   'padagos! ✎ arnold c. noda',

  /* --- sidebar and footer --- */
  rail_quote:  '"no press release here. just the harder questions."',
  about_who:   'Arnold C. Noda',
  about_role:  'Information Officer III, Bicol University CPRO\nDevCom student, UP Open University · 1S 2026-2027',
  about_text:  'I write news by day: champions, board passers, ribbon cuttings. I read DevCom\nby night. This journal keeps the questions that good news cannot answer.\nWriting from Legazpi, beside Mayon and the sea.',
  footer_text: 'A journal for DEVC 202, kept in public so I will remember what I promised\nmyself to become.\nWritten in Legazpi City, where the sea is never far.',
  footer_req_text: '**A course requirement.** This website is my learning journal for **DEVC 202: Development Communication Concepts and Approaches**, published as a course requirement (the journal itself carries 20% of the final grade) of the Master of Development Communication program, University of the Philippines Open University, First Semester 2026-2027. Unless a note says otherwise, every entry here is my own writing. The views on this site are mine alone: not my employer\u2019s, and not my school\u2019s.',

  calendar_title: 'My calendar',
  calendar_sub:  'Deadlines, activities, readings, and everything else this semester throws at me. **Red** is a deadline, **gold** is a TMA, **green** is an activity, **gray** is personal. Sign in at the [admin desk](admin.html) to add your own.',

  /* --- social media (blank = hidden) --- */
  social_facebook:  '',
  social_instagram: '',
  social_linkedin:  '',
  social_youtube:   '',
  social_email:     '',

  /* --- intro video, plays on the home page (blank = hidden) --- */
  intro_video:        '',
  intro_video_caption: '',
  intro_video_title:  'an introduction, on video',
};
