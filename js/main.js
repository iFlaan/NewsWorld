import { fetchAllEvents } from "./api.js";
import { initMap, setEvents } from "./map.js";
import {
  initFilters,
  updateCounts,
  renderList,
  showDetail,
  initPanel,
  hideLoader,
  setStatus,
} from "./ui.js";
import { REFRESH_MS } from "./config.js";

let allFeatures = [];
const enabled = new Set(["conflict", "protest", "quake", "disaster", "news", "other"]);

async function load() {
  try {
    const { features, status } = await fetchAllEvents();
    allFeatures = features;
    applyFilters();
    updateCounts(features);
    setStatus(
      Object.entries(status)
        .map(([k, v]) => (v < 0 ? `<span class="bad">✗ ${k}</span>` : `<span class="ok">✓ ${k} (${v})</span>`))
        .join(" · ")
    );
    hideLoader();
  } catch (e) {
    console.error(e);
    setStatus(`<span class="bad">تعذر تحميل البيانات — تحقق من الاتصال</span>`);
  }
}

function applyFilters() {
  const filtered = allFeatures.filter((f) => enabled.has(f.properties.type));
  setEvents(filtered);
  renderList(filtered);
}

// التهيئة
initPanel();
initFilters((type, on) => {
  on ? enabled.add(type) : enabled.delete(type);
  applyFilters();
});

initMap((props) => showDetail(props));

// البحث
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allFeatures.filter(
    (f) =>
      enabled.has(f.properties.type) &&
      (!q || (f.properties.title + " " + f.properties.place).toLowerCase().includes(q))
  );
  setEvents(filtered);
  renderList(filtered);
});

// أزرار التحكم
document.getElementById("btn-refresh").onclick = load;
document.getElementById("btn-theme").onclick = () => {
  document.body.classList.toggle("light-theme");
  // ملاحظة: MapLibre يحتاج إعادة تحميل النمط؛ يمكن إضافة نمط فاتح لاحقاً
};

// التحميل الأول + التحديث الدوري
load();
setInterval(load, REFRESH_MS);
