import { TV } from "./config.js";

const modal = document.getElementById("tv-modal");
const channels = document.getElementById("tv-channels");
const player = document.getElementById("tv-player");

let activeIndex = null;

export function initTV() {
  channels.innerHTML = TV.map(
    (c, i) => `<button class="tv-ch" data-i="${i}">${c.name}</button>`
  ).join("");

  channels.addEventListener("click", (e) => {
    const btn = e.target.closest(".tv-ch");
    if (!btn) return;
    playChannel(+btn.dataset.i);
  });

  document.getElementById("btn-tv").onclick = () => {
    modal.hidden = false;
  };

  document.getElementById("tv-close").onclick = () => {
    stopPlayer();
    modal.hidden = true;
  };
}

function playChannel(index) {
  if (activeIndex === index) return;
  activeIndex = index;

  channels.querySelectorAll(".tv-ch").forEach((b, i) => {
    b.classList.toggle("on", i === index);
  });

  // أوقف البث القديم أولاً لتحرير النطاق
  player.innerHTML = "";

  const channel = TV[index];
  const origin = window.location.origin;

  // تأخير بسيط لتحرير الاتصال القديم
  setTimeout(() => {
    const iframe = document.createElement("iframe");
    iframe.src =
      `https://www.youtube.com/embed/live_stream?channel=${channel.id}` +
      `&autoplay=1` +
      `&mute=1` +
      `&playsinline=1` +
      `&enablejsapi=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&vq=small`;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.loading = "lazy";
    player.appendChild(iframe);
  }, 150);
}

function stopPlayer() {
  player.innerHTML = '<div class="tv-placeholder">اختر قناة لبدء البث</div>';
  activeIndex = null;
  channels.querySelectorAll(".tv-ch").forEach((b) => b.classList.remove("on"));
} 
