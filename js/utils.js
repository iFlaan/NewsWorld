export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[char]));

export const safeUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(String(value), window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export const strip = (value) => {
  const template = document.createElement("template");
  template.innerHTML = String(value ?? "");
  template.content.querySelectorAll("script, style, iframe, object").forEach((node) => node.remove());
  return (template.content.textContent || "").replace(/\s+/g, " ").trim().slice(0, 320);
};

export const hash = (value) => {
  let result = 0;
  const input = String(value ?? "");
  for (let i = 0; i < input.length; i += 1) result = (result * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(result).toString(36);
};

export const normalizeText = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/[\u064B-\u065F\u0670]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .toLocaleLowerCase("ar");

export const parseTimestamp = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const input = String(value ?? "").trim();
  const gdelt = input.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (gdelt) return Date.UTC(+gdelt[1], +gdelt[2] - 1, +gdelt[3], +gdelt[4], +gdelt[5], +gdelt[6]);
  const timestamp = Date.parse(input);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const relativeFormatter = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
const clockFormatter = new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" });

export const ago = (timestamp) => {
  const time = Number(timestamp) || 0;
  if (!time) return "وقت غير متاح";
  const minutes = Math.round((time - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");
  return relativeFormatter.format(Math.round(hours / 24), "day");
};

export const clock = (timestamp) => {
  const date = new Date(Number(timestamp) || 0);
  return Number.isNaN(date.getTime()) ? "" : clockFormatter.format(date);
};
