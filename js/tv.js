import { TV } from "./config.js";
import { esc, safeUrl } from "./utils.js";

const modal = document.getElementById("tv-modal");
const channels = document.getElementById("tv-channels");
const player = document.getElementById("tv-player");
const links = document.getElementById("tv-links");
let activeIndex = -1;
let previousFocus = null;

function openModal() {
  previousFocus = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.getElementById("tv-close").focus();
}

function closeModal() {
  stopPlayer();
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  previousFocus?.focus?.();
}

export function initTV() {
  channels.innerHTML = TV.map((channel, index) => `
    <button class="tv-channel" type="button" data-index="${index}" aria-pressed="false">
      <span class="channel-mark" aria-hidden="true">${esc(channel.name.slice(0, 1))}</span>
      <span>${esc(channel.name)}</span>
    </button>`).join("");

  channels.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (button) playChannel(Number(button.dataset.index));
  });

  document.getElementById("btn-tv").addEventListener("click", openModal);
  document.getElementById("tv-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function playChannel(index) {
  const channel = TV[index];
  if (!channel) return;
  activeIndex = index;

  channels.querySelectorAll(".tv-channel").forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  // إزالة إطار القناة السابقة يوقف تشغيلها قبل إنشاء المشغل الجديد.
  player.replaceChildren();
  const placeholder = document.createElement("div");
  placeholder.className = "player-placeholder";
  placeholder.innerHTML = `<span class="loader-ring" aria-hidden="true"></span><span>جارٍ الاتصال بالبث الرسمي…</span>`;
  player.append(placeholder);

  const embed = document.createElement("iframe");
  embed.title = `البث المباشر لقناة ${channel.name}`;
  embed.loading = "lazy";
  embed.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  embed.allowFullscreen = true;
  embed.referrerPolicy = "strict-origin-when-cross-origin";
  embed.src = `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channel.id)}&autoplay=1&mute=1&playsinline=1&rel=0`;
  embed.addEventListener("load", () => placeholder.remove(), { once: true });
  player.append(embed);

  const officialUrl = safeUrl(channel.officialUrl);
  const youtubeUrl = safeUrl(channel.youtubeUrl);
  links.innerHTML = [
    officialUrl ? `<a href="${esc(officialUrl)}" target="_blank" rel="noopener noreferrer">الموقع الرسمي <span aria-hidden="true">↗</span></a>` : "",
    youtubeUrl ? `<a href="${esc(youtubeUrl)}" target="_blank" rel="noopener noreferrer">فتح قناة YouTube <span aria-hidden="true">↗</span></a>` : "",
  ].filter(Boolean).join("");
  links.dataset.channel = String(index);
}

function stopPlayer() {
  player.innerHTML = `<div class="player-placeholder"><span class="tv-placeholder-icon" aria-hidden="true">▶</span><span>اختر قناة لبدء البث</span></div>`;
  links.replaceChildren();
  activeIndex = -1;
  channels.querySelectorAll(".tv-channel").forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });
}
