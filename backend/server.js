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

    // POST /api/cars (Eladó/Admin feltölti az autót)
    if (req.method === 'POST' && pathname === '/api/cars') {
      const body = await parseBody(req);
      const {
        brand, model, year, price, mileage, fuel, transmission,
        power, engine_size, category, color, condition, description,
        image, seller_name, seller_city, seller_phone
      } = body;

      if (!brand || !model || !year || !price) {
        return sendJson(res, 400, { error: 'Márka, modell, évjárat és ár megadása kötelező!' });
      }

      const stmt = db.prepare(`
        INSERT INTO cars (
          brand, model, year, price, mileage, fuel, transmission,
          power, engine_size, category, color, condition, description,
          image, featured, seller_name, seller_city, seller_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        brand,
        model,
        Number(year),
        Number(price),
        Number(mileage || 0),
        fuel || 'Benzin',
        transmission || 'Manuális',
        Number(power || 100),
        Number(engine_size || 1500),
        category || 'Szedán',
        color || 'Fekete',
        condition || 'Megkímélt',
        description || '',
        image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
        0,
        seller_name || 'Magánszemély',
        seller_city || 'Budapest',
        seller_phone || '+36 30 123 4567'
      );

      return sendJson(res, 201, { id: result.lastInsertRowid, message: 'Autó sikeresen feltöltve!' });
    }

    // PUT /api/cars/:id (Eladó/Admin módosítja az autót)
    if (req.method === 'PUT' && carIdMatch) {
      const id = Number(carIdMatch[1]);
      const body = await parseBody(req);
      const current = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
      if (!current) {
        return sendJson(res, 404, { error: 'Autó nem található' });
      }

      const updated = { ...current, ...body };
      const stmt = db.prepare(`
        UPDATE cars SET
          brand = ?, model = ?, year = ?, price = ?, mileage = ?, fuel = ?, transmission = ?,
          power = ?, engine_size = ?, category = ?, color = ?, condition = ?, description = ?,
          image = ?, featured = ?, seller_name = ?, seller_city = ?, seller_phone = ?
        WHERE id = ?
      `);

      stmt.run(
        updated.brand, updated.model, Number(updated.year), Number(updated.price),
        Number(updated.mileage), updated.fuel, updated.transmission, Number(updated.power),
        Number(updated.engine_size), updated.category, updated.color, updated.condition,
        updated.description, updated.image, updated.featured ? 1 : 0, updated.seller_name,
        updated.seller_city, updated.seller_phone, id
      );

      return sendJson(res, 200, { message: 'Autó sikeresen módosítva!', car: { ...updated, id } });
    }

    // DELETE /api/cars/:id (Admin törölhet autót)
    if (req.method === 'DELETE' && carIdMatch) {
      const id = Number(carIdMatch[1]);
      const stmt = db.prepare('DELETE FROM cars WHERE id = ?');
      stmt.run(id);
      return sendJson(res, 200, { message: 'Autó sikeresen törölve' });
    }

    // -------------------------------------------------------------
    // 2. PURCHASES ENDPOINTS (Vásárlások - Vevő)
    // -------------------------------------------------------------

    // POST /api/purchases (Vevő megveszi az autót)
    if (req.method === 'POST' && pathname === '/api/purchases') {
      const body = await parseBody(req);
      const { car_id, buyer_name, buyer_email } = body;

      if (!car_id || !buyer_name || !buyer_email) {
        return sendJson(res, 400, { error: 'car_id, buyer_name és buyer_email kötelező!' });
      }

      const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(Number(car_id));
      if (!car) {
        return sendJson(res, 404, { error: 'A megvásárolni kívánt autó nem található!' });
      }

      const stmt = db.prepare(`
        INSERT INTO purchases (car_id, car_title, buyer_name, buyer_email, price)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(car.id, `${car.brand} ${car.model}`, buyer_name, buyer_email, car.price);

      return sendJson(res, 201, {
        id: result.lastInsertRowid,
        message: 'Sikeres vásárlás! A megrendelést rögzítettük.',
        purchase: {
          id: result.lastInsertRowid,
          car_id: car.id,
          car_title: `${car.brand} ${car.model}`,
          buyer_name,
          buyer_email,
          price: car.price
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

    // GET /api/users (Admin lekérdezheti a felhasználókat)
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

    // POST /api/users/login (Egyszerű bejelentkezés)
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

    // DELETE /api/users/:id (Admin törölhet felhasználót, kivéve magát)
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
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return sendJson(res, 200, { message: 'Felhasználó törölve' });
    }

    // -------------------------------------------------------------
    // 4. METADATA & STATS (Kategóriák, Kereskedők, Éves bevétel)
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

    // GET /api/stats (Adminisztrátor éves bevétel és statisztikák)
    if (req.method === 'GET' && pathname === '/api/stats') {
      const carStats = db.prepare(`
        SELECT
          COUNT(*) as total_cars,
          SUM(price) as total_inventory_value,
          AVG(price) as avg_price
        FROM cars
      `).get();

      const purchaseStats = db.prepare(`
        SELECT
          COUNT(*) as total_sales_count,
          COALESCE(SUM(price), 0) as total_revenue
        FROM purchases
      `).get();

      return sendJson(res, 200, {
        cars: carStats,
        purchases: purchaseStats,
        generated_at: new Date().toISOString()
      });
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
