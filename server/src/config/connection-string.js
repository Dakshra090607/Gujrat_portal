export function normalizeNeonSslMode(connectionString) {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    if (url.hostname.endsWith('.neon.tech') && ['prefer', 'require', 'verify-ca'].includes(url.searchParams.get('sslmode'))) {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
