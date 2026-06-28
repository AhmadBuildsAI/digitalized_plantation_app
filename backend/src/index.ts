import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler, notFoundHandler } from './utils/errors';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import adminRoutes from './routes/admin';

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: { origin: config.corsOrigin, credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:plantation', (plantationId: string) => {
    socket.join(`plantation:${plantationId}`);
  });

  socket.on('join:admin', () => {
    socket.join('admin');
  });

  socket.on('disconnect', () => {});
});

export function emitNotification(plantationId: string, notification: unknown) {
  io.to(`plantation:${plantationId}`).emit('notification', notification);
  io.to('admin').emit('emergency', notification);
}

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', app: 'Digitalized Plantation API' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(config.port, () => {
  console.log(`🌱 Digitalized Plantation API running on port ${config.port}`);
});

export { io };
