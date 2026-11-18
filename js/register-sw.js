/**
 * Register the Pixel Isometric service worker.
 * The worker lives at the project root so it can cache the app shell and
 * every top-level builder page.
 */
const isHttp = location.protocol === 'http:' || location.protocol === 'https:';

if (isHttp && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const swUrl = new URL('../sw.js', import.meta.url);
      const scope = new URL('../', import.meta.url);
      await navigator.serviceWorker.register(swUrl, { scope: scope.href });
    } catch (error) {
      console.warn('Pixel Isometric service worker registration failed:', error);
    }
  });
}
