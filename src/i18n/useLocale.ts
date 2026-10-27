import { useSyncExternalStore } from 'react';
import { getLanguage, subscribeLanguage } from './index';
export function useLocale() {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => 'fr' as const);
}
