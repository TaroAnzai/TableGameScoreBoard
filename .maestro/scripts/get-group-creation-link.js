const response = http.get(`${MAILHOG_URL}/api/v2/messages?limit=50`);
const payload = json(response.body);
const messages = Array.isArray(payload.items) ? payload.items : [];

function collectStrings(value, result) {
  if (typeof value === 'string') {
    result.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, result));
    return;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, result));
  }
}

function messageText(message) {
  const strings = [];
  collectStrings(message, strings);
  return strings.join('\n').replace(/=\r?\n/g, '').replace(/=3D/g, '=');
}

const message = messages.find((item) => {
  const content = messageText(item);
  return content.includes(output.email) && content.includes(output.groupName);
});

if (!message) {
  throw new Error(`Mail for ${output.email} has not arrived yet`);
}

const content = messageText(message);
const tokenMatch = content.match(/\/group\/create\?token=([A-Za-z0-9_-]+)/);

if (!tokenMatch) {
  throw new Error('The group creation token was not found in the email');
}

output.deepLink = `mahjongapp://group/create?token=${tokenMatch[1]}`;
