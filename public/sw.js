// Lets the installed app open offline. Pages come from the network when it's there (so updates show up), with
// the last copy as a fallback; the build's hashed files never change, so they come from the cache first.
const CACHE = 'pixel-editor-v1'
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return
    }
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone()
                    caches.open(CACHE).then((cache) => cache.put('./', copy))
                    return response
                })
                .catch(() => caches.match('./')),
        )
        return
    }
    event.respondWith(
        caches.match(request).then((cached) =>
            cached ||
            fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone()
                    caches.open(CACHE).then((cache) => cache.put(request, copy))
                }
                return response
            }),
        ),
    )
})
