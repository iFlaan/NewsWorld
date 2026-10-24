import { FEEDS, GDELT_QUERIES, MAX_NEWS_ITEMS, SOURCES } from "./config.js";
import { hash, parseTimestamp, safeUrl, strip } from "./utils.js";

const REQUEST_TIMEOUT_MS = 9000;

function timeoutSignal(timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchText(url, timeout = REQUEST_TIMEOUT_MS) {
  const timer = timeoutSignal(timeout);
  try {
    const response = await fetch(url, {
      signal: timer.signal,
      credentials: "omit",
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    if (!body || !/<(?:rss|feed|rdf:RDF)\b/i.test(body)) throw new Error("الرد ليس XML لخلاصة RSS/Atom");
    return body;
  } finally {
    timer.clear();
  }
}

async function fetchReaderXml(url) {
  const original = new URL(url);
  const readerUrl = `https://r.jina.ai/http://${original.host}${original.pathname}${original.search}`;
  const timer = timeoutSignal(12000);
  try {
    const response = await fetch(readerUrl, {
      signal: timer.signal,
      credentials: "omit",
      headers: {
        Accept: "text/html",
        "X-Respond-With": "html",
        "X-Cache-Tolerance": "90",
      },
    });
    if (!response.ok) throw new Error(`وسيط القراءة HTTP ${response.status}`);
    const body = await response.text();
    if (/captcha|just a moment|complete the security check/i.test(body)) {
      throw new Error("الناشر يطلب تحققاً أمنياً للوصول إلى الخلاصة");
    }
    if (!/<(?:rss|feed|rdf:RDF)\b/i.test(body)) throw new Error("وسيط القراءة لم يُعد XML للخلاصة");
    return body;
  } finally {
    timer.clear();
  }
}

async function fetchReaderMarkdown(url) {
  const original = new URL(url);
  const readerUrl = `https://r.jina.ai/http://${original.host}${original.pathname}${original.search}`;
  const timer = timeoutSignal(12000);
  try {
    const response = await fetch(readerUrl, {
      signal: timer.signal,
      credentials: "omit",
      headers: { Accept: "text/plain", "X-Cache-Tolerance": "90" },
    });
    if (!response.ok) throw new Error(`وسيط القراءة HTTP ${response.status}`);
    const body = await response.text();
    if (/captcha|just a moment|complete the security check/i.test(body)) {
      throw new Error("الناشر يطلب تحققاً أمنياً للوصول إلى الخلاصة");
    }
    return body;
  } finally {
    timer.clear();
  }
}

async function fetchJson(url, timeout = REQUEST_TIMEOUT_MS) {
  const timer = timeoutSignal(timeout);
  try {
    const response = await fetch(url, {
      signal: timer.signal,
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    timer.clear();
  }
}

function xmlText(parent, selectors) {
  for (const selector of selectors) {
    const node = parent.querySelector(selector);
    if (node) return node.textContent?.trim() || "";
  }
  return "";
}

function xmlLink(node) {
  const link = node.querySelector("link");
  if (link?.getAttribute("href")) return link.getAttribute("href");
  if (link?.textContent?.trim()) return link.textContent.trim();
  const guid = node.querySelector("guid");
  return guid?.textContent?.trim() || "";
}

function parseFeed(xmlTextContent, feed) {
  const xml = new DOMParser().parseFromString(xmlTextContent, "application/xml");
  if (xml.querySelector("parsererror")) throw new Error("تعذر تحليل XML");

  const nodes = [...xml.querySelectorAll("item, entry")];
  return nodes.map((node) => {
    const title = strip(xmlText(node, ["title"]));
    const url = safeUrl(xmlLink(node));
    const summary = strip(xmlText(node, ["description", "summary", "content\\:encoded", "content"]));
    const rawTime = xmlText(node, ["pubDate", "published", "updated", "dc\\:date"]);
    const time = parseTimestamp(rawTime);
    if (!title || !url) return null;

    return {
      id: `rss-${feed.key}-${hash(`${url}|${title}`)}`,
      title,
      summary,
      url,
      time,
      source: feed.name,
      sourceKey: feed.key,
      sourceUrl: feed.site,
      image: "",
      type: "news",
      language: "ar",
    };
  }).filter(Boolean);
}

function parseReaderMarkdown(markdown, feed) {
  const lines = markdown.split(/\r?\n/);
  const items = [];
  const headingPattern = /^#{2,4}\s+\[(.*?)\]\((https?:\/\/[^)]+)\)/;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].trim().match(headingPattern);
    const title = strip((match?.[1] || "").replace(/\\([\\`*_{}\[\]()#+.!|>])/g, "$1"));
    const url = safeUrl(match?.[2] || "");
    if (!title || !url) continue;

    const detail = [];
    let time = 0;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor].trim();
      if (/^#{2,4}\s/.test(line) || line === "---") break;
      if (!line) continue;
      if (/^\[https?:\/\//i.test(line)) continue;
      const parsedTime = parseTimestamp(line);
      if (!time && parsedTime) {
        time = parsedTime;
        continue;
      }
      detail.push(line);
    }

    const summary = strip(detail.join(" ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`#]/g, " "));
    items.push({
      id: `reader-${feed.key}-${hash(`${url}|${title}`)}`,
      title,
      summary,
      url,
      time,
      source: feed.name,
      sourceKey: feed.key,
      sourceUrl: feed.site,
      image: "",
      type: "news",
      language: "ar",
    });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const xml = await fetchText(feed.url);
    const parsed = parseFeed(xml, feed);
    if (parsed.length) return parsed.slice(0, MAX_NEWS_ITEMS);
  } catch (error) {
    console.info(`${feed.name}: direct RSS unavailable; trying raw reader relay.`, error.message);
  }
  try {
    const xml = await fetchReaderXml(feed.url);
    const parsed = parseFeed(xml, feed);
    if (parsed.length) return parsed.slice(0, MAX_NEWS_ITEMS);
  } catch (error) {
    console.info(`${feed.name}: raw reader relay unavailable; trying Markdown fallback.`, error.message);
  }
  const markdown = await fetchReaderMarkdown(feed.url);
  const parsed = parseReaderMarkdown(markdown, feed);
  if (!parsed.length) throw new Error("لم يتضمن رد الناشر عناوين قابلة للقراءة");
  return parsed.slice(0, MAX_NEWS_ITEMS);
}

async function fetchGdeltArticles() {
  const url = new URL(SOURCES.GDELT_DOC);
  url.search = new URLSearchParams({
    query: "sourcelang:Arabic OR sourcelang:English",
    mode: "ArtList",
    format: "json",
    maxrecords: "50",
    timespan: "24h",
    sort: "HybridRel",
  }).toString();
  const data = await fetchJson(url.toString(), 12000);
  return (data.articles || []).map((article) => {
    const link = safeUrl(article.url);
    const title = strip(article.title);
    if (!link || !title) return null;
    const domain = String(article.domain || new URL(link).hostname).replace(/^www\./, "");
    return {
      id: `gdelt-${hash(`${link}|${title}`)}`,
      title,
      summary: "",
      url: link,
      time: parseTimestamp(article.seendate),
      source: `GDELT · ${domain}`,
      sourceKey: "gdelt",
      sourceUrl: `https://${domain}`,
      image: safeUrl(article.socialimage || ""),
      type: "news",
      language: article.language || "",
    };
  }).filter(Boolean);
}

function dedupeArticles(items) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  return items
    .sort((a, b) => (b.time || 0) - (a.time || 0))
    .filter((item) => {
      const urlKey = item.url.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
      const titleKey = item.title.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
      if (seenUrls.has(urlKey) || (titleKey && seenTitles.has(titleKey))) return false;
      seenUrls.add(urlKey);
      if (titleKey) seenTitles.add(titleKey);
      return true;
    })
    .slice(0, MAX_NEWS_ITEMS);
}

export async function fetchNews() {
  const [feeds, gdelt] = await Promise.all([
    Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed))),
    Promise.allSettled([fetchGdeltArticles()]),
  ]);
  const articles = [];
  const status = {};

  feeds.forEach((result, index) => {
    const feed = FEEDS[index];
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      status[feed.key] = { label: feed.name, count: result.value.length, ok: true };
    } else {
      status[feed.key] = { label: feed.name, count: 0, ok: false, error: result.reason?.message || "تعذر الجلب" };
    }
  });

  if (gdelt[0].status === "fulfilled") {
    articles.push(...gdelt[0].value);
    status.gdelt = { label: "GDELT", count: gdelt[0].value.length, ok: true };
  } else {
    status.gdelt = { label: "GDELT", count: 0, ok: false, error: gdelt[0].reason?.message || "تعذر الجلب" };
  }

  return { articles: dedupeArticles(articles), status };
}

async function fetchGdeltGeo(query, type) {
  const url = new URL(SOURCES.GDELT_GEO);
  url.search = new URLSearchParams({ query, format: "geojson", timespan: "1d" }).toString();
  const data = await fetchJson(url.toString(), 12000);
  return (data.features || []).filter((feature) => feature.geometry?.type === "Point").map((feature) => {
    const properties = feature.properties || {};
    const title = strip(properties.name || "موقع تغطية إخبارية");
    return {
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        id: `gdelt-geo-${type}-${hash(title)}`,
        type,
        title,
        place: title,
        desc: `مؤشر تغطية إعلامية · ${Number(properties.count) || 0} إشارة خلال 24 ساعة`,
        url: "https://www.gdeltproject.org/",
        time: Date.now(),
        src: "GDELT · رصد التغطية",
      },
    };
  });
}

async function fetchUSGS() {
  const data = await fetchJson(SOURCES.USGS);
  return (data.features || []).map((feature) => ({
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      id: `usgs-${feature.id}`,
      type: "quake",
      title: `زلزال بقوة ${feature.properties.mag}`,
      place: feature.properties.place,
      desc: `العمق: ${Math.round(feature.geometry.coordinates[2])} كم`,
      url: safeUrl(feature.properties.url),
      time: Number(feature.properties.time) || 0,
      mag: feature.properties.mag,
      src: "USGS",
    },
  })).filter((feature) => feature.geometry?.type === "Point");
}

async function fetchEONET() {
  const data = await fetchJson(SOURCES.EONET);
  return (data.events || []).map((event) => {
    const geometry = [...(event.geometry || [])].reverse().find((item) => item.type === "Point");
    if (!geometry) return null;
    return {
      type: "Feature",
      geometry,
      properties: {
        id: `nasa-${event.id}`,
        type: "disaster",
        title: strip(event.title),
        place: event.categories?.[0]?.title || "كارثة طبيعية",
        desc: "حدث طبيعي مسجل في NASA EONET",
        url: safeUrl(event.link),
        time: parseTimestamp(geometry.date),
        src: "NASA EONET",
      },
    };
  }).filter(Boolean);
}

export async function fetchEvents() {
  const tasks = [
    ...GDELT_QUERIES.map((item) => fetchGdeltGeo(item.q, item.type)),
    fetchUSGS(),
    fetchEONET(),
  ];
  const results = await Promise.allSettled(tasks);
  const features = [];
  const status = {};

  results.forEach((result, index) => {
    const name = index < GDELT_QUERIES.length
      ? `GDELT · ${GDELT_QUERIES[index].type}`
      : index === GDELT_QUERIES.length ? "USGS" : "NASA EONET";
    if (result.status === "fulfilled") {
      features.push(...result.value);
      status[name] = { label: name, count: result.value.length, ok: true };
    } else {
      status[name] = { label: name, count: 0, ok: false, error: result.reason?.message || "تعذر الجلب" };
    }
  });

  return { features, status };
}
