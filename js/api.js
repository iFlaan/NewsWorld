import { GDELT_QUERIES, SOURCES } from "./config.js";

// جلب GeoJSON من GDELT GEO API 2.0 — إحداثيات حقيقية
async function fetchGdeltGeo(query, type) {
  const url =
    "https://api.gdeltproject.org/api/v2/geo/geo?" +
    new URLSearchParams({
      query,
      format: "geojson",
      timespan: "1d",
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error("GDELT GEO failed");
  const data = await res.json();

  return (data.features || []).map((f) => ({
    type: "Feature",
    geometry: f.geometry, // إحداثيات دقيقة من GDELT
    properties: {
      id: "g" + type + f.properties.name,
      type,
      title: f.properties.name || "حدث",
      place: f.properties.name || "",
      desc: `إشارات إخبارية: ${f.properties.count || 0}`,
      url: "https://www.gdeltproject.org",
      time: Date.now(),
      src: "GDELT GEO",
    },
  }));
}

// USGS — زلازل (إحداثيات دقيقة)
async function fetchUSGS() {
  const res = await fetch(SOURCES.USGS);
  const data = await res.json();
  return data.features.map((f) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      id: "q" + f.id,
      type: "quake",
      title: `زلزال بقوة ${f.properties.mag}`,
      place: f.properties.place,
      desc: `العمق: ${Math.round(f.geometry.coordinates[2])} كم`,
      url: f.properties.url,
      time: f.properties.time,
      mag: f.properties.mag,
      src: "USGS",
    },
  }));
}

// NASA EONET — كوارث طبيعية (إحداثيات دقيقة)
async function fetchEONET() {
  const res = await fetch(SOURCES.EONET);
  const data = await res.json();
  return data.events
    .map((e) => {
      const g = e.geometry[e.geometry.length - 1];
      if (!g || g.type !== "Point") return null;
      return {
        type: "Feature",
        geometry: g,
        properties: {
          id: "e" + e.id,
          type: "disaster",
          title: e.title,
          place: e.categories[0]?.title || "كارثة طبيعية",
          desc: "حدث طبيعي مفتوح",
          url: e.link,
          time: Date.parse(g.date),
          src: "NASA EONET",
        },
      };
    })
    .filter(Boolean);
}

// جلب كل الأحداث بالتوازي
export async function fetchAllEvents() {
  const tasks = [
    ...GDELT_QUERIES.map((q) => fetchGdeltGeo(q.q, q.type)),
    fetchUSGS(),
    fetchEONET(),
  ];

  const results = await Promise.allSettled(tasks);
  const features = [];
  const status = {};

  results.forEach((r, i) => {
    const name = i < GDELT_QUERIES.length ? "GDELT " + GDELT_QUERIES[i].type : (i === GDELT_QUERIES.length ? "USGS" : "NASA");
    if (r.status === "fulfilled") {
      features.push(...r.value);
      status[name] = r.value.length;
    } else {
      status[name] = -1;
    }
  });

  return { features, status };
}
