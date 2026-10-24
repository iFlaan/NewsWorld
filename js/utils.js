// دوال مساعدة عامة

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );

export const strip = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

export const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

const RT = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
const TF = new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" });

export const ago = (t) => {
  const m = Math.round((t - Date.now()) / 60000);
  return Math.abs(m) < 60
    ? RT.format(m, "minute")
    : Math.abs(m) < 1440
    ? RT.format(Math.round(m / 60), "hour")
    : RT.format(Math.round(m / 1440), "day");
};

export const clock = (t) => TF.format(t);

// تحويل طوابع GDELT (YYYYMMDDTHHMMSS) إلى timestamp
export const parseGdeltDate = (s) => {
  const m = s.match(/(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)/);
  return m
    ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6])
    : Date.now();
};

// تحويل أي قيمة زمنية من مصدر خارجي إلى timestamp
export const when = (s) => {
  const t = Date.parse(s);
  return isNaN(t) ? Date.now() : t;
};
