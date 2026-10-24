import { L } from "./config.js";

// الحالة المشتركة للتطبيق
export const state = {
  items: [],
  by: {},
  on: new Set(Object.keys(L)), // الطبقات المفعّلة
  tab: "ev",
  src: "all",
  lg: "all",
  tm: 0,
  q: "",
  n: 30,
  tv: 0,
  wall: false,
  playing: false,
  dirty: false,
  newc: 0,
  ready: false,
  born: 0,
  st: {},   // حالة كل مصدر (عدد / -1 عند الفشل)
  rd: {},   // عدد مرات المحاولة
  fail: {}, // إخفاقات متتالية
  seen: new Map(),
  view: [],
  tkn: [],
  refreshTimer: 0,
};

export function isFresh(item) {
  const seenAt = state.seen.get(item.id) || 0;
  return state.ready && seenAt > state.born && Date.now() - seenAt < 180000;
}
