import { db } from '../db/database';
import { isBusy, subscribeActivity, whenUpdateSafe } from './activityService';
import { UPDATE_INTERVAL_MS } from '../release';
export interface UpdateState {
  supported: boolean;
  ready: boolean;
  checking: boolean;
  pending: boolean;
  applying: boolean;
  lastChecked?: string;
  lastAttempt?: string;
  message: string;
  error?: string;
}
export class UpdateManager {
  constructor(private production = !import.meta.env.DEV) {}
  private state: UpdateState = {
    supported: 'serviceWorker' in navigator,
    ready: false,
    checking: false,
    pending: false,
    applying: false,
    message: 'Initialisation du système de mises à jour…',
  };
  private listeners = new Set<() => void>();
  private registration?: ServiceWorkerRegistration;
  private checking?: Promise<void>;
  private started = false;
  private reloadPending = false;
  private forceNext = false;
  private lastInteraction = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  private retry?: ReturnType<typeof setInterval>;
  private stopActivity?: () => void;
  private observed = new WeakSet<ServiceWorker>();
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.state;
  private set(patch: Partial<UpdateState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private interact = () => {
    this.lastInteraction = Date.now();
  };
  private onReturn = () => {
    if (document.visibilityState === 'visible') void this.check();
    else void this.apply(false);
  };
  private online = () => {
    void this.check();
  };
  private controllerChange = () => {
    this.set({ ready: true });
    if (this.state.pending || this.state.applying) {
      this.reloadPending = true;
      if (isBusy()) {
        this.set({
          message: 'Nouvelle version activée ; rechargement différé jusqu’à la fin de l’opération.',
        });
        return;
      }
      window.location.reload();
    }
  };
  async start() {
    if (this.started) return;
    this.started = true;
    try {
      const row = await db.preferences.get('updates.lastChecked');
      if (typeof row?.value === 'string') this.set({ lastChecked: row.value });
    } catch {
      /* Browser storage may be unavailable. */
    }
    if (!this.state.supported) {
      this.set({
        message: 'Service Worker indisponible : utiliser un navigateur compatible sous HTTPS.',
      });
      return;
    }
    if (!this.production) {
      this.set({
        message:
          'Mises à jour disponibles sur le build de production (npm run build puis preview).',
      });
      return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', this.controllerChange);
    window.addEventListener('online', this.online);
    document.addEventListener('visibilitychange', this.onReturn);
    document.addEventListener('pointerdown', this.interact, { passive: true });
    document.addEventListener('keydown', this.interact);
    this.stopActivity = subscribeActivity(() => {
      if (!isBusy()) {
        if (this.reloadPending) window.location.reload();
        else void this.apply(false);
      }
    });
    this.timer = setInterval(() => void this.check(), UPDATE_INTERVAL_MS);
    this.retry = setInterval(() => void this.apply(false), 3000);
    try {
      this.registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { scope: import.meta.env.BASE_URL, updateViaCache: 'none' },
      );
      this.registration.addEventListener('updatefound', this.updateFound);
      if (this.registration.active) this.set({ ready: true });
      this.observe(this.registration.installing);
      this.detectWaiting();
      await this.check();
    } catch {
      this.set({
        error: 'Impossible d’enregistrer le Service Worker.',
        message: 'Installation et mises à jour indisponibles sur cette origine.',
      });
    }
  }
  private updateFound = () => this.observe(this.registration?.installing);
  private observe(worker: ServiceWorker | null | undefined) {
    if (!worker || this.observed.has(worker)) return;
    this.observed.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        this.detectWaiting();
        if (!navigator.serviceWorker.controller)
          this.set({
            ready: true,
            message: 'Application disponible hors ligne ; les données restent à importer.',
          });
      }
      if (worker.state === 'redundant' && this.registration?.installing === worker)
        this.set({
          error:
            'La nouvelle version n’a pas pu être téléchargée. La version actuelle reste disponible.',
        });
    });
  }
  private detectWaiting() {
    if (this.registration?.waiting && navigator.serviceWorker.controller) {
      this.set({
        pending: true,
        message:
          'Nouvelle version téléchargée. Installation automatique à la prochaine pause, sans interrompre les opérations.',
      });
      void this.apply(this.forceNext);
    }
  }
  check = async () => {
    if (this.checking) return this.checking;
    this.checking = this.performCheck().finally(() => {
      this.checking = undefined;
    });
    return this.checking;
  };
  private async performCheck() {
    if (!navigator.onLine) {
      this.set({ error: 'Hors ligne : reconnectez-vous pour vérifier les mises à jour.' });
      return;
    }
    if (!this.registration) {
      this.set({
        error: !this.production
          ? 'Vérification indisponible en développement : utilisez le build de production.'
          : 'Le système de mise à jour n’est pas encore prêt.',
      });
      return;
    }
    this.set({
      checking: true,
      error: undefined,
      lastAttempt: new Date().toISOString(),
      message: 'Vérification des nouvelles versions…',
    });
    try {
      await this.registration.update();
      const stamp = new Date().toISOString();
      this.set({
        lastChecked: stamp,
        message: this.registration.installing
          ? 'Nouvelle version en cours de téléchargement…'
          : this.registration.waiting
            ? 'Nouvelle version téléchargée.'
            : 'Vérification terminée : aucune nouvelle version détectée.',
      });
      try {
        await db.preferences.put({ key: 'updates.lastChecked', value: stamp });
      } catch {
        /* Keep the in-memory date, even without storage. */
      }
      this.observe(this.registration.installing);
      this.detectWaiting();
    } catch {
      this.set({
        error:
          'Vérification impossible : connexion ou serveur indisponible. La version actuelle est conservée.',
      });
    } finally {
      this.set({ checking: false });
    }
  }
  force = async () => {
    await this.check();
    if (this.state.error) return;
    if (isBusy()) {
      this.set({
        error: 'Terminez ou annulez l’import ou le calcul avant de forcer la mise à jour.',
      });
      return;
    }
    if (this.registration?.installing) {
      this.forceNext = true;
      this.set({
        message:
          'Téléchargement en cours. La nouvelle version sera appliquée dès qu’elle sera prête.',
      });
      return;
    }
    if (!this.registration?.waiting) {
      this.set({
        message: 'Aucune nouvelle version à appliquer. La version installée est conservée.',
      });
      return;
    }
    await this.apply(true);
  };
  private async apply(force: boolean) {
    if (!this.registration?.waiting || this.state.applying || isBusy()) return;
    const focused = document.activeElement;
    if (
      !force &&
      document.visibilityState === 'visible' &&
      (Date.now() - this.lastInteraction < 15000 ||
        document.querySelector('dialog[open]') ||
        focused?.matches('input,select,textarea,[contenteditable="true"]'))
    )
      return;
    this.forceNext = false;
    const waiting = this.registration.waiting;
    const applied = await whenUpdateSafe(async () => {
      this.set({
        applying: true,
        error: undefined,
        message: 'Installation de la nouvelle version… Les données locales sont conservées.',
      });
      await new Promise<void>((resolve) => {
        const changed = () => {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener('controllerchange', changed);
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', changed, { once: true });
        const timeout = setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', changed);
          this.set({
            applying: false,
            error: 'Activation non confirmée ; réessayez ou fermez puis rouvrez l’application.',
          });
          resolve();
        }, 15000);
        waiting.postMessage({ type: 'SKIP_WAITING' });
      });
    });
    if (!applied)
      this.set({
        message: navigator.locks
          ? 'Mise à jour en attente : une autre fenêtre utilise les données.'
          : 'Version téléchargée. Fermez toutes les fenêtres de l’application puis rouvrez-la pour activer la mise à jour.',
      });
  }
  dispose() {
    clearInterval(this.timer);
    clearInterval(this.retry);
    this.stopActivity?.();
    window.removeEventListener('online', this.online);
    document.removeEventListener('visibilitychange', this.onReturn);
    document.removeEventListener('pointerdown', this.interact);
    document.removeEventListener('keydown', this.interact);
    navigator.serviceWorker?.removeEventListener('controllerchange', this.controllerChange);
    this.registration?.removeEventListener('updatefound', this.updateFound);
    this.started = false;
  }
}
export const updates = new UpdateManager();
