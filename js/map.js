import { COLORS, LAYERS, MAP_STYLE } from "./config.js";
import { esc, safeUrl } from "./utils.js";

let map;
let onFeatureClick = null;
let pendingFeatures = [];
let popup;

export function initMap(callback) {
  if (!window.maplibregl) throw new Error("مكتبة MapLibre غير متاحة");
  onFeatureClick = callback;
  popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: "340px",
    offset: 14,
  });
  map = new maplibregl.Map({
    container: "map",
    style: MAP_STYLE,
    center: [18, 23],
    zoom: 2,
    minZoom: 1.2,
    maxZoom: 12,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    cooperativeGestures: true,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

  map.on("load", () => {
    addEventLayers();
    bindClicks();
    setEvents(pendingFeatures);
    document.dispatchEvent(new CustomEvent("newsworld:mapready"));
  });

  map.on("error", (event) => {
    if (event?.error) console.warn("MapLibre:", event.error.message || event.error);
  });
  return map;
}

function addEventLayers() {
  map.addSource("events", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 8,
    clusterRadius: 46,
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "events",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#d94b5b",
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 21, 50, 29],
      "circle-opacity": 0.9,
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.48)",
    },
  });
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
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: "unclustered",
    type: "circle",
    source: "events",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["match", ["get", "type"],
        "conflict", COLORS.conflict,
        "protest", COLORS.protest,
        "quake", COLORS.quake,
        "disaster", COLORS.disaster,
        "news", COLORS.news,
        COLORS.other,
      ],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4.5, 8, 9],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "rgba(255,255,255,0.72)",
      "circle-opacity": 0.94,
    },
  });
  map.addLayer({
    id: "glow",
    type: "circle",
    source: "events",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#d94b5b",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 12, 8, 22],
      "circle-opacity": 0.11,
      "circle-blur": 1,
    },
  });
}

function popupMarkup(properties) {
  const link = safeUrl(properties.url);
  const time = properties.time ? new Date(Number(properties.time)).toLocaleString("ar") : "";
  return `
    <article class="map-popup" dir="rtl">
      <span class="map-popup-kicker">${esc(LAYERS[properties.type] || "حدث جغرافي")}</span>
      <strong>${esc(properties.title || "حدث")}</strong>
      <span class="map-popup-meta">${esc(properties.place || "")}${time ? ` · ${esc(time)}` : ""}</span>
      ${properties.desc ? `<p>${esc(properties.desc)}</p>` : ""}
      <span class="map-popup-source">${esc(properties.src || "مصدر غير محدد")}</span>
      ${link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">فتح المصدر الأصلي ↗</a>` : ""}
    </article>`;
}

function bindClicks() {
  map.on("click", "unclustered", (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    popup.setLngLat(feature.geometry.coordinates.slice()).setHTML(popupMarkup(feature.properties)).addTo(map);
    onFeatureClick?.(feature.properties);
  });

  map.on("click", "clusters", (event) => {
    const cluster = map.queryRenderedFeatures(event.point, { layers: ["clusters"] })[0];
    if (!cluster) return;
    map.getSource("events").getClusterExpansionZoom(cluster.properties.cluster_id, (error, zoom) => {
      if (!error) map.easeTo({ center: cluster.geometry.coordinates, zoom: zoom + 0.4 });
    });
  });

  map.on("mouseenter", "unclustered", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "unclustered", () => { map.getCanvas().style.cursor = ""; });
  map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
}

export function setEvents(features) {
  pendingFeatures = Array.isArray(features) ? features : [];
  const source = map?.getSource("events");
  if (source) source.setData({ type: "FeatureCollection", features: pendingFeatures });
}

export function flyTo(longitude, latitude, zoom = 6) {
  if (!map || !Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))) return;
  map.flyTo({ center: [Number(longitude), Number(latitude)], zoom, essential: true, duration: 850 });
}

export { map };
