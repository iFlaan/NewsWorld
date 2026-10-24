// جميع الإعدادات الثابتة في مكان واحد.
// عدّل هنا فقط عند إضافة مصدر أو قناة أو تغيير سرعة التحديث.

export const FEEDS = [
  ["الجزيرة نت", "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9", "https://www.aljazeera.net"],
  ["BBC عربي", "https://feeds.bbci.co.uk/arabic/rss.xml", "https://www.bbc.com/arabic"],
  ["فرانس 24 عربي", "https://www.france24.com/ar/rss", "https://www.france24.com/ar"],
  ["سكاي نيوز عربية", "https://www.skynewsarabia.com/web/rss", "https://www.skynewsarabia.com"],
  ["العربية.نت", "https://www.alarabiya.net/feed/rss2/ar.xml", "https://www.alarabiya.net"],
  ["RT عربي", "https://arabic.rt.com/rss/", "https://arabic.rt.com"],
  ["DW عربي", "https://rss.dw.com/xml/rss-ar-all", "https://www.dw.com/ar"],
  ["CNN بالعربية", "https://arabic.cnn.com/api/v1/rss/rss.xml", "https://arabic.cnn.com"],
  ["الشرق الأوسط", "https://aawsat.com/feed", "https://aawsat.com"],
  ["عربي21", "https://arabi21.com/rss", "https://arabi21.com"],
  ["TRT عربي", "https://www.trtarabi.com/rss", "https://www.trtarabi.com"],
  ["يورونيوز عربي", "https://arabic.euronews.com/rss?format=mrss", "https://arabic.euronews.com"],
  ["الأناضول", "https://www.aa.com.tr/ar/rss/default?cat=guncel", "https://www.aa.com.tr/ar"],
  ["أخبار الأمم المتحدة", "https://news.un.org/feed/subscribe/ar/news/all/rss.xml", "https://news.un.org/ar"],
  ["اليوم السابع", "https://www.youm7.com/rss/SectionRss?SectionID=65", "https://www.youm7.com"],
  ["Al Jazeera English", "https://www.aljazeera.com/xml/rss/all.xml", "https://www.aljazeera.com"],
  ["BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml", "https://www.bbc.com/news/world"],
  ["The Guardian", "https://www.theguardian.com/world/rss", "https://www.theguardian.com/world"],
  ["NYT World", "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "https://www.nytimes.com/section/world"],
  ["Sky News", "https://feeds.skynews.com/feeds/rss/world.xml", "https://news.sky.com/world"],
  ["France 24 EN", "https://www.france24.com/en/rss", "https://www.france24.com/en"],
  ["DW English", "https://rss.dw.com/rdf/rss-en-all", "https://www.dw.com/en"],
  ["NPR World", "https://feeds.npr.org/1004/rss.xml", "https://www.npr.org/sections/world"],
  ["CBS World", "https://www.cbsnews.com/latest/rss/world", "https://www.cbsnews.com/world"],
  ["ABC News", "https://abcnews.go.com/abcnews/internationalheadlines", "https://abcnews.go.com/International"],
  ["Euronews", "https://www.euronews.com/rss?format=mrss", "https://www.euronews.com"],
  ["Africanews", "https://www.africanews.com/feed/rss", "https://www.africanews.com"],
  ["SCMP", "https://www.scmp.com/rss/91/feed", "https://www.scmp.com"],
  ["Straits Times", "https://www.straitstimes.com/news/world/rss.xml", "https://www.straitstimes.com"],
];

export const TV = [
  { n: "الجزيرة", id: "UCfiwzLy-8yKzIbsmZTzxDgw" },
  { n: "العربية", id: "UCahpxixMCwoANAftn6IxkTg" },
  { n: "الحدث", id: "UCrj5BGAhtWxDfqbza9T9hqA" },
  { n: "Al Jazeera English", id: "UCNye-wNBqNL5ZzHSJj3l8Bg" },
  { n: "Sky News", id: "UCoMdktPbSTixAyNGwb-UYkQ" },
  { n: "France 24", id: "UCQfwfsi5VrQ8yKZ-UWmAEFg" },
  { n: "DW News", id: "UCknLrEdhRCp1aegoMqRaCZg" },
  { n: "Euronews", id: "UCSrZ3UV4jOidv8ppoVuvW9Q" },
];

// مصادر بيانات العالم (TopoJSON) — يمكن استبدالها بملف محلي: './data/world.json'
export const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// فترات التحديث (بالميلي ثانية)
export const FAST = 120000;  // الأخبار كل دقيقتين
export const SLOW = 300000;  // الأحداث كل 5 دقائق

// أنواع الطبقات وألوانها
export const L = {
  conflict: ["صراعات", "#e5484d"],
  protest:  ["احتجاجات", "#e255a8"],
  quake:    ["زلازل", "#f5a524"],
  disaster: ["كوارث", "#17a2a2"],
  news:     ["أخبار", "#3e8bff"],
  other:    ["سياسة واقتصاد", "#a46bff"],
};

// كلمات مفتاحية لاستنتاج موقع الخبر من العنوان
export const GEO = [
  ["غزة|gaza", 34.45, 31.4],
  ["فلسطين|palestin|الضفة|west bank", 35.2, 31.9],
  ["إسرائيل|israel", 34.8, 31.5],
  ["لبنان|leban", 35.8, 33.9],
  ["سوريا|syria", 38.5, 35],
  ["العراق|iraq", 44, 33],
  ["إيران|iran", 53, 32],
  ["اليمن|yemen|الحوثي", 44.2, 15.4],
  ["السعودية|saudi", 45, 24],
  ["مصر|egypt", 30, 27],
  ["ليبيا|libya", 17, 27],
  ["السودان|sudan", 30, 15],
  ["الصومال|somalia", 46, 5],
  ["أوكرانيا|ukrain", 31.5, 49],
  ["روسيا|russia|موسكو|putin|بوتين", 37.6, 55.7],
  ["الصين|china|بكين", 104, 35],
  ["تايوان|taiwan", 121, 23.7],
  ["الولايات المتحدة|أمريكا|ترامب|trump|u\\.s\\.|washington", -97, 38],
  ["بريطانيا|britain|london|لندن", -0.1, 51.5],
  ["فرنسا|france|باريس", 2.3, 48.8],
  ["ألمانيا|german", 10, 51],
  ["تركيا|turkey|türkiye", 35, 39],
  ["الهند|india", 78, 22],
  ["باكستان|pakistan", 69, 30],
  ["أفغانستان|afghan", 66, 34],
  ["كوريا|korea", 127, 37],
  ["اليابان|japan", 138, 36],
  ["إثيوبيا|ethiopia", 40, 9],
  ["نيجيريا|nigeria", 8, 9],
  ["الكونغو|congo", 23, -3],
  ["مالي|mali\\b", -4, 17],
  ["هايتي|haiti", -72.3, 18.9],
  ["فنزويلا|venezuela", -66, 7],
  ["المكسيك|mexico", -102, 23],
  ["البرازيل|brazil", -52, -10],
  ["الأردن|jordan", 36, 31],
  ["قطر|qatar", 51.2, 25.3],
  ["الإمارات|emirates|\\buae\\b", 54, 24],
  ["الجزائر|algeria", 3, 28],
  ["المغرب|morocco", -6, 32],
  ["تونس|tunisia", 9, 34],
  ["ميانمار|myanmar", 96, 21],
  ["أستراليا|australia", 134, -25],
  ["كندا|canada", -100, 56],
].map(([p, lon, lat]) => [new RegExp(p, "i"), lon, lat]);

// بؤر ثابتة (نقاط مرجعية دائمة على الخريطة)
export const BASE = [
  ["أوكرانيا", 31.5, 49, "conflict", "الحرب الروسية الأوكرانية"],
  ["غزة", 34.45, 31.4, "conflict", "الصراع في غزة"],
  ["السودان", 32.5, 15.6, "conflict", "الحرب في السودان"],
  ["شرق الكونغو", 28.8, -1.7, "conflict", "نزاع شرق الكونغو"],
  ["ميانمار", 96, 21, "conflict", "النزاع في ميانمار"],
  ["الساحل", -1.5, 15, "conflict", "عدم الاستقرار في الساحل"],
  ["اليمن", 44.2, 15.4, "conflict", "الأزمة اليمنية"],
  ["هايتي", -72.3, 18.9, "conflict", "انفلات أمني في هايتي"],
  ["الصومال", 45.3, 2, "conflict", "التمرد المسلح في الصومال"],
  ["واشنطن", -77, 38.9, "other", "مركز القرار السياسي الأمريكي"],
  ["بروكسل", 4.35, 50.85, "other", "الاتحاد الأوروبي"],
  ["بكين", 116.4, 39.9, "other", "الاقتصاد الصيني"],
  ["نيويورك", -74, 40.7, "other", "الأسواق المالية"],
  ["الرياض", 46.7, 24.7, "other", "الطاقة والنفط"],
].map((b, i) => ({
  id: "b" + i,
  type: b[3],
  lon: b[1],
  lat: b[2],
  title: b[4],
  place: b[0],
  desc: "بؤرة ثابتة ضمن الخلفية، والأحداث الحية تظهر في القوائم.",
  src: "خلفية ثابتة",
}));

// ترجمة فئات NASA EONET
export const EO = {
  Wildfires: "حرائق",
  "Severe Storms": "عواصف",
  Volcanoes: "براكين",
  Floods: "فيضانات",
  Drought: "جفاف",
  Landslides: "انهيارات أرضية",
  "Sea and Lake Ice": "جليد",
  "Dust and Haze": "غبار",
  Snow: "ثلوج",
  "Temperature Extremes": "حرارة شديدة",
  Earthquakes: "زلازل",
  Manmade: "حدث بشري",
};
