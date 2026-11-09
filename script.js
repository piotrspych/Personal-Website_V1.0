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
