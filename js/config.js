// ===== الإعدادات =====
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

export const COLORS = {
  conflict: "#f43f5e",
  protest:  "#e879f9",
  quake:    "#f59e0b",
  disaster: "#14b8a6",
  news:     "#38bdf8",
  other:    "#a78bfa",
};

export const LAYERS = {
  conflict: "صراعات",
  protest:  "احتجاجات",
  quake:    "زلازل",
  disaster: "كوارث",
  news:     "أخبار",
  other:    "سياسة واقتصاد",
};

// استعلامات GDELT GEO — إحداثيات حقيقية من تحليل النصوص
export const GDELT_QUERIES = [
  { type: "conflict", q: "(war OR attack OR airstrike OR clashes OR shelling OR explosion)" },
  { type: "protest",  q: "(protest OR demonstration OR unrest OR riot)" },
  { type: "news",     q: "(breaking OR news OR crisis OR emergency)" },
  { type: "other",    q: "(election OR economy OR sanctions OR summit OR policy)" },
];

// مصادر دقيقة أصلاً (إحداثياتها حقيقية 100%)
export const SOURCES = {
  USGS: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
  EONET: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100",
};

// قنوات البث (YouTube)
export const TV = [
  { name: "الجزيرة", id: "UCfiwzLy-8yKzIbsmZTzxDgw" },
  { name: "العربية", id: "UCahpxixMCwoANAftn6IxkTg" },
  { name: "الحدث", id: "UCrj5BGAhtWxDfqbza9T9hqA" },
  { name: "Al Jazeera English", id: "UCNye-wNBqNL5ZzHSJj3l8Bg" },
  { name: "Sky News", id: "UCoMdktPbSTixAyNGwb-UYkQ" },
  { name: "France 24", id: "UCQfwfsi5VrQ8yKZ-UWmAEFg" },
  { name: "DW News", id: "UCknLrEdhRCp1aegoMqRaCZg" },
  { name: "Euronews", id: "UCSrZ3UV4jOidv8ppoVuvW9Q" },
];

export const REFRESH_MS = 120000; // كل دقيقتين
