import { keccak256, toHex } from 'viem';
import { canonicalizeJSON } from '@chaincert/shared';

export interface IntegrityResult {
  blockchainHash: string;
  calculatedHash: string;
  isMatch: boolean;
  algorithm: 'Keccak-256' | 'SHA-256';
  analyzedFileName?: string;
  analyzedFileSize?: number;
  analyzedAt: number;
}

/**
 * Computes the Keccak-256 cryptographic hash of a binary file or buffer.
 */
export async function computeFileKeccak256(fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array): Promise<string> {
  let bytes: Uint8Array;

  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    const arrayBuffer = await fileOrBuffer.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(fileOrBuffer);
  } else {
    bytes = fileOrBuffer;
  }

  return keccak256(bytes);
}

/**
 * Computes the SHA-256 cryptographic hash of a binary file or buffer.
 */
export async function computeFileSha256(fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array): Promise<string> {
  let arrayBuffer: ArrayBuffer;

  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else {
    arrayBuffer = fileOrBuffer.buffer as ArrayBuffer;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex;
}

/**
 * Computes the deterministic Keccak-256 hash of a JSON metadata object
 * using RFC-8785 canonical JSON serialization.
 */
export function computeCanonicalJsonHash(metadata: unknown): string {
  const canonical = canonicalizeJSON(metadata);
  return keccak256(toHex(canonical));
}

/**
 * Verifies if an uploaded file (PDF, JSON metadata, or raw document)
 * matches the authoritative on-chain blockchain fingerprint.
 */
export async function verifyDocumentIntegrity(
  fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array,
  expectedBlockchainHash: string,
  fileName?: string
): Promise<IntegrityResult> {
  const calculatedHash = await computeFileKeccak256(fileOrBuffer);
  
  // Normalize hashes for robust comparison (0x prefix and lowercase)
  const normExpected = expectedBlockchainHash.toLowerCase().trim();
  const normCalculated = calculatedHash.toLowerCase().trim();

  // Direct match check
  let isMatch = normExpected === normCalculated;

  // If not direct match and file is JSON, try parsing and testing canonical JSON hash
  if (!isMatch && (fileName?.endsWith('.json') || (fileOrBuffer instanceof File && fileOrBuffer.type.includes('json')))) {
    try {
      let text = '';
      if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
        text = await fileOrBuffer.text();
      } else if (fileOrBuffer instanceof ArrayBuffer) {
        text = new TextDecoder().decode(fileOrBuffer);
      } else {
        text = new TextDecoder().decode(fileOrBuffer);
      }
      const json = JSON.parse(text);
      const canonicalHash = computeCanonicalJsonHash(json);
      if (canonicalHash.toLowerCase().trim() === normExpected) {
        isMatch = true;
      }
    } catch {
      // Not valid JSON or parsing failed, rely on binary hash
    }
  }

  let size: number | undefined;
  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    size = fileOrBuffer.size;
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    size = fileOrBuffer.byteLength;
  } else {
    size = fileOrBuffer.length;
  }

  return {
    blockchainHash: expectedBlockchainHash,
    calculatedHash,
    isMatch,
    algorithm: 'Keccak-256',
    analyzedFileName: fileName,
    analyzedFileSize: size,
    analyzedAt: Date.now(),
  };
}
