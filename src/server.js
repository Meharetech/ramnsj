require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const smsRoutes = require('./routes/smsRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const path = require('path');
const http = require('http');
const { initWebSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Keep server alive — log crashes but don't exit
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
});

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static(path.join(__dirname, '../public')));

// API Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/sms', smsRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/payments', paymentRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'OrbitFX API is running...' });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Initialize WebSocket server with our HTTP server
initWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (listening on all interfaces)`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://192.168.0.197:${PORT}`);
});
