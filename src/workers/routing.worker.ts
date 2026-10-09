import { calculateLocal } from '../routing/localEngine';
self.onmessage = async (event) => {
  try {
    self.postMessage({ progress: 'Chargement des index locaux et scan des horaires…' });
    self.postMessage({ result: await calculateLocal(event.data) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
