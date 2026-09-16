export interface StorageMetadata {
  name: string;
  keyvalues?: Record<string, string>;
}

export interface UploadResult {
  cid: string;
  uri: string; // e.g. "ipfs://bafy..."
  gatewayUrl: string; // HTTP gateway URL to view/download
  size: number;
  timestamp: number;
}

export interface IStorageService {
  uploadJSON(data: unknown, name?: string): Promise<UploadResult>;
  uploadBlob(buffer: Uint8Array | Buffer, filename: string, mimeType?: string): Promise<UploadResult>;
  getJSON<T = unknown>(cidOrUri: string): Promise<T>;
}
