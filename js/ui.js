import { COLORS, FEEDS, LAYERS } from "./config.js";
import { ago, clock, esc, safeUrl } from "./utils.js";

const $ = (selector) => document.querySelector(selector);
const statusLabels = { all: "كل المصادر", gdelt: "GDELT" };

export function initFilters(onChange) {
  const filters = $("#filters");
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-kind]");
    if (!button) return;
    onChange(button.dataset.filterKind, button.dataset.filterValue);
  });
}

export function renderFilters(tab, activeSource, enabledTypes) {
  const filters = $("#filters");
  if (tab === "news") {
    const sources = [{ key: "all", name: statusLabels.all }, ...FEEDS.map((feed) => ({ key: feed.key, name: feed.name })), { key: "gdelt", name: statusLabels.gdelt }];
    filters.innerHTML = sources.map((source) => `
      <button class="filter-chip ${activeSource === source.key ? "is-active" : ""}" type="button"
        data-filter-kind="source" data-filter-value="${esc(source.key)}" aria-pressed="${activeSource === source.key}">
        ${esc(source.name)}
      </button>`).join("");
    return;
  }

  filters.innerHTML = [
    `<button class="filter-chip ${enabledTypes.size === Object.keys(LAYERS).length ? "is-active" : ""}" type="button" data-filter-kind="all-types" data-filter-value="all">كل الطبقات</button>`,
    ...Object.entries(LAYERS).map(([key, label]) => `
      <button class="filter-chip ${enabledTypes.has(key) ? "is-active" : ""}" type="button"
        data-filter-kind="type" data-filter-value="${esc(key)}" aria-pressed="${enabledTypes.has(key)}">
        <span class="filter-dot" style="--dot:${COLORS[key]}"></span>${esc(label)}
      </button>`),
  ].join("");
}

export function initTabs(onChange) {
  const container = $("#panel-tabs");
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) onChange(button.dataset.tab);
  });
  container.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0 || tabs.length < 2) return;
    event.preventDefault();
    const rtl = getComputedStyle(container).direction === "rtl";
    const delta = event.key === "ArrowLeft" ? (rtl ? 1 : -1) : (rtl ? -1 : 1);
    const next = tabs[(current + delta + tabs.length) % tabs.length];
    next.focus();
    onChange(next.dataset.tab);
  });
}

export function setActiveTab(tab) {
  document.querySelectorAll("#panel-tabs [data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("#panel-body").setAttribute("aria-labelledby", tab === "news" ? "tab-news" : "tab-events");
  $("#panel-title").textContent = tab === "news" ? "آخر الأخبار" : "الأحداث على الخريطة";
  $("#panel-caption").textContent = tab === "news"
    ? "عناوين من ناشرين ومصادر أصلية"
    : "بيانات جغرافية من وكالات ومصادر مفتوحة";
}

export function updateCounts(articles, events) {
  $("#news-count").textContent = Number(articles) || 0;
  $("#events-count").textContent = Number(events) || 0;
  $("#events-count-tab").textContent = Number(events) || 0;
  $("#headline-count").textContent = Number(articles) || 0;
  $("#map-count").textContent = Number(events) || 0;
}

function emptyState(title, detail) {
  return `<div class="empty-state"><span class="empty-mark" aria-hidden="true">—</span><strong>${esc(title)}</strong><p>${esc(detail)}</p></div>`;
}

export function renderList(articles) {
  const body = $("#panel-body");
  body.setAttribute("aria-busy", "false");
  if (!articles.length) {
    body.innerHTML = emptyState("لا توجد عناوين متاحة الآن", "تحقق من الاتصال أو اختر مصدراً آخر. لن نعرض أخباراً تجريبية.");
    return;
  }

  body.innerHTML = articles.slice(0, 120).map((article, index) => {
    const link = safeUrl(article.url);
    const image = safeUrl(article.image);
    return `
      <article class="article-card ${index === 0 ? "is-featured" : ""}">
        <div class="article-meta">
          <span class="source-mark" aria-hidden="true">${esc((article.source || "N").slice(0, 1))}</span>
          <span class="source-name">${esc(article.source || "مصدر غير محدد")}</span>
          <time datetime="${article.time ? new Date(article.time).toISOString() : ""}" title="${article.time ? esc(new Date(article.time).toLocaleString("ar")) : ""}">${esc(ago(article.time))}</time>
        </div>
        ${image ? `<img class="article-image" src="${esc(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
        ${link ? `<a class="article-title" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a>` : `<h3 class="article-title">${esc(article.title)}</h3>`}
        ${article.summary ? `<p class="article-summary">${esc(article.summary)}</p>` : ""}
        <div class="article-footer">
          <span>${esc(clock(article.time))}</span>
          ${link ? `<a class="source-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">اقرأ لدى الناشر <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </article>`;
  }).join("");
}

export function renderEvents(features, onSelect) {
  const body = $("#panel-body");
  body.setAttribute("aria-busy", "false");
  if (!features.length) {
    body.innerHTML = emptyState("لا توجد أحداث ضمن هذا الاختيار", "جرّب طبقة أخرى أو أعد التحديث لاحقاً.");
    return;
  }
  body.innerHTML = features.slice(0, 120).map((feature) => {
    const properties = feature.properties || {};
    const color = COLORS[properties.type] || COLORS.other;
    return `
      <button class="event-card" type="button" data-id="${esc(properties.id)}" style="--event-color:${color}">
        <span class="event-indicator" aria-hidden="true"></span>
        <span class="event-copy">
          <strong>${esc(properties.title || "حدث")}</strong>
          <span class="event-meta">${esc(LAYERS[properties.type] || "حدث جغرافي")} · ${esc(properties.place || "")}</span>
          <span class="event-description">${esc(properties.desc || "")}</span>
        </span>
        <span class="event-arrow" aria-hidden="true">↗</span>
      </button>`;
  }).join("");
  body.querySelectorAll(".event-card").forEach((button) => {
    button.addEventListener("click", () => {
      const feature = features.find((item) => String(item.properties?.id) === button.dataset.id);
      if (feature) onSelect?.(feature);
    });
  });
}

export function renderTicker(articles) {
  const ticker = $("#ticker");
  const titles = articles.slice(0, 10);
  if (!titles.length) {
    ticker.innerHTML = `<span class="ticker-empty">بانتظار تحديث المصادر</span>`;
    return;
  }
  const group = titles.map((article) => {
    const link = safeUrl(article.url);
    return link
      ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a>`
      : `<span>${esc(article.title)}</span>`;
  }).join(`<span class="ticker-separator" aria-hidden="true">/</span>`);
  ticker.innerHTML = `<div class="ticker-track"><div class="ticker-group">${group}</div><div class="ticker-group" aria-hidden="true">${group}</div></div>`;
}

export function setSourceStatus(status) {
  const container = $("#source-status");
  const entries = Object.values(status || {});
  container.innerHTML = entries.map((source) => `
    <span class="source-state ${source.ok ? "is-ok" : "is-error"}" title="${esc(source.error || `${source.count} مادة`)}">
      <span aria-hidden="true"></span>${esc(source.label)}${source.ok ? ` <b>${Number(source.count) || 0}</b>` : ""}
    </span>`).join("");
  const healthy = entries.filter((source) => source.ok).length;
  $("#health-label").textContent = entries.length
    ? healthy ? `${healthy} مصادر تعمل` : "تعذر الاتصال بالمصادر"
    : "جارٍ الاتصال بالمصادر";
  $("#health-dot").classList.toggle("is-error", entries.length > 0 && healthy === 0);
}

export function setFreshness(text, tone = "neutral") {
  const element = $("#freshness");
  element.textContent = text;
  element.dataset.tone = tone;
}

export function setLoading(kind, loading) {
  const button = $("#btn-refresh");
  if (kind === "all") button.classList.toggle("is-loading", loading);
  button.disabled = Boolean(loading);
  button.setAttribute("aria-busy", String(Boolean(loading)));
}

export function initPanel() {
  const panel = $("#panel");
  const toggleButton = $("#btn-panel");
  const toggle = (collapsed) => {
    panel.classList.toggle("is-collapsed", collapsed);
    toggleButton.setAttribute("aria-expanded", String(!collapsed));
    toggleButton.setAttribute("aria-label", collapsed ? "فتح لوحة الأخبار" : "إخفاء لوحة الأخبار");
  };
  toggleButton.addEventListener("click", () => toggle(!panel.classList.contains("is-collapsed")));
  $("#panel-close").addEventListener("click", () => toggle(true));
  toggle(false);
}

export function showDetail(properties) {
  const card = $("#detail");
  const link = safeUrl(properties.url);
  card.hidden = false;
  card.innerHTML = `
    <button class="detail-close" type="button" aria-label="إغلاق التفاصيل">×</button>
    <span class="detail-kicker">${esc(LAYERS[properties.type] || "حدث جغرافي")}</span>
    <h3>${esc(properties.title || "حدث")}</h3>
    <p class="detail-meta">${esc(properties.place || "")} · ${esc(properties.src || "مصدر غير محدد")}</p>
    ${properties.desc ? `<p class="detail-description">${esc(properties.desc)}</p>` : ""}
    ${link ? `<a class="detail-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">فتح المصدر الأصلي ↗</a>` : ""}`;
  card.querySelector(".detail-close").addEventListener("click", () => { card.hidden = true; });
}

export function hideLoader() {
  $("#loader").hidden = true;
  $("#panel-body").setAttribute("aria-busy", "false");
}
