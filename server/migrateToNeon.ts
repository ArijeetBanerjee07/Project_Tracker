import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const neonUrl = process.env.DATABASE_URL;
if (!neonUrl) {
  console.error('Please set DATABASE_URL in .env before running migrate');
  process.exit(1);
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: neonUrl,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Connecting to Neon cloud database...');
  const client = await pool.connect();
  console.log('✓ Successfully connected to Neon PostgreSQL!');

  try {
    // 1. Initialize schema
    console.log('Creating tables if they do not exist...');
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
    console.log('✓ Schema ready on Neon.');

    // 2. Fetch projects from running local server
    console.log('Fetching local projects from http://127.0.0.1:3001/api/projects...');
    const res = await fetch('http://127.0.0.1:3001/api/projects');
    const localProjects = (await res.json()) as any[];
    console.log(`Found ${localProjects.length} local project(s) to migrate.`);

    for (const p of localProjects) {
      const clientName = p.clientName || p.institute || 'Unknown Client';
      const assignedTo = p.assignedTo || p.ownership || 'arijeet';
      const totalAmountPaise = p.totalAmountPaise || p.totalAmount || 0;
      const advancePercent = p.advancePercent ?? 50;
      const mySharePercent = p.mySharePercent ?? 50;
      const advanceReceived = Boolean(p.advanceReceived);
      const balanceReceived = Boolean(p.balanceReceived);

      await client.query(
        `
        INSERT INTO projects (
          id, title, client_name, description, assigned_to,
          total_amount_paise, advance_percent, my_share_percent,
          start_date, tentative_deadline, status,
          advance_received, advance_received_date,
          balance_received, balance_received_date,
          notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          client_name = EXCLUDED.client_name,
          description = EXCLUDED.description,
          assigned_to = EXCLUDED.assigned_to,
          total_amount_paise = EXCLUDED.total_amount_paise,
          advance_percent = EXCLUDED.advance_percent,
          my_share_percent = EXCLUDED.my_share_percent,
          start_date = EXCLUDED.start_date,
          tentative_deadline = EXCLUDED.tentative_deadline,
          status = EXCLUDED.status,
          advance_received = EXCLUDED.advance_received,
          advance_received_date = EXCLUDED.advance_received_date,
          balance_received = EXCLUDED.balance_received,
          balance_received_date = EXCLUDED.balance_received_date,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at;
      `,
        [
          p.id,
          p.title,
          clientName,
          p.description || null,
          assignedTo,
          totalAmountPaise,
          advancePercent,
          mySharePercent,
          p.startDate,
          p.tentativeDeadline || null,
          p.status || 'active',
          advanceReceived,
          p.advanceReceivedDate || null,
          balanceReceived,
          p.balanceReceivedDate || null,
          p.notes || null,
          p.createdAt || new Date().toISOString(),
          p.updatedAt || new Date().toISOString(),
        ]
      );
      console.log(`  ✓ Migrated: ${p.title} (${p.id})`);
    }

    // Verify
    const countRes = await client.query('SELECT COUNT(*) FROM projects');
    console.log(`\n🎉 Total projects now in Neon PostgreSQL: ${countRes.rows[0].count}`);

    const verifyList = await client.query('SELECT id, title, client_name, assigned_to, total_amount_paise, status FROM projects');
    console.table(verifyList.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
