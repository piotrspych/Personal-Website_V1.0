// Real preloader: reflects actual page load progress (resources + fonts).
// The bar eases toward whatever has truly loaded and only completes once the
// browser's `load` event fires and the web fonts are ready.
(function runPreloader() {
  const preloader = document.getElementById("preloader");
  const fill = document.getElementById("preloaderFill");
  const percent = document.getElementById("preloaderPercent");
  if (!preloader || !fill || !percent) return;

  const MIN_DURATION = 4000; // keep the loader up at least this long
  const start = performance.now();
  let loaded = false; // becomes true once everything has really loaded
  let shown = 0; // the percentage currently rendered

  // Measure real progress from the browser's resource timeline, gated by the
  // minimum display time so the bar also can't outrun the 4s floor.
  function realProgress() {
    if (loaded) return 1;
    const resources = performance.getEntriesByType("resource");
    const assetProgress = resources.length
      ? resources.filter((r) => r.responseEnd > 0).length / resources.length
      : 0.1;
    const timeProgress = (performance.now() - start) / MIN_DURATION;
    // Use the slower of the two signals, capped at 90% until fully loaded.
    return Math.min(assetProgress, timeProgress, 0.9);
  }

  function render(now) {
    const target = realProgress() * 100;
    // Ease the shown value toward the target so it animates smoothly.
    shown += (target - shown) * 0.08;
    if (loaded && target - shown < 0.5) shown = target;

    const pct = Math.round(shown);
    fill.style.width = pct + "%";
    percent.textContent = pct + "%";

    if (loaded && pct >= 100) {
      preloader.classList.add("is-done");
      return;
    }
    requestAnimationFrame(render);
  }

  function markLoaded() {
    // Honour the minimum display time, even if the page loaded sooner.
    const remaining = Math.max(MIN_DURATION - (performance.now() - start), 0);
    setTimeout(() => {
      loaded = true;
    }, remaining);
  }

  // Complete only when both real signals are in: all resources + fonts.
  const whenFonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const whenLoad = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });
  Promise.all([whenFonts, whenLoad]).then(markLoaded);

  requestAnimationFrame(render);
})();

// Current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu toggle
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");

toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});

// Close menu when a link is clicked
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// Reveal elements on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
