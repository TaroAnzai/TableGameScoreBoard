/* global GROUP_NAME, MAIL_ADDRESS, MAESTRO_DEV_API_URL, http, json, output */

const requiredVariables = {
  MAESTRO_DEV_API_URL,
  GROUP_NAME,
  MAIL_ADDRESS,
};

for (const [name, value] of Object.entries(requiredVariables)) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be set when creating a test group`);
  }
}

const apiBaseUrl = MAESTRO_DEV_API_URL.replace(/\/$/, '');

const requestResponse = http.post(`${apiBaseUrl}/api/groups/request-link`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: GROUP_NAME,
    email: MAIL_ADDRESS,
    timezone: 'Asia/Tokyo',
    recaptcha_token: '',
  }),
});

if (!requestResponse.ok) {
  throw new Error(
    `Group creation request failed (${requestResponse.status}): ${requestResponse.body}`,
  );
}

const requestPayload = json(requestResponse.body);
if (!requestPayload.token || typeof requestPayload.token !== 'string') {
  throw new Error('The group creation request did not return a token');
}

const createResponse = http.post(`${apiBaseUrl}/api/groups`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: requestPayload.token }),
});

if (!createResponse.ok) {
  throw new Error(`Group creation failed (${createResponse.status}): ${createResponse.body}`);
}

const group = json(createResponse.body);
const requiredGroupFields = ['name', 'owner_link', 'edit_link', 'view_link'];

for (const field of requiredGroupFields) {
  if (typeof group[field] !== 'string' || group[field].length === 0) {
    throw new Error(`The group creation API response did not contain ${field}`);
  }
}

output.name = group.name;
output.ownerLink = group.owner_link;
output.editLink = group.edit_link;
output.viewLink = group.view_link;
