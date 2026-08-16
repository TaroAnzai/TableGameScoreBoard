/* global API_BASE_URL, http, json, output */

const requestResponse = http.post(`${API_BASE_URL}/api/groups/request-link`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: output.groupName,
    email: output.email,
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

const createResponse = http.post(`${API_BASE_URL}/api/groups`, {
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: requestPayload.token }),
});

if (!createResponse.ok) {
  throw new Error(`Group creation failed (${createResponse.status}): ${createResponse.body}`);
}

const group = json(createResponse.body);
if (!group.edit_link || typeof group.edit_link !== 'string') {
  throw new Error('The group creation API response did not contain an edit link');
}

output.groupEditLink = group.edit_link;
output.groupEditDeepLink = `mahjongapp-dev:///group/${group.edit_link}`;
