/**
 * Cloudflare Worker — GHP Inspection API
 * Routes:
 *   GET  /api/employees               → { result, data: string[] }
 *   POST /api/employees               → { result } (admin: add employee)
 *   POST /api/inspect                 → { status: "Pass"|"Fail" }
 *   GET  /api/records?date=YYYY-MM-DD → { result, records: [...] }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const ITEMS = ['item1','item2','item3','item4','item5','item6',
               'item7','item8','item9','item10','item11','item12'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, url, env);
    }

    // Serve static assets (index.html, sw.js, icons, etc.)
    return env.ASSETS.fetch(request);
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function handleAPI(request, url, env) {
  const path = url.pathname.slice('/api/'.length);

  try {
    // ─── GET /api/employees ─────────────────────────────────────────────────
    if (path === 'employees' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT name FROM employees ORDER BY name'
      ).all();
      return json({ result: 'success', data: results.map(r => r.name) });
    }

    // ─── POST /api/employees ─────────────────────────────────────────────────
    if (path === 'employees' && request.method === 'POST') {
      const { name } = await request.json();
      if (!name?.trim()) return json({ error: 'name required' }, 400);
      await env.DB.prepare(
        'INSERT OR IGNORE INTO employees (name) VALUES (?)'
      ).bind(name.trim()).run();
      return json({ result: 'success' });
    }

    // ─── POST /api/inspect ───────────────────────────────────────────────────
    if (path === 'inspect' && request.method === 'POST') {
      const d = await request.json();

      // Validate required fields
      const missing = ['inspectionDate', 'inspector', 'empName', ...ITEMS]
        .filter(k => !d[k]);
      if (missing.length) return json({ error: `missing: ${missing.join(', ')}` }, 400);

      const overall = ITEMS.some(k => d[k] === 'Fail') ? 'Fail' : 'Pass';

      await env.DB.prepare(`
        INSERT INTO records
          (inspection_date, inspector, emp_name,
           item1, item2, item3, item4, item5, item6,
           item7, item8, item9, item10, item11, item12,
           overall, user_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        d.inspectionDate, d.inspector, d.empName,
        d.item1,  d.item2,  d.item3,  d.item4,
        d.item5,  d.item6,  d.item7,  d.item8,
        d.item9,  d.item10, d.item11, d.item12,
        overall, d.userId ?? ''
      ).run();

      return json({ status: overall });
    }

    // ─── GET /api/records?date=YYYY-MM-DD ───────────────────────────────────
    if (path === 'records' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      const stmt = date
        ? env.DB.prepare(
            'SELECT * FROM records WHERE inspection_date = ? ORDER BY id'
          ).bind(date)
        : env.DB.prepare(
            'SELECT * FROM records ORDER BY inspection_date DESC, id DESC LIMIT 500'
          );
      const { results } = await stmt.all();
      return json({
        result: 'success',
        records: results.map(r => ({
          inspectionDate: r.inspection_date,
          inspector:      r.inspector,
          empName:        r.emp_name,
          item1:  r.item1,  item2:  r.item2,  item3:  r.item3,
          item4:  r.item4,  item5:  r.item5,  item6:  r.item6,
          item7:  r.item7,  item8:  r.item8,  item9:  r.item9,
          item10: r.item10, item11: r.item11, item12: r.item12,
          overall: r.overall,
        })),
      });
    }

    return json({ error: 'not found' }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
}
