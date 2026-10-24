import { Router, Request, Response } from 'express';
import { getPool, memoryStore, getDbStatus } from './db.js';

export const apiRouter = Router();

// Helper to map DB row to Project object with both frontend schema and DB aliases
function mapRowToProject(row: any) {
  const totalAmount = Number(row.total_amount_paise);
  const ownership = row.assigned_to;
  const institute = row.client_name;
  return {
    id: row.id,
    title: row.title,
    // Frontend primary properties
    institute,
    ownership,
    totalAmount,
    // Aliases for compatibility
    clientName: institute,
    assignedTo: ownership,
    totalAmountPaise: totalAmount,
    description: row.description || undefined,
    advancePercent: Number(row.advance_percent),
    mySharePercent: Number(row.my_share_percent),
    startDate: row.start_date,
    tentativeDeadline: row.tentative_deadline || undefined,
    status: row.status,
    advanceReceived: Boolean(row.advance_received),
    advanceReceivedDate: row.advance_received_date || undefined,
    balanceReceived: Boolean(row.balance_received),
    balanceReceivedDate: row.balance_received_date || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Health check & DB status
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const status = await getDbStatus();
  res.json({
    status: 'ok',
    mode: status.connected ? 'postgresql' : 'memory_fallback',
    db: status,
  });
});

// GET /api/projects
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const result = await pool.query(
        'SELECT * FROM projects ORDER BY tentative_deadline ASC NULLS LAST, created_at DESC'
      );
      return res.json(result.rows.map(mapRowToProject));
    } else {
      const list = Array.from(memoryStore.projects.values());
      return res.json(list);
    }
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.json(mapRowToProject(result.rows[0]));
    } else {
      const p = memoryStore.projects.get(id);
      if (!p) return res.status(404).json({ error: 'Project not found' });
      return res.json(p);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
apiRouter.post('/projects', async (req: Request, res: Response) => {
  const body = req.body;
  const now = new Date().toISOString();
  const id = body.id || 'proj_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);

  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const query = `
        INSERT INTO projects (
          id, title, client_name, description, assigned_to,
          total_amount_paise, advance_percent, my_share_percent,
          start_date, tentative_deadline, status,
          advance_received, advance_received_date,
          balance_received, balance_received_date,
          notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *;
      `;
      const clientName = body.institute || body.clientName || 'Unknown Client';
      const assignedTo = body.ownership || body.assignedTo || 'arijeet';
      const totalAmountPaise = Number(body.totalAmount ?? body.totalAmountPaise ?? 0);

      const values = [
        id,
        body.title,
        clientName,
        body.description || null,
        assignedTo,
        totalAmountPaise,
        body.advancePercent ?? 50,
        body.mySharePercent ?? 50,
        body.startDate,
        body.tentativeDeadline || null,
        body.status || 'active',
        Boolean(body.advanceReceived),
        body.advanceReceivedDate || null,
        Boolean(body.balanceReceived),
        body.balanceReceivedDate || null,
        body.notes || null,
        now,
        now,
      ];
      const result = await pool.query(query, values);
      return res.status(201).json(mapRowToProject(result.rows[0]));
    } else {
      const clientName = body.institute || body.clientName || 'Unknown Client';
      const assignedTo = body.ownership || body.assignedTo || 'arijeet';
      const totalAmount = Number(body.totalAmount ?? body.totalAmountPaise ?? 0);
      const newProj = {
        ...body,
        id,
        institute: clientName,
        clientName,
        ownership: assignedTo,
        assignedTo,
        totalAmount,
        totalAmountPaise: totalAmount,
        createdAt: now,
        updatedAt: now,
      };
      memoryStore.projects.set(id, newProj);
      return res.status(201).json(newProj);
    }
  } catch (err: any) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
apiRouter.put('/projects/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updates = req.body;
  const now = new Date().toISOString();

  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      // Fetch existing
      const existingRes = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      if (existingRes.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const current = existingRes.rows[0];
      const query = `
        UPDATE projects SET
          title = $2,
          client_name = $3,
          description = $4,
          assigned_to = $5,
          total_amount_paise = $6,
          advance_percent = $7,
          my_share_percent = $8,
          start_date = $9,
          tentative_deadline = $10,
          status = $11,
          advance_received = $12,
          advance_received_date = $13,
          balance_received = $14,
          balance_received_date = $15,
          notes = $16,
          updated_at = $17
        WHERE id = $1
        RETURNING *;
      `;

      const resolvedClientName =
        updates.clientName !== undefined
          ? updates.clientName
          : updates.institute !== undefined
          ? updates.institute
          : current.client_name;

      const resolvedAssignedTo =
        updates.assignedTo !== undefined
          ? updates.assignedTo
          : updates.ownership !== undefined
          ? updates.ownership
          : current.assigned_to;

      const resolvedTotalAmount =
        updates.totalAmountPaise !== undefined
          ? Number(updates.totalAmountPaise)
          : updates.totalAmount !== undefined
          ? Number(updates.totalAmount)
          : Number(current.total_amount_paise);

      const values = [
        id,
        updates.title !== undefined ? updates.title : current.title,
        resolvedClientName,
        updates.description !== undefined ? updates.description : current.description,
        resolvedAssignedTo,
        resolvedTotalAmount,
        updates.advancePercent !== undefined ? updates.advancePercent : current.advance_percent,
        updates.mySharePercent !== undefined ? updates.mySharePercent : current.my_share_percent,
        updates.startDate !== undefined ? updates.startDate : current.start_date,
        updates.tentativeDeadline !== undefined ? updates.tentativeDeadline : current.tentative_deadline,
        updates.status !== undefined ? updates.status : current.status,
        updates.advanceReceived !== undefined ? updates.advanceReceived : current.advance_received,
        updates.advanceReceivedDate !== undefined ? updates.advanceReceivedDate : current.advance_received_date,
        updates.balanceReceived !== undefined ? updates.balanceReceived : current.balance_received,
        updates.balanceReceivedDate !== undefined ? updates.balanceReceivedDate : current.balance_received_date,
        updates.notes !== undefined ? updates.notes : current.notes,
        now,
      ];

      const result = await pool.query(query, values);
      return res.json(mapRowToProject(result.rows[0]));
    } else {
      const existing = memoryStore.projects.get(id);
      if (!existing) return res.status(404).json({ error: 'Project not found' });
      const resolvedClientName =
        updates.clientName !== undefined
          ? updates.clientName
          : updates.institute !== undefined
          ? updates.institute
          : existing.clientName || existing.institute;
      const resolvedAssignedTo =
        updates.assignedTo !== undefined
          ? updates.assignedTo
          : updates.ownership !== undefined
          ? updates.ownership
          : existing.assignedTo || existing.ownership;
      const resolvedTotalAmount =
        updates.totalAmountPaise !== undefined
          ? Number(updates.totalAmountPaise)
          : updates.totalAmount !== undefined
          ? Number(updates.totalAmount)
          : existing.totalAmountPaise || existing.totalAmount;

      const updated = {
        ...existing,
        ...updates,
        institute: resolvedClientName,
        clientName: resolvedClientName,
        ownership: resolvedAssignedTo,
        assignedTo: resolvedAssignedTo,
        totalAmount: resolvedTotalAmount,
        totalAmountPaise: resolvedTotalAmount,
        updatedAt: now,
      };
      memoryStore.projects.set(id, updated);
      return res.json(updated);
    }
  } catch (err: any) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
apiRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      await pool.query('DELETE FROM projects WHERE id = $1', [id]);
      return res.json({ success: true });
    } else {
      memoryStore.projects.delete(id);
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/clear
apiRouter.post('/projects/clear', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      await pool.query('DELETE FROM projects');
      return res.json({ success: true });
    } else {
      memoryStore.projects.clear();
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const result = await pool.query('SELECT * FROM app_settings WHERE id = $1', ['current_settings']);
      if (result.rows.length === 0) {
        return res.json({
          currencySymbol: '₹',
          defaultAdvancePercent: 50,
          defaultMySharePercent: 50,
        });
      }
      const row = result.rows[0];
      return res.json({
        currencySymbol: row.currency_symbol,
        defaultAdvancePercent: Number(row.default_advance_percent),
        defaultMySharePercent: Number(row.default_my_share_percent),
      });
    } else {
      return res.json(memoryStore.settings);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
apiRouter.put('/settings', async (req: Request, res: Response) => {
  const updates = req.body;
  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const current = await pool.query('SELECT * FROM app_settings WHERE id = $1', ['current_settings']);
      const row = current.rows[0] || {};
      const currencySymbol = updates.currencySymbol !== undefined ? updates.currencySymbol : (row.currency_symbol || '₹');
      const defaultAdvance = updates.defaultAdvancePercent !== undefined ? updates.defaultAdvancePercent : (row.default_advance_percent ?? 50);
      const defaultMyShare = updates.defaultMySharePercent !== undefined ? updates.defaultMySharePercent : (row.default_my_share_percent ?? 50);

      const query = `
        INSERT INTO app_settings (id, currency_symbol, default_advance_percent, default_my_share_percent, updated_at)
        VALUES ('current_settings', $1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          currency_symbol = EXCLUDED.currency_symbol,
          default_advance_percent = EXCLUDED.default_advance_percent,
          default_my_share_percent = EXCLUDED.default_my_share_percent,
          updated_at = NOW()
        RETURNING *;
      `;
      const result = await pool.query(query, [currencySymbol, defaultAdvance, defaultMyShare]);
      const updatedRow = result.rows[0];
      return res.json({
        currencySymbol: updatedRow.currency_symbol,
        defaultAdvancePercent: Number(updatedRow.default_advance_percent),
        defaultMySharePercent: Number(updatedRow.default_my_share_percent),
      });
    } else {
      memoryStore.settings = {
        ...memoryStore.settings,
        ...updates,
      };
      return res.json(memoryStore.settings);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export
apiRouter.get('/export', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    let projects: any[] = [];
    let settings: any = { currencySymbol: '₹', defaultAdvancePercent: 50, defaultMySharePercent: 50 };

    if (status.connected) {
      const pool = getPool();
      const pRes = await pool.query('SELECT * FROM projects ORDER BY created_at ASC');
      projects = pRes.rows.map(mapRowToProject);
      const sRes = await pool.query('SELECT * FROM app_settings WHERE id = $1', ['current_settings']);
      if (sRes.rows.length > 0) {
        settings = {
          currencySymbol: sRes.rows[0].currency_symbol,
          defaultAdvancePercent: Number(sRes.rows[0].default_advance_percent),
          defaultMySharePercent: Number(sRes.rows[0].default_my_share_percent),
        };
      }
    } else {
      projects = Array.from(memoryStore.projects.values());
      settings = memoryStore.settings;
    }

    const payload = {
      version: 1,
      appName: 'ProjectTrackerPWA',
      exportedAt: new Date().toISOString(),
      settings,
      projects,
    };
    return res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import
apiRouter.post('/import', async (req: Request, res: Response) => {
  const { jsonString } = req.body;
  let parsed: any;
  try {
    parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }

  if (!parsed || !Array.isArray(parsed.projects)) {
    return res.status(400).json({ error: 'Malformed backup: missing projects array' });
  }

  try {
    const status = await getDbStatus();
    if (status.connected) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM projects');

        for (const p of parsed.projects) {
          const query = `
            INSERT INTO projects (
              id, title, client_name, description, assigned_to,
              total_amount_paise, advance_percent, my_share_percent,
              start_date, tentative_deadline, status,
              advance_received, advance_received_date,
              balance_received, balance_received_date,
              notes, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            );
          `;
          await client.query(query, [
            p.id,
            p.title,
            p.clientName,
            p.description || null,
            p.assignedTo,
            p.totalAmountPaise,
            p.advancePercent ?? 50,
            p.mySharePercent ?? 50,
            p.startDate,
            p.tentativeDeadline || null,
            p.status || 'active',
            Boolean(p.advanceReceived),
            p.advanceReceivedDate || null,
            Boolean(p.balanceReceived),
            p.balanceReceivedDate || null,
            p.notes || null,
            p.createdAt || new Date().toISOString(),
            p.updatedAt || new Date().toISOString(),
          ]);
        }

        if (parsed.settings) {
          await client.query(
            `
            INSERT INTO app_settings (id, currency_symbol, default_advance_percent, default_my_share_percent, updated_at)
            VALUES ('current_settings', $1, $2, $3, NOW())
            ON CONFLICT (id) DO UPDATE SET
              currency_symbol = EXCLUDED.currency_symbol,
              default_advance_percent = EXCLUDED.default_advance_percent,
              default_my_share_percent = EXCLUDED.default_my_share_percent,
              updated_at = NOW();
          `,
            [
              parsed.settings.currencySymbol || '₹',
              parsed.settings.defaultAdvancePercent ?? 50,
              parsed.settings.defaultMySharePercent ?? 50,
            ]
          );
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      memoryStore.projects.clear();
      for (const p of parsed.projects) {
        memoryStore.projects.set(p.id, p);
      }
      if (parsed.settings) {
        memoryStore.settings = parsed.settings;
      }
    }

    return res.json({ count: parsed.projects.length });
  } catch (err: any) {
    console.error('Import failed:', err);
    res.status(500).json({ error: err.message });
  }
});
