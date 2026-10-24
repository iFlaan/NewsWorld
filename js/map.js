import { WORLD_URL, L } from "./config.js";
import { state, isFresh } from "./state.js";

const W = 960, H = 500;
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
const zi = document.getElementById("zi");
const zo = document.getElementById("zo");
const zr = document.getElementById("zr");

let LAND = null;
let GRAT = null;
const proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
const path = d3.geoPath(proj);

const COL = {};
const M = { b: 1, dpr: 1, w: W, h: H };
const tr = { x: 0, y: 0, k: 1 };
let pts = [];
let raf = 0;
let onPickCallback = null;

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const radiusOf = (i) =>
  i.type === "quake" ? Math.min(2.5 + i.mag * 0.8, 11)
  : i.type === "conflict" ? 5.5
  : 4;

const visible = () => state.items.filter((i) => state.on.has(i.type));

export function needPaint() {
  if (!raf) raf = requestAnimationFrame(paint);
}

function paint() {
  raf = 0;
  if (!LAND) return; // لم تُحمَّل البيانات بعد
  if (!COL.land) {
    COL.land = css("--land");
    COL.sea = css("--sea");
    COL.bd = css("--bd");
    COL.ln = css("--ln");
  }
  const s = M.dpr * M.b * tr.k;
  const q = 1 / (M.b * tr.k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COL.sea;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(s, 0, 0, s, M.dpr * tr.x, M.dpr * tr.y);
  ctx.lineWidth = 0.3 * q;
  ctx.strokeStyle = COL.ln;
  ctx.stroke(GRAT);
  ctx.fillStyle = COL.land;
  ctx.fill(LAND);
  ctx.strokeStyle = COL.bd;
  ctx.lineWidth = 0.5 * q;
  ctx.stroke(LAND);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = q;
  for (const i of pts) {
    const r = i.r * q;
    const c = L[i.type][1];
    ctx.beginPath();
    ctx.arc(i.px, i.py, r, 0, 6.2832);
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = c;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    if (i.fr) {
      ctx.beginPath();
      ctx.arc(i.px, i.py, r * 2.3, 0, 6.2832);
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.6 * q;
      ctx.stroke();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = q;
    }
  }
}

function size() {
  M.dpr = Math.min(devicePixelRatio || 1, 1.5);
  M.w = cv.clientWidth || W;
  M.h = (M.w * H) / W;
  M.b = M.w / W;
  cv.width = Math.round(M.w * M.dpr);
  cv.height = Math.round(M.h * M.dpr);
  zoom.extent([[0, 0], [M.w, M.h]]).translateExtent([[0, 0], [M.w, M.h]]);
  needPaint();
}

const zoom = d3
  .zoom()
  .scaleExtent([1, 14])
  .on("zoom", (e) => {
    tr.x = e.transform.x;
    tr.y = e.transform.y;
    tr.k = e.transform.k;
    needPaint();
  });
const cs = d3.select(cv);
cs.call(zoom);

export function draw() {
  if (!LAND) return;
  pts = visible().filter((i) => i.lon != null && !i.nomap);
  for (const i of pts) {
    if (i.px == null) {
      const p = proj([i.lon, i.lat]);
      if (!p || isNaN(p[0])) {
        i.lon = null;
        continue;
      }
      i.px = p[0];
      i.py = p[1];
      i.r = radiusOf(i);
    }
    i.fr = isFresh(i);
  }
  pts = pts.filter((i) => i.lon != null).sort((a, b) => b.r - a.r);
  needPaint();
}

function hitAt(mx, my) {
  let best = null;
  let bestDist = Infinity;
  for (const i of pts) {
    const dx = tr.x + tr.k * M.b * i.px - mx;
    const dy = tr.y + tr.k * M.b * i.py - my;
    const d = dx * dx + dy * dy;
    const m = Math.max(i.r, 9) + 5;
    if (d < m * m && d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function attachHandlers() {
  cv.addEventListener("click", (e) => {
    const r = cv.getBoundingClientRect();
    const hit = hitAt(e.clientX - r.left, e.clientY - r.top);
    if (hit && onPickCallback) onPickCallback(hit);
  });
  let lastMove = 0;
  cv.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastMove < 80) return;
    lastMove = now;
    const r = cv.getBoundingClientRect();
    const hit = hitAt(e.clientX - r.left, e.clientY - r.top);
    cv.title = hit ? hit.title : "";
    cv.style.cursor = hit ? "pointer" : "grab";
  });
}

export function focusOn(item) {
  if (item.lon == null || item.px == null) return;
  const k = Math.max(tr.k, 3.5);
  cs.transition()
    .duration(500)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(M.w / 2 - k * M.b * item.px, M.h / 2 - k * M.b * item.py)
        .scale(k)
    );
}

export async function initMap(onPick) {
  onPickCallback = onPick;

  const world = await fetch(WORLD_URL).then((r) => r.json());
  LAND = new Path2D(path(topojson.feature(world, world.objects.countries)));
  GRAT = new Path2D(path(d3.geoGraticule10()));

  attachHandlers();
  zi.onclick = () => cs.transition().call(zoom.scaleBy, 1.7);
  zo.onclick = () => cs.transition().call(zoom.scaleBy, 1 / 1.7);
  zr.onclick = () => cs.transition().call(zoom.transform, d3.zoomIdentity);

  if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
  else addEventListener("resize", size);
  size();
    } 
