/* global MAESTRO_DEV_API_URL, MAESTRO_DEV_ADMIN, MAESTRO_DEV_ADMIN_PASSWORD, http, output */

const fixture = output && output.fixture;
const groupKeys = fixture && Array.isArray(fixture.groupKeys)
  ? fixture.groupKeys
  : fixture && fixture.groupKey ? [fixture.groupKey] : [];

if (groupKeys.length === 0) {
  console.log('cleanup skipped');
} else {
  const required = { MAESTRO_DEV_API_URL, MAESTRO_DEV_ADMIN, MAESTRO_DEV_ADMIN_PASSWORD };
  for (const [key, value] of Object.entries(required)) {
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} must be set for cleanup`);
  }

  const api = MAESTRO_DEV_API_URL.replace(/\/$/, '');
  const login = http.post(`${api}/api/admin/login`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: MAESTRO_DEV_ADMIN, password: MAESTRO_DEV_ADMIN_PASSWORD }),
  });
  if (!login.ok) throw new Error(`Admin login for cleanup failed (HTTP ${login.status})`);

  // The API client uses credentialed requests. Preserve an explicit session
  // cookie when Maestro exposes one, while remaining compatible with its
  // built-in HTTP cookie handling.
  const setCookie = login.headers && (login.headers['set-cookie'] || login.headers['Set-Cookie']);
  const sessionHeaders = setCookie ? { Cookie: String(setCookie).split(';')[0] } : undefined;

  for (const groupKey of groupKeys) {
    const response = http.delete(`${api}/api/admin/groups/${groupKey}`, {
      body: '',
      headers: sessionHeaders,
    });
    if (response.ok || response.status === 404) {
      console.log(`cleanup completed for test group (${response.status})`);
    } else {
      throw new Error(`Test group cleanup failed (HTTP ${response.status})`);
    }
  }
}
