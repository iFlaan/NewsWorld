import { MAP_STYLE, COLORS, LAYERS } from "./config.js";

let map;
let onFeatureClick = null;
const popup = new maplibregl.Popup({
  closeButton: true,
  closeOnClick: true,
  maxWidth: "320px",
  offset: 12,
});

export function initMap(callback) {
  onFeatureClick = callback;

  map = new maplibregl.Map({
    container: "map",
    style: MAP_STYLE,
    center: [20, 25],
    zoom: 2,
    minZoom: 1.2,
    maxZoom: 12,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
  });

  map.on("load", () => {
    addEventLayers();
    bindClicks();
  });

  return map;
}

function addEventLayers() {
  // مصدر GeoJSON موحّد لكل الأحداث
  map.addSource("events", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 8,
    clusterRadius: 50,
  });

  // دوائر التجميع
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "events",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#38bdf8",
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 50, 28],
      "circle-opacity": 0.85,
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.25)",
    },
  });

  // عدد النقاط داخل التجميع
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "events",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: { "text-color": "#020617" },
  });

  // النقاط الفردية (ألوان حسب النوع)
  map.addLayer({
    id: "unclustered",
    type: "circle",
    source: "events",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "match", ["get", "type"],
        "conflict", COLORS.conflict,
        "protest", COLORS.protest,
        "quake", COLORS.quake,
        "disaster", COLORS.disaster,
        "news", COLORS.news,
        COLORS.other,
      ],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 8, 9],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(255,255,255,0.6)",
      "circle-opacity": 0.92,
    },
  });

  // تأثير التوهج للنقاط الجديدة
  map.addLayer({
    id: "glow",
    type: "circle",
    source: "events",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#38bdf8",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 12, 8, 24],
      "circle-opacity": 0.12,
      "circle-blur": 1,
    },
  });
}

function bindClicks() {
  // النقر على نقطة فردية
  map.on("click", "unclustered", (e) => {
    const f = e.features[0];
    const p = f.properties;
    const coords = f.geometry.coordinates.slice();
    popup
      .setLngLat(coords)
      .setHTML(`
        <div style="font-family:Cairo,sans-serif">
          <strong style="display:block;margin-bottom:6px;font-size:14px">${p.title || "حدث"}</strong>
          <div style="color:#94a3b8;font-size:12px;margin-bottom:8px">
            ${p.place || ""} ${p.time ? "· " + new Date(+p.time).toLocaleString("ar") : ""}
          </div>
          ${p.desc ? `<div style="font-size:12px;color:#cbd5e1;margin-bottom:8px">${p.desc}</div>` : ""}
          ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="color:#38bdf8;font-size:12px">فتح المصدر ↗</a>` : ""}
        </div>
      `)
      .addTo(map);

    if (onFeatureClick) onFeatureClick(p);
  });

  // النقر على تجميع → تكبير
  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource("events").getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5 });
    });
  });

  map.on("mouseenter", "unclustered", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "unclustered", () => (map.getCanvas().style.cursor = ""));
}

// تحديث بيانات الخريطة
export function setEvents(features) {
  const src = map.getSource("events");
  if (src) src.setData({ type: "FeatureCollection", features });
}

// تركيز الخريطة على موقع
export function flyTo(lon, lat, zoom = 6) {
  map.flyTo({ center: [lon, lat], zoom, essential: true });
}

export { map };
