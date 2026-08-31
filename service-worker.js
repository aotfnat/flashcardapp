//service-worker.js
//Version 1.2
//SOC: Supports the new in-app "Check for Update" button (index.html). Core
//     assets are now fetched with {cache:"reload"} during install so a
//     forced update check (registration.update()) pulls truly fresh files
//     instead of a stale HTTP-cached copy of index.html. Keep CACHE's version
//     suffix bumped on every release — index.html's registration.update()
//     call only detects a new worker when this file's bytes actually change.
const CACHE = "study-cards-v1.2";

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

// Bypasses the HTTP cache so "Check for Update" reliably fetches the latest
// deployed files instead of whatever the browser already had cached.
function freshRequest(url) {
  return new Request(url, { cache: "reload" });
}

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(CORE_ASSETS.map(freshRequest)).then(() => {
        return Promise.all(
          OPTIONAL_ASSETS.map(asset =>
            cache.add(freshRequest(asset)).catch(err => {
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
