import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'garage_database.json');

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GET State
  app.get('/api/state', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        return res.json({ success: true, data });
      }
      return res.json({ success: true, data: null });
    } catch (error) {
      console.error('Error reading data file:', error);
      return res.status(500).json({ success: false, message: 'Failed to read database' });
    }
  });

  // POST State (Save / Sync)
  app.post('/api/state', (req, res) => {
    try {
      const data = req.body;
      if (!data) {
        return res.status(400).json({ success: false, message: 'No data provided' });
      }
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true, lastUpdated: data.lastUpdated });
    } catch (error) {
      console.error('Error saving data file:', error);
      return res.status(500).json({ success: false, message: 'Failed to save database' });
    }
  });

  // Reset database endpoint
  app.post('/api/reset', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        fs.unlinkSync(DATA_FILE);
      }
      return res.json({ success: true, message: 'Database reset to initial' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to reset database' });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auto Garage Management Server running on port ${PORT}`);
  });
}

startServer();
