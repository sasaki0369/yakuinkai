// 役員会参加確認アプリ Service Worker
const CACHE_NAME = 'yakuinkai-v1';
const APP_SHELL  = ['./index.html', './'];

// インストール: アプリシェルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ: Firebaseは常にネットワーク、アプリはキャッシュ優先
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase / 外部API は常にネットワーク
  if (url.includes('firebaseio.com') ||
      url.includes('googleapis.com') ||
      url.includes('firebase') ||
      !url.startsWith(self.location.origin)) {
    return; // ブラウザのデフォルト処理に委ねる
  }

  // アプリシェル（index.html）: ネットワーク優先 → キャッシュ fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
