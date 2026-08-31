//service-worker.js
//Version 1.1
//SOC: Fixed registration filename mismatch (index.html now registers this exact file).
//     Added self.skipWaiting() + activate handler (clients.claim() + old-cache cleanup)
//     so version bumps actually take effect without closing every tab.
//     Fetch handler no longer leaves an unhandled rejection when offline with no cache
//     match; navigations fall back to the cached index.html, other requests get a
//     minimal 503 response. Icons are cached best-effort so a missing icon file
//     doesn't fail the whole install.
const CACHE = "study-cards-v1.1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Optional: cached individually (not via addAll) so a missing file
// doesn't cause the entire install to fail.
const OPTIONAL_ASSETS = [
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(CORE_ASSETS).then(() => {
        return Promise.all(
          OPTIONAL_ASSETS.map(asset =>
            cache.add(asset).catch(err => {
              console.warn("Skipping optional asset (not found?):", asset, err);
            })
          )
        );
      });
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      if (res) return res;
      return fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
