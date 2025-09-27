// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname, join } from 'path';

const getMimeType = (extension: string) => {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();
    const uploadsRoot = join(process.cwd(), 'public', 'uploads');

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      if (!req.url) {
        return handle(req, res);
      }

      // Skip socket.io requests from Next.js handler
      if (req.url.startsWith('/api/socketio')) {
        return;
      }

      // Serve uploaded assets directly from the uploads directory so they work
      // the same way in both development and production builds.
      if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
        try {
          const requestUrl = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
          const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/uploads\//, ''));
          const filePath = join(uploadsRoot, relativePath);

          if (!filePath.startsWith(uploadsRoot)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
          }

          const fileStream = createReadStream(filePath);
          const mimeType = getMimeType(extname(filePath));
          const stats = statSync(filePath);

          res.statusCode = 200;
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Length', stats.size);

          fileStream.pipe(res);
          fileStream.on('error', (error) => {
            console.error('Upload streaming error:', error);
            if (!res.headersSent) {
              res.statusCode = 500;
            }
            res.end('Internal Server Error');
          });
          return;
        } catch (error) {
          console.error('Upload serve error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
          return;
        }
      }

      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
