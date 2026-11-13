/* Pantser PWA service worker. Offline-first: caches the app shell on
   install so the app opens and generates PDFs with no connection.
   Version history lives in web/CHANGELOG.md.
   v1.11.0 cleans up the web code, with no behavior change.
   v1.12.0 shares the PDF via the native share sheet on iOS
   standalone web apps, where no print UI exists.
   v1.13.0 adds a per-label Delete button to the quick-print tray,
   guarded by a confirm dialog.
   v1.13.1 adds a Share app row in Settings with a stored QR code
   that opens the site.
   v1.13.2 rewords the home screen in barcode mode: the prompt asks
   for the barcode number and the single box takes it.
   v1.14.0 adds a barcode scanner: a scan button next to the barcode
   box (mobile, experimental toggle in Advanced settings) opens a live
   camera preview and reads 1D barcodes with the vendored ZXing reader.
   v1.14.1 drops the toggle (the button is always there in barcode
   mode) and makes it a rounded square matching the text box. */
const CACHE = 'pantser-v27';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/strings.js',
  './js/strings-web.js',
  './js/pdf-lib.min.js',
  './js/fontkit.umd.min.js',
  './js/zxing.min.js',
  './assets/logo_readable.jpg',
  './assets/share-qr.png',
  './assets/fonts/Tinos-Regular.ttf',
  './assets/fonts/Tinos-Bold.ttf',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        throw new Error('offline');
      });
    })
  );
});
