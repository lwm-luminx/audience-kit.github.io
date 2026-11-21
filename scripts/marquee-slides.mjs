// Draws AudienceKit's TV posters, the standard slogan slides every audience's venue screens can rotate in, into
// public/marquee/ at 1920 × 1080 as JPEGs, plus slogans.json listing them. These are the only posters shared by all
// audiences (the API's marquee_posters rows with no audience), so they name no audience's app. Run it after changing
// the lines below:  node scripts/marquee-slides.mjs
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/marquee');
const { chromium } = createRequire(import.meta.url)('playwright');

// id, kicker, headline (*accent* words, | a line break), sub line, look
export const slides = [
  ['ak-join-the-chat', 'Tonight', 'Say hi to|*the room.*', 'Scan the code on the lineup screen to join tonight’s chat.', 'plum'],
  ['ak-request-a-song', 'Requests open', 'Pick the|*next song.*', 'Request it from your phone. Scan the code on the lineup screen.', 'teal'],
  ['ak-tag-us', 'Post it', 'Tag us.|*We’re watching.*', '(Lovingly.)', 'rose'],
  ['ak-be-kind', 'House rules', 'Be *kind.*', 'Everyone here is somebody’s favorite.', 'plum'],
  ['ak-ask-first', 'House rules', 'Ask first.|*Every time.*', 'Consent is the whole vibe.', 'rose'],
  ['ak-drink-water', 'Take care', 'Drink water.|*Stay a while.*', 'Pace yourself. The night’s still young.', 'teal'],
  ['ak-find-staff', 'Need anything?', 'Find any|*staff member.*', 'We’re here to help, no questions asked.', 'plum'],
  ['ak-get-home-safe', 'Last call', 'Look out for|*each other.*', 'Get home safe. We’ll be here next time.', 'teal'],
  ['ak-your-night', 'Welcome', 'Your night.|*Your people.*', 'Glad you’re here.', 'rose'],
];

const looks = {
  plum: { glow: '#5a1a5e', accent: '#efc486', art: 'radial-gradient(circle at 78% 40%, #7b2a7f 0, transparent 55%)' },
  teal: { glow: '#0f4b54', accent: '#8fe3d7', art: 'radial-gradient(circle at 80% 60%, #13707a 0, transparent 55%)' },
  rose: { glow: '#5e1a33', accent: '#ffb3c7', art: 'radial-gradient(circle at 75% 35%, #8a2449 0, transparent 55%)' },
};

const figtree = (await readFile(join(root, 'public/assets/fonts/Figtree-Variable.woff2'))).toString('base64');

const html = ([, kicker, headline, sub, look]) => {
  const l = looks[look];
  const h = headline.replace(/\*(.+?)\*/g, '<em>$1</em>').replace('|', '<br>');
  return `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Figtree; src: url('data:font/woff2;base64,${figtree}'); font-weight: 300 900; }
* { box-sizing: border-box; }
body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #100d19; color: #f5efea; font-family: Figtree, sans-serif; }
.s { position: relative; display: flex; flex-direction: column; justify-content: center; width: 100%; height: 100%; padding: 0 150px 60px; background: ${l.art}, radial-gradient(ellipse at 0% 100%, ${l.glow} 0, transparent 50%); }
.ring { position: absolute; right: -160px; top: 50%; width: 900px; height: 900px; margin-top: -450px; border-radius: 50%; border: 2px solid ${l.accent}33; }
.ring.b { width: 640px; height: 640px; margin-top: -320px; right: -30px; border-color: ${l.accent}22; }
.k { font-size: 44px; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; color: ${l.accent}; }
h1 { margin: 50px 0 0; max-width: 1450px; font-size: 200px; font-weight: 750; line-height: .95; letter-spacing: -8px; }
h1 em { font-style: normal; color: ${l.accent}; }
p { margin: 60px 0 0; max-width: 1300px; font-size: 58px; line-height: 1.3; color: #d5cbdc; }
.f { position: absolute; left: 150px; right: 150px; bottom: 90px; display: flex; justify-content: flex-end; font-size: 32px; font-weight: 700; color: #ffffff66; letter-spacing: -.5px; }
.f span { color: ${l.accent}99; }
</style><div class="s"><div class="ring"></div><div class="ring b"></div>
<div class="k">${kicker}</div><h1>${h}</h1><p>${sub}</p><div class="f">Audience<span>Kit</span></div></div>`;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await mkdir(out, { recursive: true });
  for (const old of await readdir(out)) if (old.endsWith('.jpg')) await rm(join(out, old));
  for (const slide of slides) {
    await page.setContent(html(slide));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(out, `${slide[0]}.jpg`), type: 'jpeg', quality: 86 });
  }
  await browser.close();
  const manifest = { slides: slides.map(([id]) => ({ id, image: `/marquee/${id}.jpg`, adult: false })) };
  await writeFile(join(out, 'slogans.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${slides.length} slides in public/marquee`);
}
