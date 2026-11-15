// Live Hot Mess numbers as a split-flap departures board (src/components/LiveStats.astro).
// Each character is a flap cell that steps through the drum (' ', A–Z, 0–9, punctuation) to its target, top leaf
// folding down like the old airport boards. Flaps are aria-hidden; the real sentence is in .sr-only text beside them.
// Reduced motion (or no Web Animations) sets the characters straight away. The numbers refresh every five minutes
// while the page is open and only the changed cells flip.
(() => {
  const section = document.getElementById('live');
  if (!section) return;

  const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-&()';
  const DIGITS = ' 0123456789,';
  const STEP_MS = 55;
  const NAME_WIDTH = 14;
  // Board names for countries whose time zone database name doesn't read well (TZInfo calls the UK "Britain (UK)").
  const NAMES = { GB: 'United Kingdom' };
  const REFRESH_MS = 5 * 60 * 1000;
  const fmt = new Intl.NumberFormat('en-US');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animated = () => !reduced.matches && typeof Element.prototype.animate === 'function';

  const span = (className, text) => {
    const el = document.createElement('span');
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  // One flap cell. show(ch) steps it forward through its drum to ch.
  function makeCell(drum) {
    const el = span('flap');
    const top = span('flap__half flap__top');
    const bottom = span('flap__half flap__bottom');
    const leaf = span('flap__leaf');
    const front = span('flap__half flap__top flap__front');
    const back = span('flap__half flap__bottom flap__back');
    [top, bottom, front, back].forEach((h) => h.append(span('flap__ch')));
    leaf.append(front, back);
    el.append(top, bottom, leaf);
    const glyph = (half, ch) => { half.firstChild.textContent = ch === ' ' ? ' ' : ch; };
    let current = ' ';
    let token = 0;
    const set = (ch) => { current = ch; [top, bottom, front, back].forEach((h) => glyph(h, ch)); };
    set(' ');

    async function flip(next) {
      glyph(top, next);
      glyph(front, current);
      glyph(back, next);
      el.classList.add('is-flipping');
      await leaf.animate(
        [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }],
        { duration: STEP_MS, easing: 'cubic-bezier(.4,0,.8,.6)' }
      ).finished.catch(() => {});
      el.classList.remove('is-flipping');
      set(next);
    }

    async function show(target, delay = 0) {
      const mine = ++token;
      if (!drum.includes(target)) target = ' ';
      if (target === current) return;
      if (!animated()) { set(target); return; }
      if (delay) await new Promise((r) => setTimeout(r, delay));
      while (current !== target && mine === token) {
        const i = drum.indexOf(current);
        await flip(drum[(i + 1) % drum.length]);
      }
    }

    return { el, show };
  }

  // A run of cells in a container; text is padded (right-aligned for numbers) to the run's width.
  function makeRun(container, width, drum, alignRight) {
    const cells = Array.from({ length: width }, () => makeCell(drum));
    container.replaceChildren(...cells.map((c) => c.el));
    return {
      show(text, baseDelay = 0) {
        let t = text.toUpperCase().slice(0, width);
        t = alignRight ? t.padStart(width) : t.padEnd(width);
        cells.forEach((c, i) => c.show(t[i], baseDelay + i * 35));
      },
    };
  }

  const text = (key, value) => section.querySelectorAll(`[data-live-text="${key}"]`).forEach((el) => { el.textContent = value; });
  const runs = {};
  const run = (container, key, width, drum, right) => {
    if (!runs[key] || runs[key].width !== width) runs[key] = { width, run: makeRun(container, width, drum, right) };
    return runs[key].run;
  };

  let latest = null;
  let visible = false;

  function render(stats) {
    const venues = fmt.format(stats.venues);
    const places = fmt.format(stats.places);
    const hasEvents = Number.isFinite(stats.events) && stats.events > 0;
    const events = hasEvents ? fmt.format(stats.events) : '';

    text('headline', `${venues} venues in ${places} places`);
    text('events', hasEvents ? `${events} events coming up.` : '');
    if (stats.as_of) {
      const when = new Date(stats.as_of);
      if (!Number.isNaN(when.getTime())) text('as_of', `Updated ${when.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`);
    }
    const countries = stats.countries.slice().sort((a, b) => b.venues - a.venues)
      .map((c) => ({ ...c, label: NAMES[c.code] || (c.name || c.code).replace(/\s*\(.*\)$/, '') }));
    const list = section.querySelector('[data-live-text="countries"]');
    list.replaceChildren(...countries.map((c) => {
      const li = document.createElement('li');
      li.textContent = `${c.label}: ${fmt.format(c.venues)} venues in ${fmt.format(c.places)} ${c.places === 1 ? 'place' : 'places'}`;
      return li;
    }));

    // Until the board is on screen the cells are laid out blank; they flip in once it scrolls into view.
    const show = (r, value, delay) => { if (visible) r.show(value, delay); };
    const numWidth = (n) => Math.max(n.length, 3);
    show(run(section.querySelector('[data-flaps="venues"]'), 'venues', numWidth(venues), DIGITS, true), venues);
    show(run(section.querySelector('[data-flaps="places"]'), 'places', numWidth(places), DIGITS, true), places, 120);

    const rowsEl = section.querySelector('[data-board-rows]');
    const rows = [{ label: 'All countries', places: stats.places, venues: stats.venues }, ...countries];
    const placeW = Math.max(3, ...rows.map((r) => fmt.format(r.places).length));
    const venueW = Math.max(5, ...rows.map((r) => fmt.format(r.venues).length));
    if (rowsEl.children.length !== rows.length || rowsEl.dataset.w !== `${placeW}/${venueW}`) {
      rowsEl.replaceChildren(...rows.map((_, i) => {
        const row = span(`board__row${i === 0 ? ' board__row--total' : ''}`);
        row.append(span('flaps'), span('flaps'), span('flaps'));
        return row;
      }));
      rowsEl.dataset.w = `${placeW}/${venueW}`;
      Object.keys(runs).filter((k) => k.startsWith('row')).forEach((k) => delete runs[k]);
    }
    rows.forEach((r, i) => {
      const [nameEl, placesEl, venuesEl] = rowsEl.children[i].children;
      const delay = 250 + i * 140;
      show(run(nameEl, `row${i}n`, NAME_WIDTH, DRUM, false), r.label, delay);
      show(run(placesEl, `row${i}p`, placeW, DIGITS, true), fmt.format(r.places), delay + 200);
      show(run(venuesEl, `row${i}v`, venueW, DIGITS, true), fmt.format(r.venues), delay + 300);
    });

    const eventsRow = section.querySelector('[data-board-events]');
    eventsRow.hidden = !hasEvents;
    if (hasEvents) {
      const delay = 250 + rows.length * 140;
      show(run(eventsRow.querySelector('[data-flaps="events_label"]'), 'evl', NAME_WIDTH, DRUM, false), 'Events ahead', delay);
      show(run(eventsRow.querySelector('[data-flaps="events"]'), 'ev', Math.max(venueW, events.length), DIGITS, true), events, delay + 300);
    }
  }

  function load() {
    return fetch(section.dataset.statsUrl, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((stats) => {
        if (!stats || !stats.venues || !Array.isArray(stats.countries)) return;
        latest = stats;
        section.hidden = false;
        render(stats);
      })
      .catch(() => {});
  }

  load().then(() => {
    if (!latest) return;
    const start = () => { if (!visible) { visible = true; render(latest); } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
      }, { threshold: 0.25 });
      io.observe(section);
    } else {
      start();
    }
    setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
  });
})();
