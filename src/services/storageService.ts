export async function getStorageUsage() {
  return navigator.storage?.estimate?.() || {};
}
export async function requestPersistence() {
  return (await navigator.storage?.persist?.()) || false;
}
export function download(content: string | Blob, name: string, type = 'application/geo+json') {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
