/* Trazer Intelligence — Service Worker
 * ---------------------------------------------------------------------------
 * GOAL: let techs with weak/no signal still open the app and view static
 * assets + diagram images they've already loaded — WITHOUT ever serving a
 * stale HTML shell to a user who DOES have signal.
 *
 * SAFETY-FIRST DESIGN (a bad SW can brick the app forever):
 *   - HTML / navigations  -> NETWORK-FIRST. Cache is a last-resort fallback
 *     only when the network truly fails (offline). A user with signal ALWAYS
 *     gets the freshest index.html. We never cache-first the shell.
 *   - /api/*              -> NETWORK-ONLY. Never cached, never intercepted with
 *     a cached body (especially /api/ai, /api/tts — must always hit the server).
 *   - Static assets       -> STALE-WHILE-REVALIDATE. lucide.min.js, icons,
 *     manifest, fonts, css/js: serve from cache instantly, refresh in the
 *     background. Safe because they're versioned/replaced on deploy.
 *   - /diagrams/* images  -> STALE-WHILE-REVALIDATE (cache-first w/ bg update).
 *
 *   - skipWaiting() on install + clients.claim() on activate so a new SW (and
 *     thus the new HTML it lets through) takes over immediately.
 *   - Old cache versions are deleted on activate. Bump CACHE_VERSION to wipe.
 *
 * A note on bricking: even in the worst case (this SW gets stuck), because the
 * shell is network-first, a user with connectivity recovers on the next load.
 * Bumping CACHE_VERSION below forces a clean cache rebuild.
 * ------------------------------------------------------------------------- */

'use strict';

// Bump this string to invalidate ALL cached static assets on next deploy.
var CACHE_VERSION = 'trazer-static-v2';   // v2: adds /fieldbrain.js to the precache
var STATIC_CACHE  = CACHE_VERSION;

// Minimal precache: things we want available offline on a brand-new install.
// Kept tiny + non-fatal — a failed precache must NOT abort the install.
var PRECACHE_URLS = [
  '/fieldbrain.js',   // Mike's offline answers — must survive losing signal
  '/lucide.min.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// --- install: warm the static cache, then take over immediately -----------
self.addEventListener('install', function (event) {
  self.skipWaiting(); // don't wait for old tabs to close
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      // addAll is all-or-nothing and would reject the whole install if one
      // asset 404s. Add each individually and swallow per-asset failures.
      return Promise.all(PRECACHE_URLS.map(function (url) {
        return cache.add(url).catch(function () { /* non-fatal */ });
      }));
    })
  );
});

// --- activate: drop old cache versions, claim open clients ----------------
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== STATIC_CACHE) return caches.delete(key);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Allow the page to tell a waiting SW to activate now (belt-and-suspenders;
// skipWaiting() already runs on install).
self.addEventListener('message', function (event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// --- helpers --------------------------------------------------------------

// Is this a request we should treat as the HTML shell / a navigation?
function isNavigationRequest(req) {
  if (req.mode === 'navigate') return true;
  // Some browsers don't set mode=navigate for the top doc; fall back to Accept.
  var accept = req.headers.get('accept') || '';
  return req.method === 'GET' && accept.indexOf('text/html') !== -1;
}

// Static assets that are safe to serve stale-while-revalidate.
function isCacheableStatic(url) {
  var p = url.pathname;
  if (p.indexOf('/diagrams/') === 0) return true; // diagram images
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|json)$/i.test(p);
}

// Network-first: try the network, fall back to cache on failure.
// Used for the HTML shell + navigations so signal always wins.
function networkFirst(event) {
  return fetch(event.request).then(function (resp) {
    // Cache a copy of the shell so we have SOMETHING to show fully offline.
    if (resp && resp.ok && resp.type === 'basic') {
      var copy = resp.clone();
      caches.open(STATIC_CACHE).then(function (c) { c.put(event.request, copy); });
    }
    return resp;
  }).catch(function () {
    // Truly offline: serve the last good shell, or fall back to root '/'.
    return caches.match(event.request).then(function (hit) {
      return hit || caches.match('/');
    });
  });
}

// Stale-while-revalidate: serve cache instantly, refresh in the background.
function staleWhileRevalidate(event) {
  return caches.open(STATIC_CACHE).then(function (cache) {
    return cache.match(event.request).then(function (cached) {
      var fetching = fetch(event.request).then(function (resp) {
        if (resp && resp.ok) cache.put(event.request, resp.clone());
        return resp;
      }).catch(function () { return cached; }); // offline -> keep cached
      // Return cached immediately if we have it; otherwise wait for network.
      return cached || fetching;
    });
  });
}

// --- fetch routing --------------------------------------------------------
self.addEventListener('fetch', function (event) {
  var req = event.request;

  // Only handle GET. Never touch POST/PUT/etc (auth, AI, billing all go through).
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Only handle same-origin requests. Cross-origin (CDNs, ElevenLabs, etc.)
  // pass straight through to the network untouched.
  if (url.origin !== self.location.origin) return;

  // /api/* — NETWORK-ONLY. Do not intercept; let the browser hit the server.
  // (Especially critical for /api/ai and /api/tts.)
  if (url.pathname.indexOf('/api/') === 0) return;

  // The SW file itself — never cache-serve it.
  if (url.pathname === '/sw.js') return;

  // HTML shell / navigations — NETWORK-FIRST (never serve stale to online users).
  if (isNavigationRequest(req)) {
    event.respondWith(networkFirst(event));
    return;
  }

  // Static assets + /diagrams/* — STALE-WHILE-REVALIDATE.
  if (isCacheableStatic(url)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  // Everything else same-origin: plain network, no caching.
  // (Default browser behaviour — we just don't respondWith.)
});
