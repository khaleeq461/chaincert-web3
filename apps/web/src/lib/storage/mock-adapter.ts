import { createHash } from 'crypto';
import type { IStorageService, UploadResult } from './types';

// In-memory registry of uploaded files/metadata for local development
const mockStorageStore = new Map<string, { data: unknown; isBuffer: boolean; mimeType: string; timestamp: number }>();

function computePseudoCid(buffer: Buffer | string): string {
  const hash = createHash('sha256').update(buffer).digest('hex');
  // Format as standard IPFS CIDv1 prefix (bafkrei...) for realistic appearance
  return `bafkrei${hash.slice(0, 52)}`;
}

export class LocalMockStorageAdapter implements IStorageService {
  async uploadJSON(data: unknown, name?: string): Promise<UploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const cid = computePseudoCid(jsonString);
    const size = Buffer.byteLength(jsonString, 'utf8');
    const timestamp = Date.now();

    mockStorageStore.set(cid, {
      data,
      isBuffer: false,
      mimeType: 'application/json',
      timestamp,
    });

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `/api/ipfs/${cid}`,
      size,
      timestamp,
    };
  }

  async uploadBlob(buffer: Uint8Array | Buffer, filename: string, mimeType = 'application/pdf'): Promise<UploadResult> {
    const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const cid = computePseudoCid(nodeBuffer);
    const size = nodeBuffer.byteLength;
    const timestamp = Date.now();

    mockStorageStore.set(cid, {
      data: nodeBuffer,
      isBuffer: true,
      mimeType,
      timestamp,
    });

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `/api/ipfs/${cid}`,
      size,
      timestamp,
    };
  }

  async getJSON<T = unknown>(cidOrUri: string): Promise<T> {
    const cid = cidOrUri.replace(/^ipfs:\/\//, '');
    const entry = mockStorageStore.get(cid);
    if (!entry) {
      throw new Error(`Storage item not found for CID: ${cid}`);
    }
    return entry.data as T;
  }

  static getStoreEntry(cid: string) {
    return mockStorageStore.get(cid);
  }
}
