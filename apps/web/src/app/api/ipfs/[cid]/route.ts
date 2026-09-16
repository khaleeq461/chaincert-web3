import { NextResponse } from 'next/server';
import { LocalMockStorageAdapter } from '@/lib/storage/mock-adapter';

// Strict IPFS Content Identifier regex:
// Handles standard Base58 (Qm...) and Base32 (bafy..., bafk...) multihashes
const VALID_CID_REGEX = /^[a-zA-Z0-9]{32,128}$/;

export async function GET(
  req: Request,
  props: { params: Promise<{ cid: string }> }
) {
  const { cid } = await props.params;

  // Security Check 1: Prevent Path Traversal, Null Bytes, and Injection
  if (!cid || !VALID_CID_REGEX.test(cid) || cid.includes('..') || cid.includes('/') || cid.includes('\\')) {
    return NextResponse.json(
      { error: 'Invalid IPFS CID format. Alphanumeric hash identifier expected.' },
      { status: 400 }
    );
  }

  // Security Check 2: Check local mock storage store first
  const entry = LocalMockStorageAdapter.getStoreEntry(cid);
  if (entry) {
    if (entry.isBuffer) {
      return new NextResponse(new Uint8Array(entry.data as Buffer), {
        headers: {
          'Content-Type': entry.mimeType || 'application/pdf',
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    return NextResponse.json(entry.data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Security Check 3: Validate and normalize upstream gateway URL
  const gatewayUrl = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/$/, '');
  
  try {
    const upstreamUrl = new URL(`${gatewayUrl}/${encodeURIComponent(cid)}`);
    // Ensure protocol is strictly https: or http:
    if (upstreamUrl.protocol !== 'https:' && upstreamUrl.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid gateway protocol' }, { status: 502 });
    }

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      headers: { 'Accept': '*/*' },
      signal: AbortSignal.timeout(10000), // 10s timeout to prevent hanging connections
    });

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: `Not found on IPFS gateway (${upstreamRes.status})` }, { status: 404 });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gateway fetch error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
