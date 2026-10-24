import { LAYERS, COLORS, TV } from "./config.js";

const $ = (s) => document.querySelector(s);

export function initFilters(onToggle) {
  const nav = $("#filters");
  nav.innerHTML = Object.entries(LAYERS)
    .map(
      ([key, label]) => `
      <button class="filter-btn on" data-type="${key}">
        <span class="dot" style="--c:${COLORS[key]}"></span>
        <span>${label}</span>
        <span class="count">0</span>
      </button>`
    )
    .join("");

  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    btn.classList.toggle("on");
    btn.classList.toggle("off");
    onToggle(btn.dataset.type, btn.classList.contains("on"));
  });
}

export function updateCounts(features) {
  const counts = {};
  features.forEach((f) => {
    const t = f.properties.type;
    counts[t] = (counts[t] || 0) + 1;
  });
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.querySelector(".count").textContent = counts[btn.dataset.type] || 0;
  });
}

// عرض قائمة الأخبار في اللوحة الجانبية
export function renderList(features) {
  const body = $("#panel-body");
  const sorted = [...features].sort((a, b) => (b.properties.time || 0) - (a.properties.time || 0)).slice(0, 100);

  body.innerHTML = sorted
    .map((f) => {
      const p = f.properties;
      return `
        <div class="news-item" data-id="${p.id}" style="--c:${COLORS[p.type] || "#38bdf8"}">
          <h3>${p.title}</h3>
          <div class="meta">
            <span class="badge">${LAYERS[p.type] || p.type}</span>
            <span>${p.place || ""}</span>
            <span>${p.time ? new Date(+p.time).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
          </div>
        </div>`;
    })
    .join("");

  body.querySelectorAll(".news-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const f = features.find((x) => x.properties.id === id);
      if (f) {
        const [lon, lat] = f.geometry.coordinates;
        import("./map.js").then((m) => m.flyTo(lon, lat, 7));
        showDetail(f.properties);
      }
    });
  });
}

export function showDetail(props) {
  const card = $("#detail");
  card.hidden = false;
  card.innerHTML = `
    <button class="close-detail" aria-label="إغلاق">✕</button>
    <h3>${props.title}</h3>
    <div class="meta">${props.place || ""} · ${props.src || ""}</div>
    ${props.desc ? `<p style="font-size:13px;color:#cbd5e1">${props.desc}</p>` : ""}
    ${props.url ? `<a href="${props.url}" target="_blank" rel="noopener">فتح المصدر ↗</a>` : ""}
  `;
  card.querySelector(".close-detail").onclick = () => (card.hidden = true);
}

export function initPanel() {
  const panel = $("#panel");
  const openBtn = $("#panel-open");
  const closeBtn = $("#panel-close");

  const toggle = (open) => {
    panel.classList.toggle("closed", !open);
    openBtn.classList.toggle("hidden", open);
  };

  closeBtn.onclick = () => toggle(false);
  openBtn.onclick = () => toggle(true);
  toggle(true);
}

export function hideLoader() {
  $("#loader").classList.add("hidden");
}

export function setStatus(html) {
  $("#status").innerHTML = html;
}
