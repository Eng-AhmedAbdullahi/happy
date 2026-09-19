/**
 * Emotional birthday story
 * Music: audio from your WhatsApp video (happy-birthday.mp3)
 * Starts when "Happy Birthday" appears — the intended moment
 */
(function () {
  "use strict";

  const cfg = window.CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fill = (t) => String(t || "").replace(/\{\{name\}\}/g, cfg.name || "Love");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const escapeAttr = (s) => escapeHtml(s).replace(/'/g, "&#39;");

  /* Soft dust particles */
  function spawnDust() {
    const layer = $("#dust");
    if (!layer) return;
    const n = window.matchMedia("(max-width: 640px)").matches ? 12 : 20;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("span");
      d.className = "dust";
      d.style.left = Math.random() * 100 + "%";
      d.style.width = d.style.height = 2 + Math.random() * 3 + "px";
      d.style.animationDuration = 12 + Math.random() * 16 + "s";
      d.style.animationDelay = Math.random() * 12 + "s";
      layer.appendChild(d);
    }
  }

  /* Confetti — soft, not chaotic */
  const canvas = $("#confetti-canvas");
  const ctx = canvas?.getContext("2d");
  let pieces = [];
  let raf = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function burstConfetti(n = 70) {
    if (!ctx) return;
    resizeCanvas();
    const colors = ["#e8b4bc", "#c97b8a", "#f3d6c4", "#fff4ee", "#d4a0a8"];
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 50,
        w: 4 + Math.random() * 5,
        h: 6 + Math.random() * 7,
        color: colors[i % colors.length],
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.15 + Math.random() * 0.3,
        life: 1,
      });
    }
    if (!raf) tick();
  }

  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = pieces.filter((p) => p.life > 0 && p.y < canvas.height + 40);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.rot += p.vr;
      p.life -= 0.0035;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    raf = pieces.length ? requestAnimationFrame(tick) : null;
  }

  /* Music from your video — plays once */
  const Music = (() => {
    const el = () => $("#bg-music");

    function sync() {
      const btn = $("#music-toggle");
      const a = el();
      if (!btn || !a) return;
      btn.hidden = false;
      const on = !a.paused;
      btn.classList.toggle("is-playing", on);
      btn.classList.toggle("is-muted", !on);
    }

    function start() {
      const a = el();
      if (!a) return;
      if (cfg.musicSrc) {
        const src = a.querySelector("source");
        if (src) {
          src.src = cfg.musicSrc;
          a.load();
        }
      }
      a.volume = 0.9;
      a.loop = false;
      a.playbackRate = 0.88;
      a.currentTime = 0;
      a.onended = () => sync();
      return a.play().then(sync).catch(() => sync());
    }

    function toggle() {
      const a = el();
      if (!a) return;
      if (a.paused) {
        if (a.ended) return;
        a.play().then(sync).catch(() => sync());
      } else {
        a.pause();
        sync();
      }
    }

    return { start, toggle };
  })();

  function createVeil() {
    const v = document.createElement("div");
    v.className = "loading-veil";
    v.innerHTML = "<span>for you…</span>";
    document.body.prepend(v);
    return v;
  }

  function observeReveals(root) {
    const els = $$(".reveal", root || document);
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  }

  function typeWriter(el, text, speed = 42) {
    return new Promise((resolve) => {
      el.classList.remove("is-done");
      el.textContent = "";
      let i = 0;
      (function step() {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(step, text[i - 1] === "\n" ? speed * 3 : speed);
        } else {
          el.classList.add("is-done");
          resolve();
        }
      })();
    });
  }

  function buildGalleries() {
    const gallery = $("#photo-gallery");
    const grid = $("#memory-grid");

    if (gallery && cfg.photos) {
      gallery.innerHTML = cfg.photos
        .map(
          (p, i) => `
        <button class="polaroid" type="button" style="--delay:${0.3 + i * 0.45}s"
          data-src="${escapeAttr(p.src)}" data-caption="${escapeAttr(p.caption || "")}">
          <span class="polaroid__heart" aria-hidden="true">❤️</span>
          <img class="polaroid__img" src="${escapeAttr(p.src)}" alt="${escapeAttr(p.caption || "")}" loading="lazy" />
          <span class="polaroid__caption">${escapeHtml(p.caption || "")}</span>
        </button>`
        )
        .join("");
    }

    if (grid && cfg.memories) {
      grid.innerHTML = cfg.memories
        .map(
          (m) => `
        <article class="memory-card reveal">
          <img src="${escapeAttr(m.src)}" alt="" loading="lazy" />
          <div>
            <p class="when">${escapeHtml(m.date || "")}</p>
            <h4>${escapeHtml(m.caption || "")}</h4>
            <p>${escapeHtml(m.text || "")}</p>
          </div>
        </article>`
        )
        .join("");
    }
  }

  function setupLightbox() {
    const lb = $("#lightbox");
    const img = $("#lightbox-img");
    const cap = $("#lightbox-caption");
    const open = (src, c) => {
      img.src = src;
      cap.textContent = c || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lb.hidden = true;
      img.src = "";
      document.body.style.overflow = "";
    };
    document.addEventListener("click", (e) => {
      const t = e.target.closest(".polaroid");
      if (t) open(t.dataset.src, t.dataset.caption);
    });
    $(".lightbox__close")?.addEventListener("click", close);
    lb?.addEventListener("click", (e) => {
      if (e.target === lb) close();
    });
  }

  function applyConfig() {
    $("#special-day-text").textContent = cfg.specialDayText || "";
    $("#birthday-heading").textContent = fill(cfg.birthdayHeading);
    $("#gift-intro").textContent = cfg.giftIntro || "";
    $("#gift-message").textContent = cfg.giftMessage || "";
    const gp = $("#gift-photo");
    if (gp && cfg.giftPhoto) {
      gp.src = cfg.giftPhoto;
      gp.alt = "";
    }
    $("#photos-title").textContent = cfg.photosTitle || "";
    const photosSub = $("#photos-sub");
    if (photosSub) photosSub.textContent = cfg.photosSub || "";
    $("#memories-title").textContent = cfg.memoriesTitle || "";
    $("#finale-title").textContent = cfg.finaleTitle || "";
    $("#finale-sub").textContent = cfg.finaleSub || "";
  }

  async function startStory() {
    const welcome = $("#welcome");
    const story = $("#story");
    welcome.classList.add("is-leaving");
    setTimeout(() => {
      welcome.hidden = true;
      story.hidden = false;
      window.scrollTo({ top: 0, behavior: "instant" });
      observeReveals(story);
      runSequence();
    }, 1600);
  }

  async function runSequence() {
    const special = $("#special-day");
    const hero = $("#birthday-hero");
    const message = $("#message");
    const giftSection = $("#gift-section");
    const photos = $("#photos");
    const memories = $("#memories");
    const continueBtn = $("#continue-to-gift");

    await wait(800);
    $$(".reveal", special).forEach((el) => el.classList.add("is-visible"));

    await wait(3800);
    hero.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(900);
    $$(".reveal", hero).forEach((el) => el.classList.add("is-visible"));

    // Song starts — story continues (sida hore)
    Music.start();
    burstConfetti(55);

    await wait(3600);
    message.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(700);
    $$(".reveal", message).forEach((el) => el.classList.add("is-visible"));
    await typeWriter($("#typewriter"), cfg.birthdayMessage || "", 42);
    continueBtn.hidden = false;
    continueBtn.classList.add("is-visible");

    continueBtn.addEventListener(
      "click",
      () => {
        giftSection.hidden = false;
        giftSection.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          $$(".reveal", giftSection).forEach((el) => el.classList.add("is-visible"));
        }, 500);
      },
      { once: true }
    );

    let opened = false;
    $("#gift-box")?.addEventListener("click", () => {
      if (opened) return;
      opened = true;
      const box = $("#gift-box");
      const hint = $("#gift-hint");
      box.classList.add("is-shaking", "is-glowing");
      setTimeout(() => {
        box.classList.remove("is-shaking");
        box.classList.add("is-open");
        if (hint) hint.hidden = true;
        burstConfetti(90);
        photos.hidden = false;
        memories.hidden = false;
        setTimeout(() => {
          photos.scrollIntoView({ behavior: "smooth", block: "start" });
          observeReveals(photos);
          // Memories follow after polaroids appear
          setTimeout(() => observeReveals(memories), 2200);
        }, 900);
      }, 900);
    });

    $("#to-finale")?.addEventListener("click", () => {
      const finale = $("#finale");
      finale.hidden = false;
      finale.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        $$(".reveal", finale).forEach((el) => el.classList.add("is-visible"));
        burstConfetti(100);
      }, 600);
    });
  }

  function init() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    spawnDust();
    applyConfig();
    buildGalleries();
    setupLightbox();
    $("#music-toggle")?.addEventListener("click", () => Music.toggle());

    const veil = createVeil();
    // 1) "for you…" stays longer
    setTimeout(() => {
      veil.classList.add("is-gone");
      setTimeout(() => veil.remove(), 2200);
    }, 3600);

    $("#open-surprise")?.addEventListener("click", startStory);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
