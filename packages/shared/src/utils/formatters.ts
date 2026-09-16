/**
 * Shortens a blockchain address for display (e.g. 0x1234...5678)
 */
export function formatAddress(address: string, digits: number = 4): string {
  if (!address) return '';
  if (address.length <= digits * 2 + 2) return address;
  return `${address.slice(0, digits + 2)}...${address.slice(-digits)}`;
}

/**
 * Formats a UNIX timestamp (seconds) into a readable date string
 */
export function formatDate(timestamp: number | bigint): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  if (!ts || ts === 0) return 'Never / Lifetime';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ts * 1000));
}

/**
 * Formats a UNIX timestamp (seconds) into date and time
 */
export function formatDateTime(timestamp: number | bigint): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  if (!ts || ts === 0) return 'Never / Lifetime';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts * 1000));
}
