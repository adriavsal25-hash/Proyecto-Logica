/**
 * SICOP-VE 2.0 — Service Worker (PWA Offline-First)
 */

var CACHE_NAME = 'sicop-ve-v2-cache-v1';
var STATIC_ASSETS = [
    './',
    './index.html',
    './estilos.css',
    './js/iconos.js',
    './js/datos.js',
    './js/logica.js',
    './js/movimiento.js',
    './js/interfaz.js',
    './js/comandos.js',
    './js/comparador.js',
    './js/analisis-abc.js',
    './js/tour.js',
    './js/adaptador-api.js',
    './js/modulos-2.0.js',
    './img/fondo-login.jpg',
    './img/logo-blanco.png',
    './img/logo-negro.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.map(function (key) {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    var req = event.request;
    // Peticiones a la API: intentar red primero
    if (req.url.indexOf('/api/v2/') !== -1) {
        event.respondWith(
            fetch(req).catch(function () {
                return new Response(JSON.stringify({ ok: false, mensaje: 'Modo offline: Servidor no alcanzable.' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Recursos estáticos: cache primero
    event.respondWith(
        caches.match(req).then(function (cachedRes) {
            return cachedRes || fetch(req).then(function (networkRes) {
                return caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(req, networkRes.clone());
                    return networkRes;
                });
            });
        }).catch(function () {
            if (req.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});

