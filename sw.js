const CACHE_NAME = "ax-hub-v4";
const ALLOWED_ORIGINS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          "./index.html",
          "./app.js",
          "./offline.html",
          "./logo-ax.png",
          "./favicon.png",
          "./manifest.json",
        ]),
      ),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const isFont = ALLOWED_ORIGINS.some((o) => e.request.url.startsWith(o));
  const isStaticAsset =
    e.request.url.includes("logo-ax.png") ||
    e.request.url.includes("manifest.json") ||
    e.request.url.includes("app.js") ||
    e.request.url.includes("favicon.png") ||
    e.request.url.includes("index.html") ||
    e.request.url.includes("offline.html");

  if (isFont || isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          return response;
        });
      }),
    );
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match("./offline.html")));
});
