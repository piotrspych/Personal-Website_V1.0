document.documentElement.classList.add("js");

// Fade sections in as they scroll into view, and count numbers up the first time.
const counted = new WeakSet();

function countUp(el) {
  if (counted.has(el)) return;
  counted.add(el);
  const target = Number(el.dataset.count);
  const start = performance.now();
  const duration = 1400;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(target * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Services and FAQ: one open at a time.
function accordion(itemSelector, buttonSelector) {
  const items = [...document.querySelectorAll(itemSelector)];
  items.forEach((item) => {
    item.querySelector(buttonSelector).addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(buttonSelector).setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", open);
      item.querySelector(buttonSelector).setAttribute("aria-expanded", String(open));
    });
  });
}

accordion(".service", ".service-head");
accordion(".faq-item", ".faq-q");

// Experience: "View Details" opens each card's full details independently.
document.querySelectorAll(".exp-item").forEach((item) => {
  const btn = item.querySelector(".exp-toggle");
  const label = btn.querySelector("span");
  btn.addEventListener("click", () => {
    const open = item.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Hide Details" : "View Details";
  });
});

// Cinematic filmstrip. The front picture is full; neighbors peek in dimmed. The side panel follows.
const cards = [...document.querySelectorAll("#workStack .stack-card")];
const workBits = ["workTitle", "workText", "workClient", "workService"].map((id) => document.getElementById(id));
let slide = 0;

cards.forEach((card, index) => {
  const count = document.createElement("span");
  count.className = "stack-count";
  count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
  card.append(count);
});

function showSlide(i) {
  const n = cards.length;
  slide = (i + n) % n;
  cards.forEach((card, index) => {
    let d = index - slide;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    const abs = Math.min(Math.abs(d), 2);
    const dir = Math.sign(d);
    const x = dir * [0, 16, 130][abs];
    card.style.transform = `translate(-50%, -50%) translateX(${x}%) scale(${abs ? 0.92 : 1})`;
    card.style.opacity = abs > 1 ? "0" : "1";
    card.style.filter = abs === 0 ? "none" : "brightness(0.5)";
    card.style.zIndex = String(20 - abs);
    card.style.pointerEvents = abs > 1 ? "none" : "auto";
    if (index === slide) card.setAttribute("aria-current", "true");
    else card.removeAttribute("aria-current");
  });
  const active = cards[slide];
  workBits[0].textContent = active.dataset.title;
  workBits[1].textContent = active.dataset.text;
  workBits[2].textContent = active.dataset.client;
  workBits[3].textContent = active.dataset.service;
}

cards.forEach((card, index) => card.addEventListener("click", () => showSlide(index)));
document.getElementById("workPrev").addEventListener("click", () => showSlide(slide - 1));
document.getElementById("workNext").addEventListener("click", () => showSlide(slide + 1));
showSlide(0);

// Review slider.
const reviews = [
  {
    quote: "\"Abir delivered exactly what we needed, creating a premium website that exceeded expectations, improved engagement, strengthened our brand presence, and conversions.\"",
    name: "Luciter Jason",
    role: "Ceo ai Qtube",
  },
  {
    quote: "\"Abir exceeded our expectations by creating a polished, premium website that captured our brand, increased engagement, and drove measurable growth.\"",
    name: "Lucas Bennett",
    role: "Managing Director",
  },
  {
    quote: "\"Working with Abir was a fantastic experience. He designed a modern, high-converting website that strengthened our online presence, built trust, and boosted conversions.\"",
    name: "Sophia Bennett",
    role: "Product Manager",
  },
  {
    quote: "\"Abir transformed our vision into a premium website that elevated our brand, enhanced user experience, increased customer engagement, and delivered outstanding results.\"",
    name: "Ethan Carter",
    role: "Co-Founder",
  },
];

const reviewEls = ["reviewQuote", "reviewName", "reviewRole"].map((id) => document.getElementById(id));
let review = 0;

function showReview(i) {
  review = (i + reviews.length) % reviews.length;
  reviewEls.forEach((el) => el.classList.add("is-swapping"));
  setTimeout(() => {
    const { quote, name, role } = reviews[review];
    reviewEls[0].textContent = quote;
    reviewEls[1].textContent = name;
    reviewEls[2].textContent = role;
    reviewEls.forEach((el) => el.classList.remove("is-swapping"));
  }, 300);
}

document.getElementById("reviewPrev").addEventListener("click", () => showReview(review - 1));
document.getElementById("reviewNext").addEventListener("click", () => showReview(review + 1));

// Glass calendar under "Schedule a call". A day opens the booking overlay.
(function () {
  const picker = document.getElementById("callPicker");
  const toggle = document.getElementById("callToggle");
  const form = document.getElementById("callBook");
  const grid = document.getElementById("calGrid");
  const timesEl = document.getElementById("calTimes");
  const title = document.getElementById("calTitle");
  const hint = document.getElementById("calHint");
  const overlay = document.getElementById("calOverlay");
  const whenEl = document.getElementById("calWhen");
  if (!picker || !toggle || !form || !grid || !timesEl || !overlay) return;

  const MAIL = "piotr.spychalski12@gmail.com";
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"];

  let view = new Date();
  view.setDate(1);
  let selected = null;
  let time = null;

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = () => startOfDay(new Date());
  const stamp = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const labelDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  function googleDates(date, slot) {
    const p = (n) => String(n).padStart(2, "0");
    const day = (d) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    if (slot === "No time preference") {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      return `${day(date)}/${day(next)}`;
    }
    const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, Number(match[2]));
    const end = new Date(start.getTime() + 30 * 60000);
    const stampTime = (d) => `${day(d)}T${p(d.getHours())}${p(d.getMinutes())}00`;
    return `${stampTime(start)}/${stampTime(end)}`;
  }

  function calendarLink(name, email, date, slot, description) {
    const details = [`Email: ${email}`, "30-minute strategy call. Times are America/Toronto."];
    if (description) details.push("", description);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: slot === "No time preference" ? `Strategy call with ${name} (time TBD)` : `Strategy call with ${name}`,
      dates: googleDates(date, slot),
      details: details.join("\n"),
      ctz: "America/Toronto",
      add: email,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function open(on) {
    picker.classList.toggle("is-open", on);
    toggle.setAttribute("aria-expanded", String(on));
    if (on) render();
    else closeOverlay();
  }

  function closeOverlay() {
    overlay.hidden = true;
  }

  function render() {
    const y = view.getFullYear();
    const m = view.getMonth();
    title.textContent = `${MONTHS[m]} ${y}`;
    const now = today();
    const start = new Date(y, m, 1);
    start.setDate(1 - ((start.getDay() + 6) % 7));
    let html = "";
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const off = date.getMonth() !== m || date < now;
      const isToday = stamp(date) === stamp(now);
      const isSel = selected && stamp(date) === stamp(selected);
      html += `<button type="button" class="glass-day${isToday ? " is-today" : ""}${isSel ? " is-selected" : ""}" data-stamp="${stamp(date)}" ${off ? "disabled" : ""} aria-label="${labelDate(date)}">${date.getDate()}</button>`;
    }
    grid.innerHTML = html;
  }

  function renderTimes() {
    timesEl.innerHTML = SLOTS.map((slot) =>
      `<button type="button" class="glass-slot${time === slot ? " is-selected" : ""}" data-time="${slot}">${slot}</button>`
    ).join("") + `<button type="button" class="glass-slot is-none${time === "No time preference" ? " is-selected" : ""}" data-time="No time preference">No time preference</button>`;
  }

  toggle.addEventListener("click", () => open(!picker.classList.contains("is-open")));
  document.getElementById("calPrev").addEventListener("click", () => {
    view.setMonth(view.getMonth() - 1);
    render();
  });
  document.getElementById("calNext").addEventListener("click", () => {
    view.setMonth(view.getMonth() + 1);
    render();
  });
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-stamp]");
    if (!btn || btn.disabled) return;
    const [yy, mm, dd] = btn.dataset.stamp.split("-").map(Number);
    selected = new Date(yy, mm, dd);
    time = null;
    whenEl.textContent = labelDate(selected);
    hint.textContent = "Choose a time.";
    render();
    renderTimes();
    overlay.hidden = false;
  });
  timesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-time]");
    if (!btn) return;
    time = btn.dataset.time;
    renderTimes();
    hint.textContent = `${labelDate(selected)} · ${time}`;
  });
  document.getElementById("calClose").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!selected || !time) {
      hint.textContent = "Choose an available date and time";
      return;
    }
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const description = String(data.get("description") || "").trim();
    const when = `${labelDate(selected)} · ${time}`;
    const link = calendarLink(name, email, selected, time, description);
    const lines = [
      `${name} requested a free 30-minute strategy call.`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Requested time: ${when}`,
      "Timezone: America/Toronto",
    ];
    if (description) lines.push("", "Short description:", description);
    lines.push("", "Nothing is on your calendar yet. Open this link and save the event if you want to add them:", link);
    const body = lines.join("\n");
    hint.textContent = "Your email app should open the request. Send it, and Piotr adds the call to his calendar only if the time works.";
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Strategy call request — " + when)}&body=${encodeURIComponent(body)}`;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!overlay.hidden) closeOverlay();
    else open(false);
  });
})();

(() => {
  const root = document.querySelector(".lang");
  if (!root) return;
  const btn = root.querySelector(".lang-btn");
  const menu = root.querySelector(".lang-menu");
  const label = root.querySelector(".lang-label");
  const flag = root.querySelector(".lang-flag");
  if (typeof SITE_LANGS === "undefined") return;
  const flagSrc = (cc) => cc.startsWith("http") ? cc : `https://flagcdn.com/w40/${cc}.png`;
  for (const [code, name, native, cc] of SITE_LANGS) {
    const src = flagSrc(cc);
    const li = document.createElement("li");
    const item = document.createElement("button");
    item.type = "button";
    item.setAttribute("role", "option");
    item.dataset.lang = code;
    item.dataset.name = name;
    item.dataset.flag = src;
    item.setAttribute("aria-selected", code === "en" ? "true" : "false");
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.width = 26;
    img.height = 17;
    item.append(img, document.createTextNode(name));
    if (native && native !== name) {
      const sub = document.createElement("span");
      sub.className = "lang-native";
      sub.dir = "auto";
      sub.textContent = native;
      item.append(sub);
    }
    li.append(item);
    menu.append(li);
  }
  const setOpen = (on) => {
    root.classList.toggle("is-open", on);
    btn.setAttribute("aria-expanded", String(on));
    menu.hidden = !on;
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-lang]");
    if (!item) return;
    e.stopPropagation();
    label.textContent = item.dataset.name;
    flag.src = item.dataset.flag;
    menu.querySelectorAll("[data-lang]").forEach((el) => {
      el.setAttribute("aria-selected", el === item ? "true" : "false");
    });
    setOpen(false);
  });
  document.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

// Case studies: holographic tilt. The card leans toward the cursor and the foil/glare follow it.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".cases .exp-item").forEach((item) => {
    const card = item.querySelector(".holo-card");
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.setProperty("--hue", `${x * 360}deg`);
      item.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg)`;
      item.classList.add("is-tilting");
    });
    card.addEventListener("pointerleave", () => {
      item.style.transform = "";
      item.classList.remove("is-tilting");
    });
  });
}
