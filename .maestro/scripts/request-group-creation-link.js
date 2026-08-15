/* global API_BASE_URL, http, json, output */

const response = http.post(`${API_BASE_URL}/api/groups/request-link`, {
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

if (!response.ok) {
  throw new Error(`Group creation request failed (${response.status}): ${response.body}`);
}

const payload = json(response.body);

if (!payload.token || typeof payload.token !== 'string') {
  throw new Error('The group creation API response did not contain a token');
}

output.deepLink = `mahjongapp-dev://group/create?token=${payload.token}`;
