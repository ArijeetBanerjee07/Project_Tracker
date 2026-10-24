import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes.js';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', apiRouter);

async function startServer() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`🚀 Project Tracker Server running on http://127.0.0.1:${PORT}`);
    console.log(`📡 API available at http://127.0.0.1:${PORT}/api/projects`);
  });
}

startServer();
