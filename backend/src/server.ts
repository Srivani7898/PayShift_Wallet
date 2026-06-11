import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app';
import { logger } from './config/logger';

// Load variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`Real-time socket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Real-time socket client disconnected: ${socket.id}`);
  });
});

// Set Socket.IO server reference in app context for use inside routes
app.set('io', io);

server.listen(PORT, () => {
  logger.info(`PayShift Backend server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
