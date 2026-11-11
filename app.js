(() => {
  const S = window.SHOW;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-fill]").forEach(n => (n.textContent = S[n.dataset.fill] || ""));
  document.title = `${S.name} · One Night Only`;
  const placeholder = path => `<div class="ph"><div>add your file here<code>${esc(path)}</code></div></div>`;

  /* ---------- spotlight ---------- */
  const root = document.documentElement;
  addEventListener("pointermove", e => {
    root.style.setProperty("--mx", e.clientX + "px");
    root.style.setProperty("--my", e.clientY + "px");
  }, { passive: true });

  /* ---------- sound: a little count-in click ---------- */
  let ctx;
  const tick = (freq = 880, len = 0.09) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + len);
    } catch (_) {}
  };

  /* ---------- music (optional) ---------- */
  let song = null;
  const musicBtn = $("#music");
  if (S.song) {
    song = new Audio(S.song); song.loop = true; song.volume = 0.55;
    musicBtn.hidden = false;
    musicBtn.onclick = () => { song.paused ? song.play().catch(() => {}) : song.pause(); musicBtn.classList.toggle("off", song.paused); };
  }

  /* ---------- the gate: 5, 6, 7, 8 ---------- */
  const gate = $("#gate"), btn = $("#countBtn"), dots = gate.querySelectorAll(".counts span");
  let n = 0;
  btn.addEventListener("click", () => {
    if (n >= 4) return;
    dots[n].classList.add("on");
    tick(n === 3 ? 1320 : 880, n === 3 ? 0.25 : 0.09);
    n++;
    btn.textContent = ["Tap", "Again", "And", "Go!"][n] || "♥";
    if (n === 4) setTimeout(openShow, 450);
  });
  function openShow() {
    gate.classList.add("open");
    document.body.classList.remove("locked");
    if (song) song.play().catch(() => {});
    setTimeout(() => { gate.remove(); burst(90); }, reduce ? 50 : 1500);
  }

  /* ---------- Act I: reels + oxygen ---------- */
  const reels = $("#reels"), vids = [];
  S.videos.forEach(v => {
    const fig = el("figure", "reel reveal");
    const frame = el("div", "frame");
    const video = el("video");
    Object.assign(video, { src: v.src, controls: true, playsInline: true, preload: "metadata", loop: true });
    video.addEventListener("error", () => { frame.innerHTML = placeholder(v.src); });
    video.addEventListener("play", () => {
      vids.forEach(o => o !== video && o.pause());
      if (song && !song.paused) { song.pause(); song._resume = true; }
    });
    video.addEventListener("pause", () => {
      if (song && song._resume && vids.every(o => o.paused)) { song._resume = false; song.play().catch(() => {}); }
    });
    vids.push(video); frame.append(video);
    fig.append(frame, el("figcaption", "", esc(v.title || "")));
    reels.append(fig);
  });
  let o2 = 21, peaked = false;
  const fill = $("#o2fill"), num = $("#o2num"), msg = $("#o2msg");
  const levels = [[21, "just regular air"], [40, "okay, she's warming up"], [60, "there's the grin"], [80, "nobody else in the room now"], [100, "there she is. fully breathing."]];
  setInterval(() => {
    if (o2 >= 100 || !vids.some(v => !v.paused && !v.ended && v.readyState > 2)) return;
    o2 = Math.min(100, o2 + 1);
    fill.style.width = o2 + "%"; num.textContent = o2 + "%";
    msg.textContent = levels.filter(l => o2 >= l[0]).pop()[1];
    if (o2 === 100 && !peaked) { peaked = true; burst(70); }
  }, 220);

  /* ---------- Act II: player card ---------- */
  const stats = $("#stats");
  S.stats.forEach(s => {
    const li = el("li", "", `<span>${esc(s.label)}</span><span>${esc(s.show)}</span><div class="bar"><i data-w="${+s.value}"></i></div>${s.note ? `<small>${esc(s.note)}</small>` : ""}`);
    stats.append(li);
  });
  const card = $("#card");
  card.addEventListener("click", () => card.classList.toggle("flip"));

  /* ---------- Act III: what she says / what she does ---------- */
  const quiet = $("#quiet");
  S.quiet.forEach(q => {
    const b = el("button", "q reveal", `<div class="says"><span class="tag">what you say</span>${esc(q.says)}</div><div class="does"><span class="tag">what you actually do</span>${esc(q.does)}</div>`);
    b.type = "button";
    b.addEventListener("click", () => { b.classList.toggle("open"); tick(660, 0.06); });
    quiet.append(b);
  });

  /* ---------- Act IV: polaroids ---------- */
  const wall = $("#wall"), box = $("#lightbox");
  S.memories.forEach((m, i) => {
    const p = el("button", "pol reveal");
    p.type = "button";
    p.style.setProperty("--r", ((i % 2 ? 1 : -1) * (1.5 + (i * 37 % 30) / 10)).toFixed(1) + "deg");
    const frame = el("div", "frame"), img = el("img");
    img.alt = m.caption || "A memory"; img.loading = "lazy"; img.src = m.src;
    let ok = true;
    img.addEventListener("error", () => { ok = false; frame.innerHTML = placeholder(m.src); });
    frame.append(img);
    p.append(frame, el("p", "", esc(m.caption || "")));
    if (m.when) p.append(el("small", "", esc(m.when)));
    p.addEventListener("click", () => {
      if (!ok || !box.showModal) return;
      $("img", box).src = m.src; $("p", box).textContent = m.caption || ""; box.showModal();
    });
    wall.append(p);
  });
  box.addEventListener("click", () => box.close());

  /* ---------- Finale ---------- */
  const letter = $("#letter");
  S.letter.forEach(t => letter.append(el("p", "reveal", esc(t))));
  $("#bow").addEventListener("click", e => {
    $("#hb").hidden = false;
    e.currentTarget.textContent = "Encore";
    tick(1320, 0.3); burst(220);
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    e.target.querySelectorAll("[data-w]").forEach(b => (b.style.width = b.dataset.w + "%"));
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));

  /* ---------- confetti ---------- */
  const cv = $("#confetti"), c2 = cv.getContext("2d");
  let parts = [], raf = 0;
  const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
  size(); addEventListener("resize", size);
  const colors = ["#ffc56b", "#ff5d73", "#7fe3c4", "#fbefe0", "#ff7a59"];
  function burst(count) {
    if (reduce) return;
    for (let i = 0; i < count; i++) parts.push({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.6, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      s: Math.random() * 7 + 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: colors[i % colors.length], life: 0
    });
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    c2.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.y < cv.height + 30 && p.life < 400);
    parts.forEach(p => {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.fillStyle = p.c;
      c2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c2.restore();
    });
    raf = parts.length ? requestAnimationFrame(step) : 0;
  }
})();
