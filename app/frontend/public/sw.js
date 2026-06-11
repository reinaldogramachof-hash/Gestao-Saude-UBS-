/**
 * SERVICE WORKER — sw.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Dois papéis combinados:
 *   1. CACHE OFFLINE (PWA): armazena o shell do app para funcionar sem internet
 *   2. PUSH NOTIFICATIONS: recebe e exibe notificações do backend mesmo com app fechado
 *
 * ESTRATÉGIA DE CACHE:
 *   - Install: pré-carrega o shell (HTML, JS, CSS, ícones) no cache
 *   - Fetch: "Cache first, network fallback" para assets estáticos
 *             "Network first, cache fallback" para rotas da API
 *   - Activate: limpa versões antigas do cache automaticamente
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Versão do cache — incrementar quando houver novo deploy para forçar atualização
const CACHE_VERSION  = 'ubs-v1';
const CACHE_ESTATICO = `${CACHE_VERSION}-static`;
const CACHE_DINAMICO = `${CACHE_VERSION}-dynamic`;

// Arquivos do shell do app que serão cacheados na instalação do SW
// Estes arquivos permitem que o app abra offline (mostra a tela de login)
const ARQUIVOS_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-72.svg',
];

// ─── INSTALL: pré-carrega o shell no cache ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_ESTATICO).then((cache) => {
      return cache.addAll(ARQUIVOS_SHELL);
    })
  );
  // Força ativação imediata sem esperar tabs antigas fecharem
  self.skipWaiting();
});

// ─── ACTIVATE: remove caches de versões antigas ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => {
      return Promise.all(
        chaves
          .filter(chave => chave !== CACHE_ESTATICO && chave !== CACHE_DINAMICO)
          .map(chave => caches.delete(chave)) // Remove caches de deploys anteriores
      );
    })
  );
  // Assume controle imediato de todas as tabs abertas
  self.clients.claim();
});

// ─── FETCH: intercepta requisições e aplica estratégia de cache ──────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições não-GET e requisições para a API (sempre busca da rede)
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // Para assets do Vite (JS/CSS com hash): Cache first — são imutáveis por versão
  if (url.pathname.match(/\.(js|css|svg|png|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Para navegação (HTML/rotas do SPA): Network first com fallback para o shell
  event.respondWith(networkFirstComFallback(event.request));
});

// Estratégia Cache First: retorna do cache; se não tiver, busca da rede e salva
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_DINAMICO);
    cache.put(request, response.clone());
  }
  return response;
}

// Estratégia Network First: tenta a rede; se falhar, retorna o shell cacheado
async function networkFirstComFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_DINAMICO);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sem internet: retorna o index.html para o SPA lidar com a rota
    const cached = await caches.match(request) || await caches.match('/index.html');
    return cached;
  }
}

// ─── PUSH: recebe notificação do backend e exibe no dispositivo ───────────────
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let dados = {
        titulo: 'Gestão Saúde UBS+',
        corpo:  'Você tem uma nova atualização.',
        url:    '/',
      };

      if (event.data) {
        try { dados = { ...dados, ...JSON.parse(event.data.text()) }; } catch (_) {}
      }

      await self.registration.showNotification(dados.titulo, {
        body:    dados.corpo,
        icon:    '/icon-192.svg',
        badge:   '/icon-72.svg',
        data:    { url: dados.url },
        vibrate: [200, 100, 200],
        // Agrupa notificações do mesmo app para não poluir a bandeja
        tag:     'ubs-notificacao',
        renotify: true,
      });
    })()
  );
});

// ─── NOTIFICATION CLICK: abre o app na tela correta ao tocar na notificação ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlDestino = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (janela.url.includes(self.location.origin)) {
          janela.focus();
          janela.navigate(self.location.origin + urlDestino);
          return;
        }
      }
      clients.openWindow(self.location.origin + urlDestino);
    })
  );
});
