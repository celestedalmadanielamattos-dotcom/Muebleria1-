const VERSION = "v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icono-192.png",
  "./icono-512.png"
];

// Instalación: guarda una copia de todos los archivos en la caché
self.addEventListener("install", evento => {
  evento.waitUntil(
    caches.open(VERSION).then(cache => {
      return cache.addAll(ARCHIVOS);
    })
  );
});

// Activación: borra las cachés de versiones anteriores
self.addEventListener("activate", evento => {
  evento.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== VERSION) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Intercepta las solicitudes y responde primero con la caché (modo offline)
self.addEventListener("fetch", evento => {
  evento.respondWith(
    caches.match(evento.request).then(respuestaEnCache => {
      return respuestaEnCache || fetch(evento.request);
    })
  );
});