import { FEEDS, GEO, EO, FAST, SLOW } from "./config.js";
import { strip, hash, when, parseGdeltDate } from "./utils.js";
import { state } from "./state.js";

// ثلاث طرق لجلب البيانات (تعمل من متصفح المستخدم مباشرة)
const PROXIES = [
  (u) => u,
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://corsproxy.io/?" + encodeURIComponent(u),
];
const PROXY_INDEX = {}; // نتذكر أفضل بروكسي لكل URL

async function fetchText(url, timeout = 7000) {
  const candidates = [...new Set([PROXY_INDEX[url] ?? 0, 0, 1, 2])];
  for (const idx of candidates) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const res = await fetch(PROXIES[idx](url), { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 40) {
          PROXY_INDEX[url] = idx;
          return text;
        }
      }
    } catch {
      /* جرّب البروكسي التالي */
    }
  }
  throw new Error("فشل جلب: " + url);
}

const fetchJson = async (url) => JSON.parse(await fetchText(url));

// تخمين موقع الخبر من الكلمات المفتاحية في العنوان
function guessLocation(text, id) {
  for (const [re, lon, lat] of GEO) {
    if (re.test(text)) {
      const h = hash(id);
      return [
        lon + ((h % 100) / 100 - 0.5) * 2.2,
        lat + (((h >> 8) % 100) / 100 - 0.5) * 2.2,
      ];
    }
  }
  return null;
}

const CACHE = new Map();
function buildNewsItem(src, title, link, desc, time, extra) {
  const id = "n" + (link || title);
  if (CACHE.has(id)) return CACHE.get(id);
  title = strip(title);
  if (!title) return null;
  const d = strip(desc);
  const pos = guessLocation(title + " " + d.slice(0, 120), id);
  if (CACHE.size > 4000) CACHE.clear();
  const item = {
    id,
    type: "news",
    lon: pos?.[0],
    lat: pos?.[1],
    title,
    place: "",
    time,
    url: link,
    src,
    desc: d,
    lang: /[\u0600-\u06FF]/.test(title) ? "ar" : "en",
    ...extra,
  };
  CACHE.set(id, item);
  return item;
}

function parseRSS(xmlText, sourceName) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  return [...doc.querySelectorAll("item, entry")]
    .slice(0, 40)
    .map((el) => {
      const q = (tag) => el.querySelector(tag)?.textContent || "";
      const linkEl = el.querySelector("link");
      const link =
        (linkEl && (linkEl.getAttribute("href") || linkEl.textContent)) || "";
      const dateStr =
        q("pubDate") ||
        q("published") ||
        q("updated") ||
        el.getElementsByTagName("dc:date")[0]?.textContent;
      return buildNewsItem(
        sourceName,
        q("title"),
        link.trim(),
        q("description") || q("summary") || q("content"),
        when(dateStr)
      );
    })
    .filter(Boolean);
}

// ================= مُحمّلات المصادر =================
export const LOADERS = {};

// RSS feeds
for (const [name, url] of FEEDS) {
  LOADERS[name] = async () => parseRSS(await fetchText(url), name);
}

// GDELT — مقالات عربية وإنجليزية
const GDELT_QUERIES = [
  ["GDELT عربي", "(الحرب OR غارة OR هجوم OR اشتباكات OR قصف OR انفجار) sourcelang:arabic"],
  ["GDELT English", "(war OR attack OR airstrike OR clashes OR explosion OR protest) sourcelang:english"],
];
for (const [name, query] of GDELT_QUERIES) {
  LOADERS[name] = async () => {
    const data = await fetchJson(
      "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
        encodeURIComponent(query) +
        "&mode=artlist&maxrecords=100&format=json&sort=datedesc&timespan=3h"
    );
    return (data.articles || [])
      .map((a) =>
        buildNewsItem(name + " · " + a.domain, a.title, a.url, "", parseGdeltDate(a.seendate))
      )
      .filter(Boolean);
  };
}

// GDELT — أحداث جغرافية (صراعات / احتجاجات)
function makeGdeltGeoLoader(name, type, query) {
  return async () => {
    const data = await fetchJson(
      "https://api.gdeltproject.org/api/v2/geo/geo?query=" +
        encodeURIComponent(query) +
        "&format=geojson&timespan=1d"
    );
    return data.features
      .sort((a, b) => b.properties.count - a.properties.count)
      .slice(0, 50)
      .map((f) => {
        let title = "";
        let url = "https://www.gdeltproject.org";
        try {
          const a = new DOMParser()
            .parseFromString(f.properties.html || "", "text/html")
            .querySelector("a");
          if (a) {
            title = a.textContent;
            url = a.href;
          }
        } catch {
          /* ignore */
        }
        return {
          id: "g" + type + f.properties.name,
          type,
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          title:
            strip(title) ||
            (type === "conflict" ? "نشاط إخباري مكثف عن صراع" : "احتجاجات وتوترات"),
          place: f.properties.name,
          time: Date.now(),
          src: "GDELT",
          url,
          desc: `عدد الإشارات الإخبارية خلال 24 ساعة: ${f.properties.count}`,
        };
      });
  };
}
LOADERS["GDELT صراعات"] = makeGdeltGeoLoader("GDELT صراعات", "conflict", "(war OR attack OR airstrike OR clashes OR shelling)");
LOADERS["GDELT احتجاجات"] = makeGdeltGeoLoader("GDELT احتجاجات", "protest", "(protest OR demonstration OR unrest OR riot)");

// USGS — زلازل
LOADERS.USGS = async () => {
  const data = await fetchJson(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
  );
  return data.features.map((f) => ({
    id: "q" + f.id,
    type: "quake",
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    mag: f.properties.mag,
    nomap: f.properties.mag < 3.5,
    title: `زلزال بقوة ${f.properties.mag}`,
    place: f.properties.place,
    time: f.properties.time,
    url: f.properties.url,
    src: "USGS",
    desc: `العمق ${Math.round(f.geometry.coordinates[2])} كم`,
  }));
};

// NASA EONET — كوارث طبيعية
LOADERS.EONET = async () => {
  const data = await fetchJson(
    "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200"
  );
  return data.events
    .map((e) => {
      const g = e.geometry[e.geometry.length - 1];
      if (!g || g.type !== "Point") return null;
      const cat = e.categories[0]?.title;
      return {
        id: "e" + e.id,
        type: "disaster",
        lon: g.coordinates[0],
        lat: g.coordinates[1],
        title: e.title,
        place: EO[cat] || cat,
        time: Date.parse(g.date),
        url: e.link,
        src: "NASA EONET",
        desc: "حدث طبيعي مفتوح: " + (EO[cat] || cat),
      };
    })
    .filter(Boolean);
};

// GDACS — تنبيهات الأمم المتحدة
LOADERS.GDACS = async () => {
  const doc = new DOMParser().parseFromString(
    await fetchText("https://www.gdacs.org/xml/rss.xml"),
    "text/xml"
  );
  return [...doc.querySelectorAll("item")]
    .map((el) => {
      const q = (tag) => el.getElementsByTagName(tag)[0]?.textContent || "";
      const lat = parseFloat(q("geo:lat"));
      const lon = parseFloat(q("geo:long"));
      if (isNaN(lat)) return null;
      return {
        id: "d" + q("guid") + q("title"),
        type: "disaster",
        lon,
        lat,
        title: strip(q("title")),
        place: q("gdacs:country"),
        time: when(q("pubDate")),
        url: q("link"),
        src: "GDACS (الأمم المتحدة)",
        desc: strip(q("description")),
      };
    })
    .filter(Boolean);
};

// أسماء المصادر السريعة/البطيئة
export const FAST_NAMES = [...FEEDS.map((f) => f[0]), "GDELT عربي", "GDELT English"];
export const SLOW_NAMES = ["USGS", "EONET", "GDACS", "GDELT صراعات", "GDELT احتجاجات"];

// تخزين نتيجة كل مصدر ثم استدعاء onRefresh بعد تجميع التحديثات
let onRefreshCallback = () => {};
export function setOnRefresh(fn) { onRefreshCallback = fn; }

function put(name, items) {
  const now = Date.now();
  items.forEach((i) => {
    if (!state.seen.has(i.id)) state.seen.set(i.id, state.ready ? now : 0);
  });
  state.by[name] = items;
  if (!state.refreshTimer) {
    state.refreshTimer = setTimeout(() => {
      state.refreshTimer = 0;
      onRefreshCallback();
    }, state.ready ? 2500 : 1500);
  }
}

// تشغيل مجموعة مصادر بالتوازي (4 عمال)
export async function runSources(names) {
  if (document.hidden && state.ready) return;
  let i = 0;
  const worker = async () => {
    while (i < names.length) {
      const name = names[i++];
      state.rd[name] = (state.rd[name] || 0) + 1;
      if ((state.fail[name] || 0) >= 3 && state.rd[name] % 8) continue;
      try {
        const items = await LOADERS[name]();
        state.st[name] = items.length;
        state.fail[name] = 0;
        put(name, items);
      } catch {
        state.st[name] = -1;
        state.fail[name] = (state.fail[name] || 0) + 1;
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
              }
