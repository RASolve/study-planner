// 앱 파일을 기기에 보관해 오프라인에서도 열리게 한다. 파일을 고쳐 올릴 때마다 CACHE 숫자를 올린다.
const CACHE = 'studyplanner-v2';
const SHELL = ['./', './index.html', './config.js', './supabase.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return; // 서버(supabase) 요청은 그대로 통과

  // 화면과 설정 파일은 인터넷이 되면 최신본을, 안 되면 보관본을 쓴다
  if (req.mode === 'navigate' || (sameOrigin && url.pathname.endsWith('/config.js'))) {
    const key = req.mode === 'navigate' ? './index.html' : req;
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); return res; })
        .catch(() => caches.match(key))
    );
    return;
  }
  // 나머지는 보관본을 먼저 보여 주고 뒤에서 갱신한다
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
