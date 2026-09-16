import type { IStorageService, UploadResult } from './types';

export class PinataStorageAdapter implements IStorageService {
  private jwt?: string;
  private gatewayUrl: string;

  constructor(jwt?: string, gatewayUrl = 'https://gateway.pinata.cloud/ipfs') {
    this.jwt = jwt || process.env.PINATA_JWT;
    this.gatewayUrl = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || gatewayUrl).replace(/\/$/, '');
  }

  async uploadJSON(data: unknown, name = 'certificate-metadata.json'): Promise<UploadResult> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured in environment (PINATA_JWT)');
    }

    const payload = {
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name },
      pinataContent: data,
    };

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.jwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pinata upload error (${response.status}): ${errText}`);
    }

    const resData = await response.json();
    const cid = resData.IpfsHash;

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `${this.gatewayUrl}/${cid}`,
      size: resData.PinSize || 0,
      timestamp: Date.now(),
    };
  }

  async uploadBlob(buffer: Uint8Array | Buffer, filename: string, mimeType = 'application/pdf'): Promise<UploadResult> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured in environment (PINATA_JWT)');
    }

    const blob = new Blob([buffer as any], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
    formData.append('pinataMetadata', JSON.stringify({ name: filename }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.jwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pinata file upload error (${response.status}): ${errText}`);
    }

    const resData = await response.json();
    const cid = resData.IpfsHash;

    return {
      cid,
      uri: `ipfs://${cid}`,
      gatewayUrl: `${this.gatewayUrl}/${cid}`,
      size: resData.PinSize || 0,
      timestamp: Date.now(),
    };
  }

  async getJSON<T = unknown>(cidOrUri: string): Promise<T> {
    const cid = cidOrUri.replace(/^ipfs:\/\//, '');
    const url = `${this.gatewayUrl}/${cid}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS gateway (${response.status}) at ${url}`);
    }
    return (await response.json()) as T;
  }
}
