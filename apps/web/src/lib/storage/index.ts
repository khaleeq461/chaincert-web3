import { LocalMockStorageAdapter } from './mock-adapter';
import { PinataStorageAdapter } from './pinata-adapter';
import type { IStorageService } from './types';

let localAdapterInstance: LocalMockStorageAdapter | null = null;

export function getStorageService(): IStorageService {
  if (process.env.PINATA_JWT) {
    return new PinataStorageAdapter();
  }

  if (!localAdapterInstance) {
    localAdapterInstance = new LocalMockStorageAdapter();
  }
  return localAdapterInstance;
}

export * from './types';
export * from './mock-adapter';
export * from './pinata-adapter';
