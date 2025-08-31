// Palm Beach Pass - Service Worker
// Version 1.0.0 - Travel Website Color Scheme

const CACHE_NAME = 'palm-beach-pass-v1.0.0';
const DYNAMIC_CACHE = 'palm-beach-pass-dynamic-v1.0.0';

// Critical files to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/checkout.html', 
  '/customer-account.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  console.log('🌴 Palm Beach Pass SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Core assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  console.log('🌴 Palm Beach Pass SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Cache Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip cross-origin requests (except for specific APIs)
  if (url.origin !== location.origin && !isAllowedExternalDomain(url.hostname)) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📱 Serving from cache:', request.url);
          
          // For HTML files, try to update in background
          if (request.headers.get('accept')?.includes('text/html')) {
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {
              // Ignore network errors for background updates
            });
          }
          
          return cachedResponse;
        }

        // Network first for critical requests
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache successful responses
            const responseClone = response.clone();
            
            if (shouldCacheResource(request)) {
              const cacheToUse = isCoreAsset(request.url) ? CACHE_NAME : DYNAMIC_CACHE;
              caches.open(cacheToUse)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline fallbacks
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html').then((fallback) => {
                return fallback || createOfflinePage();
              });
            }
            
            // Return offline image placeholder
            if (request.headers.get('accept')?.includes('image/')) {
              return new Response(createOfflineIcon(), {
                headers: { 'Content-Type': 'image/svg+xml' }
              });
            }
            
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background Sync for Offline Actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  switch (event.tag) {
    case 'sync-cart':
      event.waitUntil(syncCart());
      break;
    case 'sync-passes':
      event.waitUntil(syncPasses());
      break;
    case 'sync-purchases':
      event.waitUntil(syncPurchases());
      break;
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let notificationData = {
    title: 'Palm Beach Pass',
    body: 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
      url: notificationData.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    tag: 'palm-beach-pass'
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle Messages from Main Thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('💬 SW Message received:', type);

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE).then((cache) => {
          return cache.addAll(data.urls);
        })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(data.cacheType));
      break;
  }
});

// Utility Functions
function isAllowedExternalDomain(hostname) {
  const allowedDomains = [
    'maps.googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com'
  ];
  return allowedDomains.some(domain => hostname.includes(domain));
}

function shouldCacheResource(request) {
  const url = new URL(request.url);
  
  // Cache API responses
  if (url.pathname.startsWith('/api/')) return true;
  
  // Cache images
  if (request.headers.get('accept')?.includes('image/')) return true;
  
  // Cache fonts
  if (url.pathname.includes('fonts/') || url.hostname.includes('fonts.g')) return true;
  
  // Cache CSS/JS
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) return true;
  
  return false;
}

function isCoreAsset(url) {
  return CORE_ASSETS.some(asset => url.endsWith(asset));
}

// Background Sync Functions
async function syncCart() {
  try {
    const cart = await getStoredData('cart');
    if (!cart) return;

    // Sync cart with server
    const response = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cart)
    });

    if (response.ok) {
      console.log('✅ Cart synced successfully');
      await notifyClients('CART_SYNCED', { success: true });
    }
  } catch (error) {
    console.error('❌ Cart sync failed:', error);
  }
}

async function syncPasses() {
  try {
    const passes = await getStoredData('userPasses');
    if (!passes) return;

    // Sync passes with server
    const response = await fetch('/api/passes/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passes)
    });

    if (response.ok) {
      console.log('✅ Passes synced successfully');
      await notifyClients('PASSES_SYNCED', { success: true });
    }
  } catch (error) {
    console.error('❌ Passes sync failed:', error);
  }
}

async function syncPurchases() {
  try {
    const pendingPurchases = await getStoredData('pendingPurchases') || [];
    
    for (const purchase of pendingPurchases) {
      try {
        const response = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purchase)
        });

        if (response.ok) {
          // Remove from pending purchases
          await removeFromPendingPurchases(purchase.id);
          console.log('✅ Purchase synced:', purchase.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync purchase:', purchase.id);
      }
    }

    await notifyClients('PURCHASES_SYNCED', { success: true });
  } catch (error) {
    console.error('❌ Purchase sync failed:', error);
  }
}

// Storage Helper Functions
async function getStoredData(key) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = await cache.match(`/storage/${key}`);
    return response ? await response.json() : null;
  } catch (error) {
    console.error('Failed to get stored data:', error);
    return null;
  }
}

async function removeFromPendingPurchases(id) {
  try {
    const purchases = await getStoredData('pendingPurchases') || [];
    const filtered = purchases.filter(p => p.id !== id);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put(`/storage/pendingPurchases`, 
      new Response(JSON.stringify(filtered))
    );
  } catch (error) {
    console.error('Failed to remove pending purchase:', error);
  }
}

async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}

async function clearCache(cacheType) {
  if (cacheType === 'all') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  } else {
    await caches.delete(cacheType);
  }
}

// Offline Fallback Content with Travel Website Color Scheme
function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Palm Beach Pass</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #FFF3A0 0%, #FFFFFF 100%);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2rem;
                color: #2C2C2C;
            }
            .offline-icon {
                width: 120px;
                height: 120px;
                background: linear-gradient(135deg, #FF6B35, #2E86AB);
                border-radius: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4rem;
                color: white;
                margin-bottom: 2rem;
                box-shadow: 0 10px 30px rgba(255, 107, 53, 0.15);
            }
            h1 {
                color: #FF6B35;
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
            }
            p {
                color: #666666;
                font-size: 1.1rem;
                margin-bottom: 2rem;
                max-width: 500px;
                line-height: 1.6;
            }
            .btn-retry {
                background: #FF6B35;
                color: white;
                border: none;
                padding: 1rem 2.5rem;
                border-radius: 50px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-retry:hover {
                background: #FF8C42;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(255, 140, 66, 0.3);
            }
            .available-offline {
                margin-top: 3rem;
                padding: 2rem;
                background: white;
                border-radius: 20px;
                box-shadow: 0 4px 15px rgba(255, 107, 53, 0.1);
                max-width: 400px;
                width: 100%;
            }
            .offline-link {
                display: block;
                padding: 1rem;
                margin: 0.5rem 0;
                background: #FFF3A0;
                border-radius: 15px;
                text-decoration: none;
                color: #FF6B35;
                font-weight: 500;
                transition: all 0.3s;
            }
            .offline-link:hover {
                background: #FF6B35;
                color: white;
                transform: translateX(10px);
            }
        </style>
    </head>
    <body>
        <div class="offline-icon">🌴</div>
        <h1>You're Offline</h1>
        <p>No worries! Your digital passes and saved content are still accessible. We'll reconnect you when you're back online.</p>
        
        <button class="btn-retry" onclick="window.location.reload()">
            Try Again
        </button>
        
        <div class="available-offline">
            <h3 style="color: #FF6B35; margin-bottom: 1rem; font-size: 1.3rem;">Available Offline:</h3>
            <a href="/" class="offline-link">🏠 Home</a>
            <a href="/customer-account.html" class="offline-link">🎫 My Passes</a>
            <a href="/checkout.html" class="offline-link">🛒 Checkout</a>
        </div>
        
        <script>
            window.addEventListener('online', () => {
                window.location.reload();
            });
            
            if (navigator.onLine) {
                document.querySelector('.btn-retry').textContent = 'Refresh Page';
            }
            
            // Animate elements
            document.querySelectorAll('.offline-link').forEach((link, i) => {
                link.style.opacity = '0';
                link.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    link.style.transition = 'all 0.5s ease';
                    link.style.opacity = '1';
                    link.style.transform = 'translateY(0)';
                }, i * 100 + 500);
            });
        </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function createOfflineIcon() {
  return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FF6B35"/>
          <stop offset="100%" style="stop-color:#2E86AB"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="#FFF3A0"/>
      <circle cx="100" cy="100" r="60" fill="url(#grad)" opacity="0.8"/>
      <text x="100" y="110" text-anchor="middle" fill="white" font-size="60" font-family="system-ui">🌴</text>
      <text x="100" y="150" text-anchor="middle" fill="#666" font-size="12" font-family="system-ui">Offline</text>
    </svg>
  `;
}

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync:', event.tag);
  
  if (event.tag === 'update-passes') {
    event.waitUntil(checkPassUpdates());
  }
});

async function checkPassUpdates() {
  try {
    const response = await fetch('/api/passes/check-updates');
    if (response.ok) {
      const updates = await response.json();
      if (updates.hasUpdates) {
        await notifyClients('PASS_UPDATES_AVAILABLE', updates);
      }
    }
  } catch (error) {
    console.error('Failed to check pass updates:', error);
  }
}

console.log('🌴 Palm Beach Pass Service Worker v1.0.0 loaded with travel website colors!');
