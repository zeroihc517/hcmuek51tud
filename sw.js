const CACHE_NAME = 'apma-app-v2';
const STATIC_ASSETS = [
  './',
  './appliedmathematics.html',
  './login.html',
  './TRANGWEB/styleweb.css',
  './TRANGWEB/styleweb2.css',
  './TRANGWEB/config.js',
  './TRANGWEB/Xulyxacthuc.js',
  './TRANGWEB/tkb.js',
  './TRANGWEB/qa.js',
  './TRANGWEB/main.js',
  './TRANGWEB/renluyen.js'
];

// 1. Cài đặt & cache khung giao diện cơ bản
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 2. Xóa cache phiên bản cũ khi bạn cập nhật code
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3. Chiến lược Network-First (luôn ưu tiên bản mới nhất, bỏ qua API Google Script)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Không cache phương thức POST hoặc API Google Apps Script / Google Drive
  if (
    event.request.method !== 'GET' ||
    url.includes('script.google.com') ||
    url.includes('script.googleusercontent.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cập nhật lại cache nếu tải mạng thành công
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});