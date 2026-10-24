import { L, BASE, TV, FEEDS } from "./config.js";
import { esc, ago, clock } from "./utils.js";
import { state, isFresh } from "./state.js";
import { draw, focusOn } from "./map.js";

const el = {
  upd: document.getElementById("upd"),
  tk: document.getElementById("tk"),
  layers: document.getElementById("layers"),
  status: document.getElementById("status"),
  card: document.getElementById("card"),
  leg: document.getElementById("leg"),
  tabs: document.getElementById("tabs"),
  body: document.getElementById("body"),
  foot: document.getElementById("foot"),
};

// ================= مفتاح الخريطة =================
el.leg.innerHTML = Object.values(L)
  .map((v) => `<div><i style="background:${v[1]}"></i>${v[0]}</div>`)
  .join("");

// ================= بطاقة التفاصيل =================
export function pick(item) {
  el.card.innerHTML = `
    <h3>${esc(item.title)}</h3>
    <span class="badge" style="background:${L[item.type][1]}">${L[item.type][0]}</span>
    ${esc(item.place || "")} ${item.time ? "· " + ago(item.time) + " (" + clock(item.time) + ")" : ""}
    <br>${esc(item.desc || "")}
    <br><small>المصدر: ${esc(item.src)}</small>
    ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">فتح الخبر ↗</a>` : ""}
  `;
  focusOn(item);
  if (innerWidth < 1000) el.card.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// ================= الطبقات =================
export function initLayers() {
  Object.entries(L).forEach(([key, val]) => {
    const btn = document.createElement("button");
    btn.className = "stat";
    btn.dataset.k = key;
    btn.style.setProperty("--c", val[1]);
    btn.innerHTML = `<b>0</b><span>${val[0]}</span>`;
    btn.onclick = () => {
      state.on.has(key) ? state.on.delete(key) : state.on.add(key);
      btn.classList.toggle("off", !state.on.has(key));
      draw();
      renderList();
    };
    el.layers.appendChild(btn);
  });
}

export function counts() {
  [...el.layers.children].forEach((b) => {
    b.firstChild.textContent = state.items.filter((i) => i.type === b.dataset.k).length;
  });
}

// ================= الشريط العاجل =================
let tickerIndex = 0;
export function ticker() {
  state.tkn = state.items
    .filter((i) => i.type === "news")
    .sort((a, b) => b.time - a.time)
    .slice(0, 25);
  showTicker();
}
function showTicker() {
  const item = state.tkn && state.tkn[tickerIndex % state.tkn.length];
  el.tk.innerHTML = item
    ? `<a href="${esc(item.url || "#")}" target="_blank" rel="noopener">${esc(item.title)}</a>`
    : "<a>جارٍ تحميل الأخبار…</a>";
}
export function startTickerRotation() {
  setInterval(() => {
    if (!document.hidden && !state.playing) {
      tickerIndex++;
      showTicker();
    }
  }, 8000);
}

// ================= حالة المصادر =================
export function stat() {
  const keys = Object.keys(state.st);
  const ok = keys.filter((k) => state.st[k] >= 0).length;
  const wasOpen = el.status.open;
  el.status.innerHTML = `
    <summary>المصادر: ${ok} من ${keys.length} تعمل${ok < keys.length ? " (جارٍ المحاولة للبقية)" : ""} · اضغط للتفاصيل</summary>
    <p>${keys
      .map((k) =>
        state.st[k] < 0
          ? `<span class="bad">✗ ${esc(k)}</span>`
          : `<span class="ok">✓ ${esc(k)} (${state.st[k]})</span>`
      )
      .join(" · ")}</p>
  `;
  el.status.open = wasOpen;
}

// ================= التبويبات =================
const TABS = [
  ["ev", "⚡ مباشر"],
  ["nw", "📰 الأخبار"],
  ["tv", "📺 البث"],
  ["sr", "🔗 المصادر"],
];

export function initTabs() {
  el.tabs.innerHTML = TABS.map((t) => `<button data-t="${t[0]}">${t[1]}</button>`).join("");
  el.tabs.onclick = (e) => {
    if (e.target.dataset.t) {
      state.tab = e.target.dataset.t;
      state.n = 30;
      buildPanel();
    }
  };
}

// ================= بناء اللوحة الجانبية =================
const sel = (id, opts, v) =>
  `<select id="${id}">${opts
    .map((o) => `<option value="${o[0]}" ${String(o[0]) === String(v) ? "selected" : ""}>${esc(o[1])}</option>`)
    .join("")}</select>`;

const matchesQuery = (i) =>
  !state.q || (i.title + " " + (i.place || "") + " " + i.src).toLowerCase().includes(state.q.toLowerCase());

export function buildPanel() {
  [...el.tabs.children].forEach((b) => b.classList.toggle("on", b.dataset.t === state.tab));

  if (state.tab !== "tv" && state.playing) {
    state.playing = false;
    document.body.classList.remove("lite");
    if (state.dirty) {
      state.dirty = false;
      refreshAll();
    }
  }

  if (state.tab === "ev" || state.tab === "nw") {
    el.body.innerHTML = `
      <div class="tools">
        <input id="q" placeholder="🔎 بحث في العناوين والأماكن والمصادر" value="${esc(state.q)}">
        ${sel("tm", [[0, "كل الأوقات"], [1, "آخر ساعة"], [6, "آخر 6 ساعات"], [24, "آخر 24 ساعة"]], state.tm)}
        ${sel("lg", [["all", "كل اللغات"], ["ar", "عربي"], ["en", "English"]], state.lg)}
        ${state.tab === "nw" ? '<select id="sl" style="grid-column:1/-1"></select>' : ""}
      </div>
      <div id="ls"></div>
    `;
    let timer;
    document.getElementById("q").oninput = (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.q = e.target.value;
        state.n = 30;
        renderList();
      }, 250);
    };
    document.getElementById("tm").onchange = (e) => { state.tm = +e.target.value; renderList(); };
    document.getElementById("lg").onchange = (e) => { state.lg = e.target.value; renderList(); };
    if (state.tab === "nw") {
      document.getElementById("sl").onchange = (e) => { state.src = e.target.value; renderList(); };
    }
    document.getElementById("ls").onclick = (e) => {
      if (e.target.id === "mr") { state.n += 30; renderList(); return; }
      const item = e.target.closest(".it");
      if (item) pick(state.view[+item.dataset.k]);
    };
    renderList();
  } else if (state.tab === "tv") {
    renderTV();
  } else {
    el.body.innerHTML = [
      ...FEEDS.map((r) => [r[0], "خلاصة أخبار (RSS)", r[2]]),
      ["GDELT", "أخبار وأحداث من آلاف المصادر", "https://www.gdeltproject.org"],
      ["USGS", "زلازل لحظية", "https://earthquake.usgs.gov/earthquakes/map/"],
      ["NASA EONET", "كوارث طبيعية", "https://eonet.gsfc.nasa.gov"],
      ["GDACS", "تنبيهات كوارث الأمم المتحدة", "https://www.gdacs.org"],
      ...TV.map((t) => [t.n, "بث مباشر على يوتيوب", "https://www.youtube.com/channel/" + t.id + "/live"]),
    ]
      .map((s) => `
        <a class="it" style="--c:var(--ac);display:block;text-decoration:none;color:inherit"
           href="${esc(s[2])}" target="_blank" rel="noopener">
          <b>${esc(s[0])}</b><span>${esc(s[1])}</span>
        </a>`)
      .join("");
  }
}

// ================= قائمة العناصر =================
let lastSignature = "";
export function renderList() {
  const ls = document.getElementById("ls");
  if (!ls) return;

  if (state.tab === "nw" && window.sl) {
    const names = [...new Set(state.items.filter((i) => i.type === "news").map((i) => i.src))].sort();
    sl.innerHTML =
      `<option value="all">كل المصادر (${names.length})</option>` +
      names.map((n) => `<option ${n === state.src ? "selected" : ""}>${esc(n)}</option>`).join("");
  }

  const cutoff = state.tm ? Date.now() - state.tm * 3600000 : 0;
  const filtered = (state.tab === "nw"
    ? state.items.filter((i) => i.type === "news" && (state.src === "all" || i.src === state.src))
    : state.items.filter((i) => state.on.has(i.type) && i.time)
  )
    .filter((i) => (!cutoff || i.time >= cutoff) && (state.lg === "all" || i.type !== "news" || i.lang === state.lg) && matchesQuery(i))
    .sort((a, b) => b.time - a.time);

  state.view = filtered.slice(0, state.n);
  const sig = [state.tab, state.n, state.q, state.tm, state.lg, state.src, state.on.size, ...state.view.map((i) => i.id + (isFresh(i) ? 1 : 0))].join("|");
  if (sig === lastSignature) return;
  lastSignature = sig;

  const scrollTop = el.body.scrollTop;
  ls.innerHTML =
    `<div class="note">${filtered.length} نتيجة · تتحدث القائمة تلقائياً</div>` +
    state.view
      .map((i, k) => `
        <div class="it" data-k="${k}" style="--c:${L[i.type][1]}">
          <b>${isFresh(i) ? '<span class="badge new">جديد</span>' : ""}${esc(i.title)}</b>
          <span>${esc(i.src)}${i.place ? " · " + esc(i.place) : ""} · ${ago(i.time)} (${clock(i.time)})</span>
        </div>`)
      .join("") +
    (filtered.length > state.n ? '<button class="btn" id="mr">عرض المزيد</button>' : "");
  el.body.scrollTop = scrollTop;
}

// ================= البث المباشر =================
const youtubeEmbed = (ch, muted) =>
  `<iframe src="https://www.youtube.com/embed/live_stream?channel=${ch.id}&autoplay=1&mute=${muted ? 1 : 0}&playsinline=1"
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowfullscreen referrerpolicy="strict-origin-when-cross-origin"
    loading="lazy"></iframe>`;

const facade = (ch, idx) =>
  `<div class="fac" data-i="${idx}"><b>▶</b><span>اضغط لتشغيل ${esc(ch.n)}</span></div>`;

function renderTV() {
  const cur = TV[state.tv];
  el.body.innerHTML = `
    <div class="chs">
      ${TV.map((c, i) => `<button data-i="${i}" class="${!state.wall && i === state.tv ? "on" : ""}">${esc(c.n)}</button>`).join("")}
      <button data-w="1" class="${state.wall ? "on" : ""}">▦ جدار (4 قنوات)</button>
    </div>
    ${
      state.wall
        ? `<div class="tv wall">${TV.slice(0, 4).map(facade).join("")}</div>`
        : `<div class="tv">${facade(cur, state.tv)}</div>
           <a class="btn" target="_blank" rel="noopener" href="https://www.youtube.com/channel/${cur.id}/live">فتح البث في يوتيوب ↗</a>`
    }
    <div class="note">البث لا يبدأ إلا عند الضغط عليه لتخفيف الحمل. أثناء التشغيل يتوقف تحديث الخريطة تلقائياً لأفضل أداء. إن تقطّع البث فاختر جودة أقل (⚙ داخل المشغّل) أو شغّل قناة واحدة.</div>
  `;
  el.body.querySelector(".chs").onclick = (e) => {
    const b = e.target;
    if (b.dataset.w) { state.wall = !state.wall; renderTV(); }
    else if (b.dataset.i) { state.wall = false; state.tv = +b.dataset.i; renderTV(); }
  };
  el.body.querySelectorAll(".fac").forEach((f) => {
    f.onclick = () => {
      f.outerHTML = youtubeEmbed(TV[+f.dataset.i], state.wall);
      state.playing = true;
      document.body.classList.add("lite");
    };
  });
}

// ================= دورة حياة التحديث =================
export function refreshAll() {
  const all = [...BASE];
  const seenUrls = new Set();
  const old = Date.now() - 172800000; // 48 ساعة
  Object.values(state.by).forEach((arr) =>
    arr.forEach((i) => {
      if (i.type === "news") {
        if (i.time < old) return;
        const k = i.url || i.id;
        if (seenUrls.has(k)) return;
        seenUrls.add(k);
      }
      all.push(i);
    })
  );
  state.items = all;

  if (state.playing || document.hidden) {
    state.dirty = true;
    return;
  }
  draw();
  counts();
  ticker();
  stat();
  renderList();
  el.upd.textContent = "آخر تحديث: " + clock(Date.now());

  const nf = state.items.filter((i) => i.type === "news" && isFresh(i)).length;
  if (document.hidden && nf) {
    state.newc = nf;
    document.title = `(${nf}) خريطة أخبار العالم`;
  }
}

export function initFooter() {
  el.foot.textContent =
    "البيانات تُجلب مباشرة في متصفحك من مصادر عامة، وتتحدث تلقائياً (الأخبار كل دقيقتين، والأحداث كل 5 دقائق) وتتوقف عند إخفاء الصفحة. مواقع الأخبار على الخريطة تُستنتج من أسماء الدول في العناوين فهي تقريبية. قد يتوقف أي مصدر أو بث بلا إنذار، وحالة كل مصدر معروضة أعلى الخريطة.";
} 
