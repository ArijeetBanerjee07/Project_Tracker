import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from '../server/routes.js';
import { initDb } from '../server/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let dbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
    } catch (e) {
      console.warn('DB init warning:', e);
    }
    dbInitialized = true;
  }
  next();
});

app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
