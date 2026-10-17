/** Shared lock held for every import/calculation: updates wait across tabs when supported. */
const lockName = 'mobilitor-active-operation';
let active = 0;
const listeners = new Set<() => void>();
export const isBusy = () => active > 0;
export function subscribeActivity(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export async function acquireActivity(): Promise<() => void> {
  active++;
  listeners.forEach((fn) => fn());
  let unlock: (() => void) | undefined;
  if (navigator.locks) {
    let admitted!: () => void;
    const ready = new Promise<void>((resolve) => {
      admitted = resolve;
    });
    const hold = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    void navigator.locks
      .request(lockName, { mode: 'shared' }, async () => {
        admitted();
        await hold;
      })
      .catch(() => admitted());
    await ready;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    unlock?.();
    active--;
    listeners.forEach((fn) => fn());
  };
}
export async function whenUpdateSafe(action: () => Promise<void>): Promise<boolean> {
  if (isBusy()) return false;
  if (navigator.locks) {
    try {
      return await navigator.locks.request(
        lockName,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => {
          if (!lock || isBusy()) return false;
          await action();
          return true;
        },
      );
    } catch {
      return false;
    }
  }
  return false; // Without cross-tab locks, install in background and activate on next launch.
}
