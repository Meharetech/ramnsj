const { WebSocketServer } = require('ws');
const url = require('url');

// Track active connections
const devices = new Map(); // deviceId -> WebSocket connection
const admins = new Map();  // deviceId -> Set of admin WebSocket connections

function initWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    // Route path pattern: /ws/device/:deviceId or /ws/admin/:deviceId
    const deviceMatch = pathname.match(/^\/ws\/device\/([a-zA-Z0-9_\-]+)$/);
    const adminMatch = pathname.match(/^\/ws\/admin\/([a-zA-Z0-9_\-]+)$/);

    if (deviceMatch) {
      const deviceId = deviceMatch[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.connectionType = 'device';
        ws.deviceId = deviceId;
        wss.emit('connection', ws, request);
      });
    } else if (adminMatch) {
      const deviceId = adminMatch[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.connectionType = 'admin';
        ws.deviceId = deviceId;
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    const { connectionType, deviceId } = ws;

    console.log(`📡 WebSocket connected: [Type: ${connectionType}] [DeviceID: ${deviceId}]`);

    if (connectionType === 'device') {
      // If a device reconnects, close the old one
      if (devices.has(deviceId)) {
        try { devices.get(deviceId).close(); } catch (_) {}
      }
      devices.set(deviceId, ws);

      // Notify admins that the device is online/ready
      const adminSockets = admins.get(deviceId);
      if (adminSockets) {
        adminSockets.forEach(admin => {
          if (admin.readyState === 1) {
            admin.send(JSON.stringify({ type: 'device_status', status: 'online' }));
          }
        });
      }
    } else if (connectionType === 'admin') {
      if (!admins.has(deviceId)) {
        admins.set(deviceId, new Set());
      }
      admins.get(deviceId).add(ws);

      // Inform admin about current device connection status
      const isDeviceOnline = devices.has(deviceId) && devices.get(deviceId).readyState === 1;
      ws.send(JSON.stringify({
        type: 'device_status',
        status: isDeviceOnline ? 'online' : 'offline'
      }));
    }

    // Handle messages
    ws.on('message', (message) => {
      try {
        let payload;
        // Check if message is binary or string
        const isBinary = typeof message !== 'string' && !Buffer.isBuffer(message) && !(message instanceof ArrayBuffer);
        
        if (connectionType === 'device') {
          // Relaying screen frames from Android device to Admins
          // Screen frames might be JSON with base64 data, or raw JPEGs.
          // Let's assume they send a JSON string or buffer containing JPEG.
          const adminSockets = admins.get(deviceId);
          if (adminSockets && adminSockets.size > 0) {
            adminSockets.forEach(admin => {
              if (admin.readyState === 1) {
                admin.send(message);
              }
            });
          }
        } else if (connectionType === 'admin') {
          // Relaying remote gestures or commands from Admin to Device
          const deviceSocket = devices.get(deviceId);
          if (deviceSocket && deviceSocket.readyState === 1) {
            deviceSocket.send(message);
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    // Handle disconnects
    ws.on('close', () => {
      console.log(`🔌 WebSocket disconnected: [Type: ${connectionType}] [DeviceID: ${deviceId}]`);
      
      if (connectionType === 'device') {
        if (devices.get(deviceId) === ws) {
          devices.delete(deviceId);
        }
        // Notify admins that the device went offline
        const adminSockets = admins.get(deviceId);
        if (adminSockets) {
          adminSockets.forEach(admin => {
            if (admin.readyState === 1) {
              admin.send(JSON.stringify({ type: 'device_status', status: 'offline' }));
            }
          });
        }
      } else if (connectionType === 'admin') {
        const adminSockets = admins.get(deviceId);
        if (adminSockets) {
          adminSockets.delete(ws);
          if (adminSockets.size === 0) {
            admins.delete(deviceId);
          }
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error on [Type: ${connectionType}] [DeviceID: ${deviceId}]:`, error);
    });
  });

  console.log('🚀 WebSocket server relay initialized.');
}

module.exports = { initWebSocket };
