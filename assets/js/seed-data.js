/* =========================================================
   TALA, sample entries (demo mode)
   Written in Arnold's voice per VOICE.md: simple and direct,
   no em dashes, no filler. These show only while
   JOURNAL_CONFIG.API_URL is empty. Once the Google Sheet is
   connected, they disappear and real entries take over.
   ========================================================= */

const SEED_ENTRIES = [
  {
    id: 'seed-tala',
    title: 'Why I Am Keeping This Journal',
    unit: 'General',
    module: 0,
    category: 'Milestone',
    date: '2026-09-15',
    tags: 'tala, devcom, upou, first',
    status: 'published',
    excerpt:
      'By day I write news for Bicol University. By night I am a DevCom student at UP Open University. This journal is where the two meet.',
    content:
      "Why keep a journal? If you asked me before, I would have said I am too busy. I write for a living. Why write more?\n\n" +
      "This week I started DEVC 202 under the UP Open University, my first course as a Master of Development Communication student. Then I changed my tune.\n\n" +
      "In Filipino, *tala* means two things. A note. A star. This site will be both. A note, because I will record what I learn here. A star, because I need something to steer by on the semesters ahead.\n\n" +
      "Here is my work arrangement. By day, I write news for Bicol University. Champions, board passers, new buildings. Good news, most of the time. I love that job. But our textbook says a development communicator must stay awake to the problems that good news cannot solve. So I need a place for the harder questions.\n\n" +
      "This is that place. No press release here. Just one man, his readings, and the questions he cannot shake off.\n\n" +
      "Padagos.",
  },
  {
    id: 'seed-who-says',
    title: 'Who Says What to Whom (Module 5)',
    unit: 'Unit II',
    module: 5,
    category: 'Reflection',
    date: '2026-09-14',
    tags: 'communication process, lasswell, module 5, newsroom',
    status: 'published',
    excerpt:
      'We posted the rules clearly, and still they lined up at the gate to ask. Module 5 taught me the difference between sending a message and communicating.',
    content:
      "Last enrollment season, our office posted the scholarship rules. Clear words, clean layout, shared on every page we run. Still, the guard at the gate answered the same three questions all week.\n\n" +
      "We sent the message. But did we communicate?\n\n" +
      "Module 5 walks through the communication process. There is the old Lasswell question: **who says what, in which channel, to whom, with what effect.** I first read that in college. Reading it now, as the man who writes the *what*, it stings a little.\n\n" +
      "Because I count my work at *says what*. I should be counting it at *with what effect*. A post is not the finish line. Understanding is.\n\n" +
      "The models put noise everywhere. In the channel. In the receiver. Even in the sender. In my newsroom the noise is real. A caption too long for a phone screen. A word our readers in the far towns never use. A page they never followed in the first place.\n\n" +
      "So one habit changes this week. Before I publish anything, I ask the guard's three questions. If the post does not answer them, it is not done.\n\n" +
      "A message sent is not a message received. That is the whole module, and the whole job.",
  },
  {
    id: 'seed-awake',
    title: 'The Problems We Got Used To (Module 1)',
    unit: 'Unit I',
    module: 1,
    category: 'Reflection',
    date: '2026-09-12',
    tags: 'societal problems, bicol, awareness, module 1',
    status: 'published',
    excerpt:
      'Poverty, floods, neighbors leaving for abroad. I see these so often they stopped looking like problems. Module 1 says that is exactly the danger.',
    content:
      "When was the last time a problem surprised me? If you ask me, I cannot remember.\n\n" +
      "Module 1 talks about societal problems. Poverty. Inequality. Sickness. Powerlessness. The textbook says they come in clusters, and I believe it. In Bicol we know this by heart. Typhoon season comes, families rebuild. A neighbor's child leaves for Manila, then for abroad. We say *kanya-kanyang diskarte lang*. Life goes on.\n\n" +
      "The textbook has a harder point. It says these problems stay because we got used to them. We are desensitized. I read that word three times. It felt personal.\n\n" +
      "I write good news for a living, and I am proud of it. But I ask myself now: in telling the wins, did I stop seeing the losses? On the drive to work I pass the same spots where the floods sit after rain. I stopped noticing them years ago. They became scenery.\n\n" +
      "The book says awareness is the impetus for practice. In plain words: to work on a problem, you first have to feel it again.\n\n" +
      "So here is my note to self. Look again. The problems we got used to are still problems. The day they stop bothering me is the day I become part of why they stay.",
  },
  {
    id: 'seed-radio',
    title: 'The Radio at the Sari-Sari Store (Module 6)',
    unit: 'Unit II',
    module: 6,
    category: 'Field Notes',
    date: '2026-09-10',
    tags: 'media, radio, brownout, module 6, field notes',
    status: 'published',
    excerpt:
      'When the power died, every screen on our street went dark with it. The news kept moving though, on a small battery radio by the register.',
    content:
      "Field note, from a brownout week.\n\n" +
      "The storm took the power early in the evening. The WiFi died first. The mobile signal weakened like it was tired too. Every television on our street went dark.\n\n" +
      "Except one sound. The sari-sari store had a small battery radio, the old kind with an antenna you pull out like a straw. People gathered under the bulb of a rechargeable lamp. Nobody looked at a phone. Everybody looked at the radio, as if it had a face.\n\n" +
      "Module 6 is about communication media. The textbook lists them: print, broadcast, film, the new media. Reading that list in an airconditioned room, the new media sounds like the winner. Sitting through a brownout, you learn the truth: the best channel is the one that still works.\n\n" +
      "We say media are extensions of man. That night I saw it the other way. The radio was nobody's extension. It was the one nerve of the town still firing.\n\n" +
      "In devcom we love debating which channel is most modern. The storm gave the correct answer. The most modern channel is the one your listener can actually hear tonight.\n\n" +
      "The lights came back after two days. The radio went back to its shelf. I will not forget what it carried.",
  },
  {
    id: 'seed-buildings',
    title: 'Development Is Not Buildings (Module 9)',
    unit: 'Unit III',
    module: 9,
    category: 'Reflection',
    date: '2026-09-08',
    tags: 'quebral, definitions, module 9, development',
    status: 'published',
    excerpt:
      'I used to think development means new roads and taller buildings. Quebral’s definition, rewritten over forty years, taught me otherwise.',
    content:
      "If you asked me last month what development means, I would have pointed outside. A new road. A new building. A mall where the rice field used to be.\n\n" +
      "Then I read Quebral's Primer for Module 9. In 1971 she defined development communication as the art and science of human communication for the *speedy* transformation of a country from poverty to growth. Forty years later she rewrote it. The word *speedy* is gone. In its place: equity, and the unfolding of individual potential.\n\n" +
      "Think about that change. The first version was in a hurry. The new one learned to ask: growth for whom?\n\n" +
      "I have seen how a road can be called progress even when the people it displaced were never asked. We in the newsroom write the story of the ribbon cutting. Rarely the story of the ones who watched it from outside the fence.\n\n" +
      "> Any communication practitioner who helps disadvantaged people better their lives so that they can realize their potential is a development communicator.\n\n" +
      "By that measure, development is not buildings. It is people becoming more of what they could be. And my job, our job, is to make sure they are heard on the way there.\n\n" +
      "Roads are easy to count. Dignity is not. But dignity is the point.",
  },
  {
    id: 'seed-voice',
    title: 'Who Gets Heard (Voice and Matter)',
    unit: 'Unit III',
    module: 10,
    category: 'Reading Notes',
    date: '2026-09-05',
    tags: 'voice and matter, participation, module 10, media',
    status: 'published',
    excerpt:
      'In my office we count likes, shares, and reach. Hemer and Tufte ask a better question: who gets heard?',
    content:
      "At work we count everything. Likes, shares, reach, views. Big numbers go in the report. Small numbers get explained away.\n\n" +
      "This week's reading, *Voice and Matter* by Hemer and Tufte, made me uneasy about that. The book gathers thinkers of communication for development and says the field is having a *cultural return*. After years of counting outputs, people are asking again who gets heard.\n\n" +
      "Three things I underlined:\n\n" +
      "- From Latin America: communication is something done **with** people, not **to** people.\n" +
      "- From Africa: *ubuntu*. I am because we are. No one matters alone.\n" +
      "- From practice: media is a tool for emancipation, not only for announcements.\n\n" +
      "I think of our comment sections back home. The loudest voices are not always the truest. The quiet ones, maybe a farmer, maybe a student org with twelve members, may be carrying the realest story in town. Reach will never show me that. Only listening will.\n\n" +
      "A like is not a voice. A view is not a hearing. I knew this before, I think. Now I have the words for it.",
  },
  {
    id: 'seed-colors',
    title: 'COLORS',
    unit: 'General',
    module: 0,
    category: 'Personal Essay',
    date: '2025-06-28',
    tags: 'pride, acceptance, archive, colors',
    status: 'published',
    excerpt:
      'What do colors mean to me? If you ask me, I would have told you absolutely nothing. But today as I look beyond the sunsets beside the shore, I changed my tune.',
    content:
      "!! From my archive. Written for Pride Month, before I entered DevCom. I keep it here to remind me why I write.\n\n" +
      "What do colors mean to me? If you ask me, I would’ve told you absolutely nothing. But today as I look beyond the sunsets beside the shore, I changed my tune.\n\n" +
      "Colors don’t only give life to our dull and gray scaled perspective. Deep within, it conveys meaning we ignore most of the time. Even through colors, we communicate. But as we deepen our understanding of people through colors, we unconsciously lock away the intention it withholds.\n\n" +
      "Imagine every day, we navigate our pretentious life like Lacie Pound from Nosedive of Black Mirror series. We please other people in order for us not to be alone or not to be criticized by the society. The fact is, there are colors that are unacceptable to people’s beliefs and culture. There are colors that are taboos and disrespectful. Alas, there are also colors that are changing because it’s inevitable. These colors divide us, but it unites our ambition and purpose because each and one of us needed these colors.\n\n" +
      "The point is, every one of us is different maybe in culture, beliefs, religion and even sexuality. Being different doesn’t mean the society has the right to judge you. Being different is having an admirable courage we should have. There’s nothing wrong in showing your true colors. It just means that you’re being true to yourself. Don’t be like Lacie who wants to fit in even though she can’t because she wanted fame and acceptance from the society. In the end, only regret was there for her.\n\n" +
      "As we celebrate Pride Month, we celebrate acceptance, awareness and most of all respect. There may be some complex understanding on how the LGBTQIA+ community expresses themselves yet they are still human, we all are. Sex is not an issue and never was. We all have preferences, well most of us. This community has done countless contributions for the progress of our society. Not only that, when it comes to entertainment, LGBTQIA+ people are considered to be one of the best entertainers here in the Philippines.\n\n" +
      "Now for me, color is an expression. It’s not just a mere decoration that pleases the eyes. It does not only give life to black and whites. We live by all the colors around us. There may be colors that are new to our eyes, undiscovered and difficult to describe, nevertheless they also serve a purpose. Colors are blending. It conveys deep meaning we need to see by the eyes and felt by our hearts.",
  },
  {
    id: 'seed-tma1',
    title: 'TMA 1, Working Notes',
    unit: 'Unit I',
    module: 2,
    category: 'TMA Draft',
    date: '2026-09-17',
    tags: 'tma, draft, underdevelopment',
    status: 'draft',
    excerpt:
      'Scratch notes for Tutor Marked Assignment 1 on the underdevelopment problematique. Not ready for public reading.',
    content:
      "### Scratch notes, not for sharing yet\n\n" +
      "- Reread Module 2 before writing. Underdevelopment problematique.\n" +
      "- Possible angle: how my barangay talks about leaving. Diskarte as development. Is that a symptom of the problematique itself?\n" +
      "- Check the TMA 1 instructions in the Course Guide for the exact prompt and the rubric.\n" +
      "- Deadline check with the FIC.\n\n" +
      "!! Reminder: write it simple. Pass first to yourself, then to the tutor.",
  },
];
