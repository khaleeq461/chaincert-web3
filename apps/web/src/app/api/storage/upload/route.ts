import { NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';

// Strict security limits
const MAX_JSON_SIZE_BYTES = 1024 * 1024; // 1 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/json',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.json']);

/**
 * Sanitizes file names to prevent path traversal, null-byte injection,
 * and dangerous character sets.
 */
function sanitizeFileName(rawName: string): string {
  // Extract base name, strip directory traversal sequences
  const base = rawName
    .replace(/^.*[\\\/]/, '') // Strip paths
    .replace(/\0/g, '')      // Strip null bytes
    .trim();

  // Allow only safe characters: letters, numbers, dash, underscore, dot
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.slice(0, 120) || 'certificate-document';
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const storage = getStorageService();

    // 1. JSON Metadata Upload
    if (contentType.includes('application/json')) {
      const contentLength = Number(req.headers.get('content-length') || 0);
      if (contentLength > MAX_JSON_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Payload too large. Maximum JSON size is ${MAX_JSON_SIZE_BYTES / 1024} KB.` },
          { status: 413 }
        );
      }

      const body = await req.json();
      const { data, name } = body;

      if (!data || typeof data !== 'object') {
        return NextResponse.json({ error: 'Missing or invalid data payload' }, { status: 400 });
      }

      const safeName = sanitizeFileName(name || 'certificate-metadata.json');
      const result = await storage.uploadJSON(data, safeName);
      return NextResponse.json({ success: true, ...result });
    }

    // 2. Multipart Binary Upload (PDF Certificate Documents)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Missing file in form data' }, { status: 400 });
      }

      // Security Check: Size limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File size exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB uploaded).` },
          { status: 413 }
        );
      }

      // Security Check: MIME type validation
      const mimeType = file.type.toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(mimeType) && mimeType !== '') {
        return NextResponse.json(
          { error: `Unauthorized file MIME type: ${file.type}. Only PDF and JSON are permitted.` },
          { status: 415 }
        );
      }

      // Security Check: File extension validation
      const extMatch = file.name.toLowerCase().match(/\.[a-z0-9]+$/);
      const ext = extMatch ? extMatch[0] : '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Unauthorized file extension "${ext}". Only .pdf and .json files are accepted.` },
          { status: 415 }
        );
      }

      const safeFileName = sanitizeFileName(file.name);
      const buffer = Buffer.from(await file.arrayBuffer());

      // Magic bytes verification for PDF (%PDF-)
      if (ext === '.pdf') {
        const header = buffer.slice(0, 5).toString('ascii');
        if (!header.startsWith('%PDF-')) {
          return NextResponse.json(
            { error: 'Corrupted or spoofed PDF file. Magic header (%PDF-) mismatch.' },
            { status: 400 }
          );
        }
      }

      const result = await storage.uploadBlob(buffer, safeFileName, mimeType || 'application/pdf');
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: 'Unsupported Content-Type. Expected application/json or multipart/form-data.' },
      { status: 415 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Storage upload error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
