const CACHE_NAME = "taskaty-pwa-v3";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL))));
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
function swr(req) {
  return caches.open(CACHE_NAME).then(cache => cache.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) { e.respondWith(swr(req)); return; }
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE_NAME).then(x => x.put("./index.html", c)); } return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(swr(req));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./")));
});
