import { fetchEvents, fetchNews } from "./api.js";
import { EVENTS_REFRESH_MS, LAYERS, NEWS_REFRESH_MS } from "./config.js";
import { ago, normalizeText } from "./utils.js";
import { flyTo, initMap, setEvents } from "./map.js";
import {
  hideLoader,
  initFilters,
  initPanel,
  initTabs,
  initTV,
  renderEvents,
  renderFilters,
  renderList,
  renderTicker,
  setActiveTab,
  setFreshness,
  setLoading,
  setSourceStatus,
  showDetail,
  updateCounts,
} from "./ui.js";

let articles = [];
let features = [];
let newsStatus = {};
let eventsStatus = {};
let activeTab = "news";
let activeSource = "all";
let enabledTypes = new Set(Object.keys(LAYERS));
let query = "";
let newsBusy = false;
let eventsBusy = false;
let lastNewsUpdate = 0;
let lastEventsUpdate = 0;

function combinedStatus() {
  return { ...newsStatus, ...eventsStatus };
}

function matchesQuery(value) {
  return normalizeText(value).includes(normalizeText(query));
}

function applyFilters() {
  const filteredArticles = articles.filter((article) => {
    const sourceMatches = activeSource === "all" || article.sourceKey === activeSource;
    return sourceMatches && (!query || matchesQuery(`${article.title} ${article.summary} ${article.source}`));
  });
  const filteredEvents = features.filter((feature) => {
    const properties = feature.properties || {};
    const typeMatches = enabledTypes.has(properties.type);
    return typeMatches && (!query || matchesQuery(`${properties.title} ${properties.place} ${properties.desc} ${properties.src}`));
  });

  updateCounts(articles.length, features.length);
  renderFilters(activeTab, activeSource, enabledTypes);
  setActiveTab(activeTab);
  setEvents(filteredEvents);
  if (activeTab === "news") {
    renderList(filteredArticles);
  } else {
    renderEvents(filteredEvents, (feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      flyTo(longitude, latitude, 6.5);
      showDetail(feature.properties);
    });
    setEvents(filteredEvents);
  }
  return { filteredArticles, filteredEvents };
}

function updateSourcePanel() {
  setSourceStatus(combinedStatus());
}

async function refreshNews() {
  if (newsBusy || document.hidden) return;
  newsBusy = true;
  try {
    const result = await fetchNews();
    newsStatus = result.status;
    const successful = Object.values(result.status).some((source) => source.ok);
    if (successful) {
      articles = result.articles;
      lastNewsUpdate = Date.now();
      renderTicker(articles);
      setFreshness(`آخر تحديث للأخبار ${ago(lastNewsUpdate)}`, "fresh");
    } else if (lastNewsUpdate) {
      setFreshness(`تعذر التحديث · آخر بيانات ${ago(lastNewsUpdate)}`, "stale");
    } else {
      setFreshness("لم تصل بيانات من المصادر بعد", "stale");
    }
    applyFilters();
    updateSourcePanel();
  } catch (error) {
    console.error("News refresh failed:", error);
    setFreshness(lastNewsUpdate ? `تعذر التحديث · آخر بيانات ${ago(lastNewsUpdate)}` : "تعذر الاتصال بمصادر الأخبار", "stale");
  } finally {
    newsBusy = false;
    hideLoader();
  }
}

async function refreshEvents() {
  if (eventsBusy || document.hidden) return;
  eventsBusy = true;
  try {
    const result = await fetchEvents();
    eventsStatus = result.status;
    const successful = Object.values(result.status).some((source) => source.ok);
    if (successful) {
      features = result.features;
      lastEventsUpdate = Date.now();
    }
    applyFilters();
    updateSourcePanel();
  } catch (error) {
    console.error("Event refresh failed:", error);
  } finally {
    eventsBusy = false;
    hideLoader();
  }
}

async function refreshAll() {
  setLoading("all", true);
  await Promise.all([refreshNews(), refreshEvents()]);
  setLoading("all", false);
}

initPanel();
initTV();
initFilters((kind, value) => {
  if (kind === "source") activeSource = value;
  if (kind === "type") enabledTypes.has(value) ? enabledTypes.delete(value) : enabledTypes.add(value);
  if (kind === "all-types") enabledTypes = new Set(Object.keys(LAYERS));
  applyFilters();
});
initTabs((tab) => {
  activeTab = tab;
  applyFilters();
});

const search = document.getElementById("search");
search.addEventListener("input", (event) => {
  query = event.target.value.trim();
  applyFilters();
});

document.getElementById("btn-refresh").addEventListener("click", refreshAll);
document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  event.preventDefault();
  search.focus();
});
document.getElementById("btn-theme").addEventListener("click", (event) => {
  const enabled = document.body.classList.toggle("light-theme");
  event.currentTarget.setAttribute("aria-pressed", String(enabled));
  try { localStorage.setItem("newsworld-theme", enabled ? "light" : "dark"); } catch { /* التخزين اختياري */ }
});

try {
  if (localStorage.getItem("newsworld-theme") === "light") {
    document.body.classList.add("light-theme");
    document.getElementById("btn-theme").setAttribute("aria-pressed", "true");
  }
} catch { /* التخزين اختياري */ }

try {
  initMap((properties) => showDetail(properties));
} catch (error) {
  console.error("Map initialization failed:", error);
  document.body.classList.add("map-unavailable");
  setFreshness("تعذر تحميل الخريطة؛ تبقى قائمة البيانات متاحة", "stale");
}

document.addEventListener("newsworld:mapready", () => setEvents(features));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAll();
});

applyFilters();
refreshAll();
setInterval(refreshNews, NEWS_REFRESH_MS);
setInterval(refreshEvents, EVENTS_REFRESH_MS);
