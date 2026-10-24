import { FAST, SLOW } from "./config.js";
import { state } from "./state.js";
import { initMap } from "./map.js";
import {
  initLayers,
  initTabs,
  buildPanel,
  refreshAll,
  initFooter,
  pick,
  startTickerRotation,
} from "./ui.js";
import {
  setOnRefresh,
  runSources,
  FAST_NAMES,
  SLOW_NAMES,
} from "./api.js";

const lt = document.getElementById("lt");
const th = document.getElementById("th");
const rf = document.getElementById("rf");

async function boot() {
  initFooter();
  initLayers();
  initTabs();
  buildPanel();
  startTickerRotation();

  // ربط دورة التحديث بدالة الواجهة
  setOnRefresh(refreshAll);

  // انتظر تحميل الخريطة قبل بدء الجلب
  await initMap(pick);

  // أول تحميل شامل
  await runSources([...FAST_NAMES, ...SLOW_NAMES]);
  state.ready = true;
  state.born = Date.now();
  refreshAll();

  // التحديث الدوري
  setInterval(() => runSources(FAST_NAMES), FAST);
  setInterval(() => runSources(SLOW_NAMES), SLOW);
}

// ================= أزرار التحكم =================
rf.onclick = () => runSources([...FAST_NAMES, ...SLOW_NAMES]);

lt.onclick = () => {
  lt.classList.toggle("on");
  document.body.classList.toggle("lite", lt.classList.contains("on") || state.playing);
};

th.onclick = () => {
  const r = document.documentElement;
  const isDark =
    (r.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  r.dataset.theme = isDark ? "light" : "dark";
  // أعد رسم الخريطة لتحديث الألوان
  import("./map.js").then((m) => m.draw && m.draw());
  // في الواقع أعد تعيين ألوان الخريطة
  import("./state.js").then(() => {
    // نستخدم حدثًا بسيطًا لإعادة التلوين
    document.dispatchEvent(new Event("theme:changed"));
  });
};

document.addEventListener("theme:changed", async () => {
  // مسح ألوان الخريطة المخزنة وإعادة الرسم
  const { draw } = await import("./map.js");
  // إعادة تحميل الألوان
  document.documentElement.style.setProperty("--_themeTick", Date.now());
  draw();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    if (state.dirty && !state.playing) {
      state.dirty = false;
      refreshAll();
    }
    document.title = "خريطة أخبار العالم المباشرة";
    state.newc = 0;
  }
});

boot().catch((err) => {
  console.error("فشل بدء التطبيق:", err);
  document.getElementById("body").innerHTML =
    `<div class="note" style="color:#e5484d">تعذّر تحميل التطبيق. تحقق من الاتصال بالإنترنت وأعد تحميل الصفحة.</div>`;
}); 
