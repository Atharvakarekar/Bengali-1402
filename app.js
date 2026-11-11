(() => {
  const S = window.SHOW, T = S.tracks, N = T.length;
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const root = document.documentElement;
  document.querySelectorAll("[data-fill]").forEach(n => (n.textContent = S[n.dataset.fill] || ""));
  document.title = S.name;

  /* ---------- state ---------- */
  let e = 0;            // live energy 0..1: decays when she stops
  let prog = 0;         // how much of the circle she has drawn 0..1: never goes back
  let unlocked = 0, started = false, paused = false, moved = false, done = false, angle = 0;
  const seen = new Set();
  const KEY = "circle-" + S.name;
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) { prog = s.p || 0; (s.s || []).forEach(i => seen.add(i)); } } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ p: prog, s: [...seen] })); } catch (_) {} };
  const feed = amt => { if (!started || paused) return; e = clamp(e + amt, 0, 1); moved = true; };

  /* ---------- the ring ---------- */
  const ring = $("#ring"), arc = $("#arc"), record = $("#record"), label = record.querySelector(".label");
  const C = 2 * Math.PI * 46;
  arc.style.strokeDasharray = C;
  const nodes = T.map((t, i) => {
    const a = (-90 + (i + 0.5) * 360 / N) * Math.PI / 180;
    const b = el("button", "node " + t.type);
    b.type = "button";
    b.style.left = 50 + 46 * Math.cos(a) + "%"; b.style.top = 50 + 46 * Math.sin(a) + "%";
    b.setAttribute("aria-label", "Track " + (i + 1));
    const thumb = t.type === "photo" ? t.src : t.type === "video" ? t.poster : "";
    if (thumb) b.dataset.bg = thumb; else b.textContent = t.type === "note" ? "“" : "★";
    b.addEventListener("click", () => openTrack(i));
    ring.append(b);
    return b;
  });
  function unlock(i, quiet) {
    const b = nodes[i];
    b.classList.add("on"); if (!seen.has(i)) b.classList.add("new");
    if (b.dataset.bg) b.style.backgroundImage = `url("${b.dataset.bg}")`;
    if (!quiet) { toast(`Track ${String(i + 1).padStart(2, "0")} unlocked. Tap it.`); burst(40, b); blip(990, 0.18); buzz(40); }
  }
  function syncUnlocks(quiet) {
    while (unlocked < N && prog >= (unlocked + 1) / (N + 1)) unlock(unlocked++, quiet);
    if (prog >= 1 && !done) { done = true; record.classList.add("ready"); $("#lside").textContent = "press play"; hint.textContent = "tap the record"; hint.dataset.s = "1"; if (!quiet) { toast("The circle is closed. Tap the record."); burst(160); buzz([60, 40, 120]); } }
    arc.style.strokeDashoffset = C * (1 - clamp(prog, 0, 1));
  }

  /* ---------- sound: a beat that only exists while she moves ---------- */
  let ac, master, filter, noiseBuf, vidPlaying = false;
  const bpm = 106, stepLen = 60 / bpm / 4;
  let nextT = 0, step = 0;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const BASS = [45, 45, 41, 43], LEAD = [69, 72, 74, 76, 79, 76, 74, 72];
  function initAudio() {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.0001;
      filter = ac.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 250; filter.Q.value = 0.7;
      const comp = ac.createDynamicsCompressor();
      filter.connect(comp).connect(master).connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      nextT = ac.currentTime + 0.1;
      setInterval(schedule, 40);
    } catch (_) { ac = null; }
  }
  const env = (g, t, peak, len) => { g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0008, t + len); };
  function kick(t, v) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); env(g, t, v, 0.3); o.connect(g).connect(filter); o.start(t); o.stop(t + 0.32); }
  function noise(t, v, len, type, freq) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; env(g, t, v, len); s.connect(f).connect(g).connect(filter); s.start(t); s.stop(t + len + 0.02); }
  function tone(t, f, v, len, type) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; env(g, t, v, len); o.connect(g).connect(filter); o.start(t); o.stop(t + len + 0.02); }
  function schedule() {
    if (!ac) return;
    const target = vidPlaying ? 0.0001 : paused ? 0.1 : 0.2 + e * 0.6;
    master.gain.setTargetAtTime(target, ac.currentTime, 0.12);
    filter.frequency.setTargetAtTime(220 + e * e * 15000, ac.currentTime, 0.1);
    while (nextT < ac.currentTime + 0.12) {
      const s = step % 32, t = nextT;
      // at rest only a heartbeat. the more she moves, the more of the band shows up.
      const isKick = e > 0.22 ? s % 4 === 0 : (s === 0 || s === 3 || s === 16 || s === 19);
      if (isKick) { kick(t, 0.9); setTimeout(onKick, Math.max(0, (t - ac.currentTime) * 1000)); }
      if (e > 0.3 && s % 4 === 2) noise(t, 0.22, 0.05, "highpass", 7000);
      if (e > 0.62 && s % 2 === 1) noise(t, 0.1, 0.03, "highpass", 9000);
      if (e > 0.4 && s % 8 === 4) noise(t, 0.4, 0.14, "bandpass", 1700);
      if (e > 0.48 && (s % 4 === 0 || s % 8 === 3 || s % 8 === 6)) tone(t, midi(BASS[s >> 3]), 0.32, 0.18, "sawtooth");
      if (e > 0.7 && s % 2 === 0) tone(t, midi(LEAD[(s / 2 * 3) % LEAD.length] + (s >= 16 ? -2 : 0)), 0.13, 0.22, "triangle");
      nextT += stepLen; step++;
    }
  }
  function blip(f, len) { if (ac) tone(ac.currentTime, f, 0.25, len, "triangle"); }
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };

  /* ---------- visuals: every beat throws a circle ---------- */
  const cv = $("#fx"), g2 = cv.getContext("2d");
  let W, H, ripples = [], parts = [];
  const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  size(); addEventListener("resize", size);
  function onKick() {
    if (paused) return;
    record.classList.remove("kick"); void record.offsetWidth; record.classList.add("kick");
    const r = record.getBoundingClientRect();
    ripples.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2, a: 0.12 + e * 0.6, hue: 20 + prog * 320 });
  }
  const colors = ["#ffc56b", "#ff5d73", "#7fe3c4", "#fbefe0", "#ff7a59"];
  function burst(count, from) {
    const r = from ? from.getBoundingClientRect() : null;
    for (let i = 0; i < count; i++) parts.push({
      x: r ? r.left + r.width / 2 : W / 2 + (Math.random() - 0.5) * W * 0.5, y: r ? r.top + r.height / 2 : H * 0.4,
      vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 12 - 3, s: Math.random() * 7 + 4, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % 5], life: 0 });
  }

  /* ---------- main loop ---------- */
  const status = $("#status"), hint = $("#hint");
  const LINES = [[0, "It's too quiet in here."], [0.12, "There you are. Keep going."], [0.4, "Now you're breathing."], [0.7, "THAT'S the Paridhi I know."]];
  let last = performance.now(), lineIdx = -1, saveT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (started) {
      if (!paused) {
        e = Math.max(0, e - e * 0.62 * dt - 0.02 * dt);
        if (e > 0.12 && prog < 1) { prog = Math.min(1, prog + e * dt / 42); syncUnlocks(false); }
      } else e = Math.max(0, e - e * 2 * dt);
      angle += (8 + e * 300) * dt * (paused ? 0 : 1);
      label.style.transform = `rotate(${angle}deg)`;
      root.style.setProperty("--e", (done || paused ? Math.max(e, 0.75) : e).toFixed(3));
      let li = 0; LINES.forEach((l, i) => { if (e >= l[0]) li = i; });
      const txt = done ? "You closed the circle." : !moved ? "Go on. Move." : LINES[li][1];
      if (status.textContent !== txt) status.textContent = txt;
      if (moved && hint.dataset.s !== "1") { hint.dataset.s = "1"; hint.textContent = "keep moving to draw the circle"; }
      if ((saveT += dt) > 2) { saveT = 0; save(); }
    }
    g2.clearRect(0, 0, W, H);
    ripples = ripples.filter(r => r.a > 0.01);
    ripples.forEach(r => { r.r += (140 + e * 260) * dt; r.a *= 1 - 1.5 * dt; g2.beginPath(); g2.arc(r.x, r.y, r.r, 0, 7); g2.strokeStyle = `hsla(${r.hue},90%,68%,${r.a})`; g2.lineWidth = 2 + e * 5; g2.stroke(); });
    parts = parts.filter(p => p.y < H + 30 && p.life < 400);
    parts.forEach(p => { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++; g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot); g2.fillStyle = p.c; g2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g2.restore(); });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- inputs: her body, her finger, or the record ---------- */
  let pm = null;
  function onMotion(ev) {
    const a = ev.accelerationIncludingGravity || ev.acceleration; if (!a || a.x == null) return;
    if (pm) { const d = Math.abs(a.x - pm.x) + Math.abs(a.y - pm.y) + Math.abs(a.z - pm.z); if (d > 1.2) feed(Math.min(d, 14) * 0.0045); }
    pm = { x: a.x, y: a.y, z: a.z };
  }
  let drag = null;
  const ang = ev => { const r = record.getBoundingClientRect(); return Math.atan2(ev.clientY - r.top - r.height / 2, ev.clientX - r.left - r.width / 2); };
  record.addEventListener("pointerdown", ev => { drag = { a: ang(ev), total: 0 }; try { record.setPointerCapture(ev.pointerId); } catch (_) {} });
  record.addEventListener("pointermove", ev => {
    if (!drag) return;
    let a = ang(ev), d = a - drag.a; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    drag.a = a; drag.total += Math.abs(d); angle += d * 57.3; feed(Math.abs(d) * 0.16);
  });
  const up = () => { if (!drag) return; const tap = drag.total < 0.15; drag = null; if (done && tap) return openFinale(); if (tap) { feed(0.17); blip(660, 0.05); } };
  record.addEventListener("pointerup", up); record.addEventListener("pointercancel", () => (drag = null));
  addEventListener("keydown", ev => { if (ev.code === "Space" || ev.key === "Enter") { if (!started || paused) return; ev.preventDefault(); if (done) return openFinale(); feed(0.17); } });

  /* ---------- start ---------- */
  $("#go").addEventListener("click", async () => {
    initAudio();
    try {
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
        if ((await DeviceMotionEvent.requestPermission()) === "granted") addEventListener("devicemotion", onMotion);
      } else addEventListener("devicemotion", onMotion);
    } catch (_) {}
    $("#start").classList.add("gone"); $("#floor").hidden = false;
    started = true; syncUnlocks(true); burst(60);
    setTimeout(() => $("#start").remove(), 800);
  });

  /* ---------- a track ---------- */
  const sheet = $("#sheet"), body = $("#sheetBody");
  function openTrack(i) {
    const t = T[i]; paused = true; seen.add(i); nodes[i].classList.remove("new"); save();
    body.innerHTML = `<p class="trackno">Track ${String(i + 1).padStart(2, "0")} of ${N}</p>`;
    if (t.type === "photo") body.append(el("div", "pol", `<img src="${esc(t.src)}" alt=""><p>${esc(t.caption)}</p>`));
    if (t.type === "video") {
      const w = el("div", "vid"), v = el("video");
      Object.assign(v, { src: t.src, controls: true, playsInline: true, loop: true, autoplay: true }); if (t.poster) v.poster = t.poster;
      v.addEventListener("play", () => (vidPlaying = true)); v.addEventListener("pause", () => (vidPlaying = false));
      w.append(v, el("p", "", esc(t.caption))); body.append(w); v.play().catch(() => {});
    }
    if (t.type === "note") {
      const q = el("button", "q", `<div class="says"><span class="tag">what you say</span>${esc(t.says)}</div><div class="does"><span class="tag">what you actually do</span>${esc(t.does)}</div>`);
      q.type = "button"; q.addEventListener("click", () => { q.classList.toggle("open"); blip(520, 0.08); }); body.append(q);
    }
    if (t.type === "card") {
      const c = el("button", "card", `<div class="card-face front"><div class="card-top"><span class="jersey">${esc(S.jersey)}</span><span class="pos">Centre stage<small>plays for: everyone she loves</small></span></div><div class="card-name">${esc(S.name)}</div><ul class="stats">${S.stats.map(s => `<li><span>${esc(s.label)}</span><span>${esc(s.show)}</span><div class="bar"><i style="width:${+s.value}%"></i></div>${s.note ? `<small>${esc(s.note)}</small>` : ""}</li>`).join("")}</ul></div><div class="card-face back"><p class="eyebrow">Scout's notes</p><p class="scout">${esc(S.scouting)}</p><p class="stamp">Not for trade</p></div>`);
      c.type = "button"; c.addEventListener("click", () => c.classList.toggle("flip")); body.append(c, el("p", "flipme", "tap the card to flip it"));
    }
    sheet.hidden = false;
  }
  function closeSheet() { body.querySelectorAll("video").forEach(v => v.pause()); vidPlaying = false; body.innerHTML = ""; sheet.hidden = true; paused = false; }
  $("#close").addEventListener("click", closeSheet);
  sheet.addEventListener("click", ev => { if (ev.target === sheet) closeSheet(); });

  /* ---------- the circle closes ---------- */
  const fin = $("#finale"), letter = $("#letter");
  S.letter.forEach((t, i) => { const p = el("p", "", esc(t)); p.style.animationDelay = 0.5 + i * 0.9 + "s"; letter.append(p); });
  function openFinale() { paused = true; fin.hidden = false; fin.scrollTop = 0; e = 1; }
  $("#closeFinale").addEventListener("click", () => { fin.hidden = true; paused = false; });
  $("#bow").addEventListener("click", ev => { ev.currentTarget.textContent = "Encore"; burst(240); blip(1320, 0.4); buzz([80, 50, 80, 50, 200]); });

  let toastT; function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
})();
