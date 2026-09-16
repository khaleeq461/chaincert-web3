/**
 * Deterministically sorts keys in an object to produce a canonical JSON string
 */
export function canonicalizeJSON(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalizeJSON).join(',')}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const sortedPairs = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalizeJSON((obj as Record<string, unknown>)[k])}`
  );
  return `{${sortedPairs.join(',')}}`;
}

/**
 * Computes SHA-256 hex string from string or Uint8Array using browser or node crypto
 */
export async function computeSHA256(data: string | Uint8Array): Promise<`0x${string}`> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `0x${hex}`;
  }

  throw new Error('WebCrypto API not available in current environment');
}
