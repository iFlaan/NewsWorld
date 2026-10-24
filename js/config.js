// ===== إعدادات NewsWorld =====
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

export const COLORS = {
  conflict: "#f05262",
  protest: "#c27cf2",
  quake: "#f4aa53",
  disaster: "#42b8a8",
  news: "#63b8ef",
  other: "#8e9ef4",
};

export const LAYERS = {
  conflict: "تغطية النزاعات",
  protest: "تغطية الاحتجاجات",
  quake: "زلازل",
  disaster: "كوارث طبيعية",
  news: "تغطية خبرية",
  other: "سياسة واقتصاد",
};

// خلاصة كل ناشر هي المرجع؛ لا تُعرض مواد تجريبية في حال تعذر الوصول إليها.
export const FEEDS = [
  {
    key: "aljazeera",
    name: "الجزيرة",
    url: "https://www.aljazeera.net/rss",
    site: "https://www.aljazeera.net/",
  },
  {
    key: "alarabiya",
    name: "العربية",
    url: "https://www.alarabiya.net/feed/rss2/ar/arab-and-world.xml",
    site: "https://www.alarabiya.net/",
  },
  {
    key: "bbc",
    name: "بي بي سي عربي",
    url: "https://feeds.bbci.co.uk/arabic/rss.xml",
    site: "https://www.bbc.com/arabic",
  },
  {
    key: "france24",
    name: "فرانس 24 عربي",
    url: "https://www.france24.com/ar/rss",
    site: "https://www.france24.com/ar/",
  },
];

// هذه استعلامات رصد جغرافي لتغطية المصادر الإخبارية، وليست سجلاً شاملاً للأحداث.
export const GDELT_QUERIES = [
  { type: "conflict", q: "(war OR attack OR airstrike OR clashes OR shelling OR explosion)" },
  { type: "protest", q: "(protest OR demonstration OR unrest OR riot)" },
  { type: "news", q: "(breaking OR news OR crisis OR emergency)" },
  { type: "other", q: "(election OR economy OR sanctions OR summit OR policy)" },
];

export const SOURCES = {
  USGS: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
  EONET: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100",
  GDELT_DOC: "https://api.gdeltproject.org/api/v2/doc/doc",
  GDELT_GEO: "https://api.gdeltproject.org/api/v2/geo/geo",
};

// روابط تضمين YouTube لقنواتها الرسمية مع صفحات المشاهدة الرسمية كبديل.
export const TV = [
  {
    name: "الجزيرة",
    id: "UCfiwzLy-8yKzIbsmZTzxDgw",
    officialUrl: "https://www.aljazeera.net/video/live",
    youtubeUrl: "https://www.youtube.com/@aljazeera/live",
  },
  {
    name: "العربية",
    id: "UCahpxixMCwoANAftn6IxkTg",
    officialUrl: "https://www.alarabiya.net/live-stream",
    youtubeUrl: "https://www.youtube.com/@AlArabiya/live",
  },
  {
    name: "الحدث",
    id: "UCrj5BGAhtWxDfqbza9T9hqA",
    officialUrl: "https://www.alhadath.net/live-stream",
    youtubeUrl: "https://www.youtube.com/@AlHadath/live",
  },
];

export const NEWS_REFRESH_MS = 120000;
export const EVENTS_REFRESH_MS = 300000;
export const MAX_NEWS_ITEMS = 180;
