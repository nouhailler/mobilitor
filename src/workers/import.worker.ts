import { importDataset } from '../imports/importManager';
self.onmessage = async (event) => {
  try {
    const result = await importDataset(event.data.file, event.data.metadata, (message) =>
      self.postMessage({ progress: message }),
    );
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error && error.name === 'QuotaExceededError'
          ? 'Stockage insuffisant : import annulé, version précédente conservée.'
          : error instanceof Error
            ? error.message
            : String(error),
    });
  }
};
