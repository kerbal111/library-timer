/* 图书馆在馆计时 PWA 的离线缓存 */
const CACHE_NAME = "library-timer-v1";
const APP_SHELL = [
    "./mobile_app.html",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) { return cache.addAll(APP_SHELL); })
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(
                    keys.filter(function (key) { return key !== CACHE_NAME; })
                        .map(function (key) { return caches.delete(key); })
                );
            })
            .then(function () { return self.clients.claim(); })
    );
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") {
        return;
    }

    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                var copy = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, copy);
                });
                return response;
            })
            .catch(function () {
                return caches.match(event.request).then(function (cached) {
                    if (cached) {
                        return cached;
                    }
                    if (event.request.mode === "navigate") {
                        return caches.match("./mobile_app.html");
                    }
                    return Response.error();
                });
            })
    );
});
