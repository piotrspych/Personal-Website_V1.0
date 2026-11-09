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

// Project slider.
const track = document.getElementById("workTrack");
const slideCount = track.children.length;
let slide = 0;

function showSlide(i) {
  slide = (i + slideCount) % slideCount;
  track.style.transform = `translateX(calc(${-slide} * (100% + 10px)))`;
}

document.getElementById("workPrev").addEventListener("click", () => showSlide(slide - 1));
document.getElementById("workNext").addEventListener("click", () => showSlide(slide + 1));

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

// Appointment booker under "Schedule a call".
(function () {
  const picker = document.getElementById("callPicker");
  const toggle = document.getElementById("callToggle");
  const form = document.getElementById("callBook");
  const grid = document.getElementById("calGrid");
  const timesEl = document.getElementById("calTimes");
  const title = document.getElementById("calTitle");
  const hint = document.getElementById("calHint");
  if (!picker || !toggle || !form || !grid || !timesEl) return;

  const MAIL = "piotr.spychalski12@gmail.com";
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"];

  let view = new Date();
  view.setDate(1);
  let selected = null;
  let time = null;

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = () => startOfDay(new Date());
  const stamp = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const openDay = (d) => d >= today() && !isWeekend(d);
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

  function calendarLink(name, email, date, slot) {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: slot === "No time preference" ? `Strategy call with ${name} (time TBD)` : `Strategy call with ${name}`,
      dates: googleDates(date, slot),
      details: `Email: ${email}\n30-minute strategy call. Times are America/Toronto.`,
      ctz: "America/Toronto",
      add: email,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function open(on) {
    picker.classList.toggle("is-open", on);
    toggle.setAttribute("aria-expanded", String(on));
    if (on) render();
  }

  function render() {
    const y = view.getFullYear();
    const m = view.getMonth();
    title.textContent = `${MONTHS[m]} ${y}`;
    const start = new Date(y, m, 1);
    start.setDate(start.getDate() - start.getDay());
    const now = today();
    let html = WEEK.map((w) => `<span class="call-book-dow">${w}</span>`).join("");
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const muted = date.getMonth() !== m || !openDay(date);
      const isToday = stamp(date) === stamp(now);
      const isSel = selected && stamp(date) === stamp(selected);
      const off = !openDay(date);
      html += `<button type="button" class="call-book-day${muted ? " is-muted" : ""}${isToday ? " is-today" : ""}${isSel ? " is-selected" : ""}" data-stamp="${stamp(date)}" ${off ? "disabled" : ""} aria-label="${labelDate(date)}">${date.getDate()}</button>`;
    }
    grid.innerHTML = html;
    renderTimes();
  }

  function renderTimes() {
    if (!selected) {
      timesEl.className = "call-book-times is-empty";
      timesEl.innerHTML = "Choose an available date first.";
      return;
    }
    timesEl.className = "call-book-times";
    timesEl.innerHTML = SLOTS.map((slot) =>
      `<button type="button" class="call-book-slot${time === slot ? " is-selected" : ""}" data-time="${slot}">${slot}</button>`
    ).join("") + `<button type="button" class="call-book-slot is-none${time === "No time preference" ? " is-selected" : ""}" data-time="No time preference">No time preference</button>`;
  }

  function setHint() {
    if (!selected || !time) hint.textContent = "Choose an available date and time";
    else hint.textContent = `${labelDate(selected)} · ${time}`;
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
    render();
    setHint();
  });
  timesEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-time]");
    if (!btn) return;
    time = btn.dataset.time;
    renderTimes();
    setHint();
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
    const when = `${labelDate(selected)} · ${time}`;
    const link = calendarLink(name, email, selected, time);
    const body = [
      `${name} requested a free 30-minute strategy call.`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Requested time: ${when}`,
      "Timezone: America/Toronto",
      "",
      "Nothing is on your calendar yet. Open this link and save the event if you want to add them:",
      link,
    ].join("\n");
    hint.textContent = "Your email app should open the request. Send it, and Piotr adds the call to his calendar only if the time works.";
    window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Strategy call request — " + when)}&body=${encodeURIComponent(body)}`;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") open(false);
  });
})();
