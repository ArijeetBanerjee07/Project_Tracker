import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/project_tracker';

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

// In-memory fallback if PostgreSQL is not yet configured or temporarily offline
const memoryStore = {
  projects: new Map<string, any>(),
  settings: {
    currencySymbol: '₹',
    defaultAdvancePercent: 50,
    defaultMySharePercent: 50,
  },
};

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl:
        process.env.DATABASE_URL &&
        (process.env.DATABASE_URL.includes('supabase') ||
          process.env.DATABASE_URL.includes('neon') ||
          process.env.DATABASE_URL.includes('render') ||
          process.env.DATABASE_URL.includes('sslmode=require'))
          ? { rejectUnauthorized: false }
          : undefined,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
      lastError = err.message;
      isConnected = false;
    });
  }
  return pool;
}

export async function initDb(): Promise<boolean> {
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          client_name VARCHAR(255) NOT NULL,
          description TEXT,
          assigned_to VARCHAR(32) NOT NULL,
          total_amount_paise BIGINT NOT NULL,
          advance_percent INT NOT NULL DEFAULT 50,
          my_share_percent INT NOT NULL DEFAULT 50,
          start_date VARCHAR(32) NOT NULL,
          tentative_deadline VARCHAR(32),
          status VARCHAR(32) NOT NULL DEFAULT 'active',
          advance_received BOOLEAN NOT NULL DEFAULT FALSE,
          advance_received_date VARCHAR(32),
          balance_received BOOLEAN NOT NULL DEFAULT FALSE,
          balance_received_date VARCHAR(32),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'current_settings',
          currency_symbol VARCHAR(16) NOT NULL DEFAULT '₹',
          default_advance_percent INT NOT NULL DEFAULT 50,
          default_my_share_percent INT NOT NULL DEFAULT 50,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        INSERT INTO app_settings (id, currency_symbol, default_advance_percent, default_my_share_percent)
        VALUES ('current_settings', '₹', 50, 50)
        ON CONFLICT (id) DO NOTHING;
      `);

      isConnected = true;
      lastError = null;
      console.log('✓ PostgreSQL connected and schema initialized.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Connection failed';
    console.warn(`[PostgreSQL Notice]: Database connection not established (${lastError}). Running with live sync in-memory until DATABASE_URL is configured.`);
    return false;
  }
}

export async function getDbStatus() {
  if (pool) {
    try {
      const res = await pool.query('SELECT 1 as connected');
      isConnected = res.rows.length > 0;
      lastError = null;
    } catch (err: any) {
      isConnected = false;
      lastError = err.message;
    }
  }
  return {
    connected: isConnected,
    databaseUrl: databaseUrl.replace(/:[^:]*@/, ':****@'),
    error: lastError,
  };
}

export { isConnected, memoryStore };
