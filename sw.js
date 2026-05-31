/* Service Worker — GHP Personal Hygiene PWA
 * กลยุทธ์:
 *   - App shell (หน้าเว็บ + ไอคอน + manifest): cache-first เพื่อให้เปิดได้แบบ offline
 *   - คำขออื่น ๆ (เช่น Google Apps Script, LIFF SDK): ปล่อยผ่าน network ตามปกติ
 *     ไม่ cache เพื่อให้รายชื่อพนักงาน/การบันทึกผลเป็นข้อมูลล่าสุดเสมอ
 */
const CACHE = "ghp-pwa-v1";

// ไฟล์ของ app shell (path แบบ relative ให้รองรับการ deploy ใต้ subpath)
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // เฉพาะ GET เท่านั้น (อย่าไปยุ่งกับ POST ที่ส่งข้อมูลขึ้น Apps Script)
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ปล่อยผ่านคำขอข้ามโดเมน (Apps Script, LIFF CDN ฯลฯ) — ใช้ network ตรง ๆ
  if (url.origin !== self.location.origin) return;

  // สำหรับการนำทางหน้าเว็บ: network-first, ถ้า offline ค่อยใช้ cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ทรัพยากร same-origin อื่น ๆ: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
