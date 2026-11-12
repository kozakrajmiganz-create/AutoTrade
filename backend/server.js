import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');
const PORT = process.env.PORT || 3001;

// Ensure database exists
if (!fs.existsSync(dbPath)) {
  console.log('Database not found, generating database.sqlite...');
  await import('./create_sqlite.js');
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Helper lookup or create ID in normalized tables
function getOrCreateId(table, name, col = 'nev') {
  if (!name) return 1;
  const existing = db.prepare(`SELECT id FROM ${table} WHERE ${col} = ?`).get(name);
  if (existing) return existing.id;
  const insert = db.prepare(`INSERT INTO ${table} (${col}) VALUES (?)`).run(name);
  return Number(insert.lastInsertRowid);
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // -------------------------------------------------------------
    // 0. SCHEMA / TÁBLA LISTA & INFORMÁCIÓK
    // -------------------------------------------------------------
    if (req.method === 'GET' && pathname === '/api/schema') {
      const tables = [
        'marka', 'modell', 'kategoria', 'uzemanyag', 'valto', 'szin', 'allapot',
        'telepules', 'kereskedes', 'szerepkor', 'felhasznalo', 'vevo', 'auto',
        'vasarlas', 'fizetesmod', 'afakulcs', 'szamlafej', 'szamlatetel'
      ];
      const result = tables.map(t => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get().count;
        const columns = db.prepare(`PRAGMA table_info(${t})`).all();
        return { table: t, rows: count, columns };
      });
      return sendJson(res, 200, { tables: result });
    }

    // -------------------------------------------------------------
    // 1. CARS ENDPOINTS (Autók)
    // -------------------------------------------------------------

    // GET /api/cars (Keresés, szűrés)
    if (req.method === 'GET' && pathname === '/api/cars') {
      const search = url.searchParams.get('search');
      const brand = url.searchParams.get('brand');
      const category = url.searchParams.get('category');
      const fuel = url.searchParams.get('fuel');
      const maxPrice = url.searchParams.get('maxPrice');
      const featured = url.searchParams.get('featured');

      let query = 'SELECT * FROM cars WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
        const likeVal = `%${search}%`;
        params.push(likeVal, likeVal, likeVal);
      }
      if (brand) {
        query += ' AND brand = ?';
        params.push(brand);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (fuel) {
        query += ' AND fuel = ?';
        params.push(fuel);
      }
      if (maxPrice) {
        query += ' AND price <= ?';
        params.push(Number(maxPrice));
      }
      if (featured !== null && featured !== undefined) {
        query += ' AND featured = ?';
        params.push(Number(featured));
      }

      query += ' ORDER BY id DESC';
      const stmt = db.prepare(query);
      const cars = stmt.all(...params);
      return sendJson(res, 200, cars);
    }

    // GET /api/cars/:id
    const carIdMatch = pathname.match(/^\/api\/cars\/(\d+)$/);
    if (req.method === 'GET' && carIdMatch) {
      const id = Number(carIdMatch[1]);
      const stmt = db.prepare('SELECT * FROM cars WHERE id = ?');
      const car = stmt.get(id);
      if (!car) {
        return sendJson(res, 404, { error: 'Autó nem található' });
      }
      return sendJson(res, 200, car);
    }

    // POST /api/cars (Eladó/Admin feltölti az autót a normalizált táblába)
    if (req.method === 'POST' && pathname === '/api/cars') {
      const body = await parseBody(req);
      const {
        brand, model, year, price, mileage, fuel, transmission,
        power, engine_size, category, color, condition, description,
        image, seller_name, seller_city, seller_phone, alvazszam
      } = body;

      if (!brand || !model || !year || !price) {
        return sendJson(res, 400, { error: 'Márka, modell, évjárat és ár megadása kötelező!' });
      }

      // 1. Márka
      const markaId = getOrCreateId('marka', brand);

      // 2. Modell
      let modellRow = db.prepare('SELECT id FROM modell WHERE marka_id = ? AND nev = ?').get(markaId, model);
      let modellId = modellRow ? modellRow.id : null;
      if (!modellId) {
        const insModell = db.prepare('INSERT INTO modell (marka_id, nev) VALUES (?, ?)').run(markaId, model);
        modellId = Number(insModell.lastInsertRowid);
      }

      // 3. Kategória, Üzemanyag, Váltó, Szín, Állapot
      const kategoriaId = getOrCreateId('kategoria', category || 'Szedán');
      const uzemanyagId = getOrCreateId('uzemanyag', fuel || 'Benzin');
      const valtoId = getOrCreateId('valto', transmission || 'Manuális');
      const szinId = getOrCreateId('szin', color || 'Fekete');
      const allapotId = getOrCreateId('allapot', condition || 'Megkímélt');

      // 4. Kereskedés / Település
      const telepulesId = getOrCreateId('telepules', seller_city || 'Budapest');
      let kereskedesRow = db.prepare('SELECT id FROM kereskedes WHERE nev = ?').get(seller_name || 'AutoTrade City');
      let kereskedesId = kereskedesRow ? kereskedesRow.id : 1;

      // Generálunk alvázszámot ha nincs megadva (17 karakter)
      const generatedVin = alvazszam || ('VIN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase()).padEnd(17, 'X').substring(0, 17);

      const stmt = db.prepare(`
        INSERT INTO auto (
          alvazszam, modell_id, kategoria_id, uzemanyag_id, valto_id,
          szin_id, allapot_id, kereskedes_id, evjarat, ar, km_ora,
          teljesitmeny, hengerurtartalom, leiras, kep, kiemelt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        generatedVin,
        modellId,
        kategoriaId,
        uzemanyagId,
        valtoId,
        szinId,
        allapotId,
        kereskedesId,
        Number(year),
        Number(price),
        Number(mileage || 0),
        Number(power || 100),
        Number(engine_size || 1500),
        description || '',
        image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
        0
      );

      return sendJson(res, 201, {
        id: Number(result.lastInsertRowid),
        message: 'Autó sikeresen feltöltve a normalizált adatbázisba!'
      });
    }

    // PUT /api/cars/:id (Eladó/Admin módosítja az autót)
    if (req.method === 'PUT' && carIdMatch) {
      const id = Number(carIdMatch[1]);
      const body = await parseBody(req);
      const current = db.prepare('SELECT * FROM auto WHERE id = ?').get(id);
      if (!current) {
        return sendJson(res, 404, { error: 'Autó nem található' });
      }

      const stmt = db.prepare(`
        UPDATE auto SET
          ar = COALESCE(?, ar),
          km_ora = COALESCE(?, km_ora),
          leiras = COALESCE(?, leiras),
          kep = COALESCE(?, kep),
          kiemelt = COALESCE(?, kiemelt)
        WHERE id = ?
      `);

      stmt.run(
        body.price ? Number(body.price) : null,
        body.mileage ? Number(body.mileage) : null,
        body.description !== undefined ? body.description : null,
        body.image !== undefined ? body.image : null,
        body.featured !== undefined ? (body.featured ? 1 : 0) : null,
        id
      );

      return sendJson(res, 200, { message: 'Autó sikeresen módosítva!' });
    }

    // DELETE /api/cars/:id (Admin törölhet autót)
    if (req.method === 'DELETE' && carIdMatch) {
      const id = Number(carIdMatch[1]);
      const stmt = db.prepare('DELETE FROM auto WHERE id = ?');
      stmt.run(id);
      return sendJson(res, 200, { message: 'Autó sikeresen törölve' });
    }

    // -------------------------------------------------------------
    // 2. PURCHASES ENDPOINTS (Vásárlások & Számlázás)
    // -------------------------------------------------------------

    // POST /api/purchases (Vevő megveszi az autót)
    if (req.method === 'POST' && pathname === '/api/purchases') {
      const body = await parseBody(req);
      const { car_id, buyer_name, buyer_email } = body;

      if (!car_id || !buyer_name || !buyer_email) {
        return sendJson(res, 400, { error: 'car_id, buyer_name és buyer_email kötelező!' });
      }

      const car = db.prepare('SELECT * FROM auto WHERE id = ?').get(Number(car_id));
      if (!car) {
        return sendJson(res, 404, { error: 'A megvásárolni kívánt autó nem található!' });
      }

      // Ellenőrizzük, hogy már el van-e adva
      const alreadyBought = db.prepare('SELECT id FROM vasarlas WHERE auto_id = ?').get(car.id);
      if (alreadyBought) {
        return sendJson(res, 400, { error: 'Ez az autó már el lett adva!' });
      }

      // Vevő keresése vagy létrehozása
      let vevo = db.prepare('SELECT id FROM vevo WHERE nev = ?').get(buyer_name);
      let vevoId;
      if (vevo) {
        vevoId = vevo.id;
      } else {
        const insVevo = db.prepare(`
          INSERT INTO vevo (felhasznalo_id, nev, telepules_id, lakcim, telefon)
          VALUES (NULL, ?, 1, 'Cím megadása folyamatban', NULL)
        `).run(buyer_name);
        vevoId = Number(insVevo.lastInsertRowid);
      }

      // Vásárlás rögzítése
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const insVasarlas = db.prepare(`
        INSERT INTO vasarlas (auto_id, vevo_id, ar, datum)
        VALUES (?, ?, ?, ?)
      `).run(car.id, vevoId, car.ar, now);

      const vasarlasId = Number(insVasarlas.lastInsertRowid);

      // Automatikus számla generálása a számlafej és számlatétel táblákba
      const szamlaszam = `AT-${new Date().getFullYear()}/${String(vasarlasId).padStart(4, '0')}`;
      const today = now.substring(0, 10);
      const insSzamla = db.prepare(`
        INSERT INTO szamlafej (
          szamlaszam, vasarlas_id, fizetesmod_id, datum_telj,
          datum_szamla, datum_fizhat, datum_fizetve, megjegyzes
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?)
      `).run(szamlaszam, vasarlasId, today, today, today, today, 'Online autóvásárlás');

      const szamlaId = Number(insSzamla.lastInsertRowid);

      // Számlatétel rögzítése
      db.prepare(`
        INSERT INTO szamlatetel (szamla_id, sorszam, auto_id, megnevezes, mennyiseg, egysegar, afakulcs_id)
        VALUES (?, 1, ?, 'Gépjármű adásvétel', 1, ?, 1)
      `).run(szamlaId, car.id, Math.round(car.ar / 1.27));

      return sendJson(res, 201, {
        id: vasarlasId,
        szamlaszam,
        message: 'Sikeres vásárlás! A megrendelést és a számlát rögzítettük az adatbázisban.',
        purchase: {
          id: vasarlasId,
          car_id: car.id,
          buyer_name,
          buyer_email,
          price: car.ar,
          created_at: now
        }
      });
    }

    // GET /api/purchases (Admin / Értékesítés lista)
    if (req.method === 'GET' && pathname === '/api/purchases') {
      const stmt = db.prepare('SELECT * FROM purchases ORDER BY id DESC');
      return sendJson(res, 200, stmt.all());
    }

    // -------------------------------------------------------------
    // 3. USERS & AUTH (Felhasználók és Szerepkörök)
    // -------------------------------------------------------------

    // GET /api/users
    if (req.method === 'GET' && pathname === '/api/users') {
      const role = url.searchParams.get('role');
      let query = 'SELECT id, name, email, role FROM users';
      const params = [];
      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }
      query += ' ORDER BY id ASC';
      const stmt = db.prepare(query);
      return sendJson(res, 200, stmt.all(...params));
    }

    // POST /api/users/login
    if (req.method === 'POST' && pathname === '/api/users/login') {
      const body = await parseBody(req);
      const { email, role } = body;

      let user = null;
      if (email) {
        user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email);
      } else if (role) {
        user = db.prepare('SELECT id, name, email, role FROM users WHERE role = ? LIMIT 1').get(role);
      }

      if (!user) {
        return sendJson(res, 401, { error: 'Felhasználó nem található' });
      }

      return sendJson(res, 200, { message: 'Sikeres bejelentkezés', user });
    }

    // DELETE /api/users/:id
    const userIdMatch = pathname.match(/^\/api\/users\/(\d+)$/);
    if (req.method === 'DELETE' && userIdMatch) {
      const id = Number(userIdMatch[1]);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!user) {
        return sendJson(res, 404, { error: 'Felhasználó nem található' });
      }
      if (user.role === 'admin' && user.email === 'admin@autotrade.hu') {
        return sendJson(res, 400, { error: 'A fő adminisztrátort nem lehet törölni!' });
      }
      db.prepare('DELETE FROM felhasznalo WHERE id = ?').run(id);
      return sendJson(res, 200, { message: 'Felhasználó törölve' });
    }

    // -------------------------------------------------------------
    // 4. METADATA & STATS (Kategóriák, Kereskedők, Statisztikák)
    // -------------------------------------------------------------

    // GET /api/categories
    if (req.method === 'GET' && pathname === '/api/categories') {
      const stmt = db.prepare('SELECT * FROM categories ORDER BY id ASC');
      return sendJson(res, 200, stmt.all());
    }

    // GET /api/dealers
    if (req.method === 'GET' && pathname === '/api/dealers') {
      const stmt = db.prepare('SELECT * FROM dealers ORDER BY id ASC');
      return sendJson(res, 200, stmt.all());
    }

    // GET /api/stats
    if (req.method === 'GET' && pathname === '/api/stats') {
      const carStats = db.prepare(`
        SELECT
          COUNT(*) as total_cars,
          SUM(ar) as total_inventory_value,
          AVG(ar) as avg_price
        FROM auto
      `).get();

      const purchaseStats = db.prepare(`
        SELECT
          COUNT(*) as total_sales_count,
          COALESCE(SUM(ar), 0) as total_revenue
        FROM vasarlas
      `).get();

      return sendJson(res, 200, {
        cars: carStats,
        purchases: purchaseStats,
        generated_at: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------
    // 5. NORMALIZÁLT TÁBLÁK KÖZVETLEN VÉGPONTJAI
    // -------------------------------------------------------------
    const normalizedTables = [
      'marka', 'modell', 'kategoria', 'uzemanyag', 'valto', 'szin', 'allapot',
      'telepules', 'kereskedes', 'szerepkor', 'felhasznalo', 'vevo', 'auto',
      'vasarlas', 'fizetesmod', 'afakulcs', 'szamlafej', 'szamlatetel'
    ];

    for (const tbl of normalizedTables) {
      if (req.method === 'GET' && pathname === `/api/${tbl}`) {
        const rows = db.prepare(`SELECT * FROM ${tbl}`).all();
        return sendJson(res, 200, rows);
      }
    }

    sendJson(res, 404, { error: 'Végpont nem található' });
  } catch (err) {
    console.error('API Error:', err);
    sendJson(res, 500, { error: 'Szerverhiba: ' + err.message });
  }
});

server.listen(PORT, () => {
  console.log(`AutoTrade Backend API fut a következő címen: http://localhost:${PORT}`);
});
