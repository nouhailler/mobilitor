import type { Request, Result } from '../routing/types';
export function calculateRoute(
  request: Request,
  signal?: AbortSignal,
  onProgress?: (s: string) => void,
): Promise<Result> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/routing.worker.ts', import.meta.url), {
      type: 'module',
    });
    const stop = () => {
      worker.terminate();
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      stop();
      reject(new Error('Calcul annulé.'));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (e) => {
      if (e.data.progress) {
        onProgress?.(e.data.progress);
        return;
      }
      stop();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = () => {
      stop();
      reject(new Error('Erreur du moteur local.'));
    };
    worker.postMessage(request);
  });
}
export const calculateIsochrones = calculateRoute;
export async function compareOrigins(request: Request, origins: string[], signal?: AbortSignal) {
  const results: Result[] = [];
  for (const origin of origins) results.push(await calculateRoute({ ...request, origin }, signal));
  return results;
}
