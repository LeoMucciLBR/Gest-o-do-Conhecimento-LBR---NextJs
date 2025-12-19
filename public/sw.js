const CACHE_NAME = 'lbr-app-v3';
const STATIC_CACHE = 'lbr-static-v3';

// Arquivos para cache offline (apenas públicos)
const STATIC_ASSETS = [
  '/login',
  '/manifest.json',
];

// ============================================
// Instalação do Service Worker
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ============================================
// Ativação - limpar caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============================================
// Fetch Handler - Network First com fallback
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-GET (exceto para Background Sync)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests para APIs (serão tratados pelo app)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Para assets estáticos, usar cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Para páginas, usar network first com fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback para página principal
          return caches.match('/');
        });
      })
  );
});

// ============================================
// Background Sync - Sincronização de Contratos
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-contracts') {
    event.waitUntil(syncContracts());
  }
});

/**
 * Sincroniza contratos pendentes com o servidor
 * Chamado pelo Background Sync quando reconecta
 */
async function syncContracts() {
  try {
    // Notifica o app para fazer a sincronização
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_CONTRACTS',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('[SW] Erro no Background Sync:', error);
    throw error; // Re-throw para retry automático
  }
}

// ============================================
// Message Handler - Comunicação com o App
// ============================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_PAGE':
      // Cache uma página específica sob demanda
      if (payload?.url) {
        caches.open(CACHE_NAME).then((cache) => {
          fetch(payload.url).then((response) => {
            if (response.ok) {
              cache.put(payload.url, response);
            }
          });
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      // Limpa todo o cache
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
      break;
  }
});

// ============================================
// Push Notifications (preparação futura)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LBR App', {
      body: data.body || 'Você tem uma nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
