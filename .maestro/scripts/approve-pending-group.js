/* global MAESTRO_DEV_API_URL TOKEN http json output */

const required = { MAESTRO_DEV_API_URL, TOKEN };
for (const [key, value] of Object.entries(required)) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be set`);
  }
}

const api = MAESTRO_DEV_API_URL.replace(/\/$/, '');
const response = http.post(`${api}/api/groups`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: TOKEN.trim() }),
});

if (!response.ok) {
  throw new Error(`Failed to approve pending group (HTTP ${response.status}): ${response.body}`);
}

const group = response.body ? json(response.body) : undefined;
if (!group || typeof group.id !== 'number') {
  throw new Error('Group approval response did not contain id');
}

const ownerLink = Array.isArray(group.group_links)
  ? group.group_links.find(
      (link) => link && String(link.access_level).toUpperCase() === 'OWNER',
    )
  : undefined;
const ownerKey =
  (ownerLink && ownerLink.short_key) ||
  (typeof group.owner_link === 'string' ? group.owner_link : undefined);

if (typeof ownerKey !== 'string' || ownerKey.length === 0) {
  throw new Error('Group approval response did not contain an OWNER key');
}

output.pendingGroups = {
  ...(output.pendingGroups || {}),
  approvedGroupId: group.id,
  approvedGroupKey: ownerKey,
};
output.fixture = {
  ...(output.fixture || {}),
  groupKey: ownerKey,
  groupKeys: [ownerKey],
};

console.log(`Pending group approved (group id: ${group.id})`);
