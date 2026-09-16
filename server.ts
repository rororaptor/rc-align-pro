import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Directory for persistent storage of sync records
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-memory sync clients for Server-Sent Events (real-time streaming across devices)
interface SyncClient {
  id: string;
  res: Response;
}
const sseClients = new Map<string, SyncClient[]>();

function getStoragePath(syncCode: string): string {
  const sanitized = syncCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `sync-${sanitized}.json`);
}

function readSyncData(syncCode: string) {
  const filePath = getStoragePath(syncCode);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading sync file:', e);
    }
  }
  return null;
}

function writeSyncData(syncCode: string, data: unknown) {
  const filePath = getStoragePath(syncCode);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing sync file:', e);
  }
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET cloud data for a sync room / user key
app.get('/api/sync/:syncCode', (req: Request, res: Response) => {
  const { syncCode } = req.params;
  if (!syncCode) {
    res.status(400).json({ error: 'Sync code required' });
    return;
  }
  const data = readSyncData(syncCode);
  res.json({
    found: !!data,
    data: data || null,
    syncCode,
  });
});

// POST cloud data update for a sync room
app.post('/api/sync/:syncCode', (req: Request, res: Response) => {
  const { syncCode } = req.params;
  const payload = req.body;

  if (!syncCode || !payload) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const enhancedPayload = {
    ...payload,
    lastSyncedAt: new Date().toISOString(),
    syncCode,
  };

  writeSyncData(syncCode, enhancedPayload);

  // Broadcast to all devices subscribed to this syncCode via SSE
  const clients = sseClients.get(syncCode);
  if (clients && clients.length > 0) {
    const eventPayload = `data: ${JSON.stringify(enhancedPayload)}\n\n`;
    clients.forEach((client) => {
      try {
        client.res.write(eventPayload);
      } catch (err) {
        console.error('Failed to stream to client:', err);
      }
    });
  }

  res.json({
    success: true,
    lastSyncedAt: enhancedPayload.lastSyncedAt,
    connectedDevices: clients ? clients.length : 1,
  });
});

// Real-time Server-Sent Events (SSE) stream for instant multi-device live sync
app.get('/api/sync/stream/:syncCode', (req: Request, res: Response) => {
  const { syncCode } = req.params;
  if (!syncCode) {
    res.status(400).end();
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const client: SyncClient = { id: clientId, res };

  if (!sseClients.has(syncCode)) {
    sseClients.set(syncCode, []);
  }
  sseClients.get(syncCode)!.push(client);

  // Send initial data if available
  const existingData = readSyncData(syncCode);
  if (existingData) {
    res.write(`data: ${JSON.stringify(existingData)}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ type: 'connected', syncCode })}\n\n`);
  }

  // Keep-alive heartbeat every 20s
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const list = sseClients.get(syncCode);
    if (list) {
      sseClients.set(
        syncCode,
        list.filter((c) => c.id !== clientId)
      );
    }
  });
});

async function startServer() {
  // Vite dev middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RC Alignment Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
