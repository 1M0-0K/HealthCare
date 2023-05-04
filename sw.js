self.addEventListener("install", evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open("HealthCare")
    .then(cache => cache.addAll([
      "/",
      "/img/favicon.png",
      "/img/mask-icon.png",
      "/img/icon-512.png",
      "/jscript/jscript.js",
      "/jscript/application.js",
      "/css/style.css",
      "/css/fonts.css",
      "/fonts/Roboto-Bold.ttf",
      "/fonts/Roboto-Light.ttf",
      "/fonts/Roboto-Regular.ttf",
      "/fonts/Roboto-Medium.ttf",
      "/manifest.json",
      "/index.html"
    ]))
    .catch(err => console.error(err))
  );
});
 
self.addEventListener("activate", evt => {
  self.clients.claim();
});

self.addEventListener("fetch", evt => {
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.open("HealthCare").then(cache => {
        return cache.match(evt.request);
      });
    })
  );
});



