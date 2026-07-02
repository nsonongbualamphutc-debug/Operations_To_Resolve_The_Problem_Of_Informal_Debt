/**
 * Service Worker — แดชบอร์ดหนี้นอกระบบ จ.หนองบัวลำภู
 * กลยุทธ์: Network-first (ได้ข้อมูล/หน้าใหม่เสมอเมื่อออนไลน์) + fallback cache เมื่อออฟไลน์
 * สำคัญ: ทุกครั้งที่ deploy เวอร์ชันใหม่ ให้ "เปลี่ยนเลข VERSION" เพื่อล้าง cache เก่าอัตโนมัติ
 */
const VERSION = 'debt-nb-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './ตราหนองบัวลำภู.png',
  './ปกครอง.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ไม่ยุ่งกับ: method อื่นที่ไม่ใช่ GET, คำขอไป GAS (JSONP ข้อมูลสด), และ input.html (ระบบหลังบ้านต้องสดเสมอ)
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') return;
  if (url.pathname.endsWith('input.html')) return;

  // Network-first + เก็บสำเนาลง cache / ออฟไลน์ค่อยใช้ cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok && (url.origin === location.origin || res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});
