import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'vue-project', 'public');
const dbPath = path.join(dbDir, 'database.sqlite');

const cars = [
  {
    id: 1,
    brand: "BMW",
    model: "320d Touring xDrive",
    year: 2019,
    price: 6890000,
    mileage: 142000,
    fuel: "Dízel",
    transmission: "Automata",
    power: 190,
    engine_size: 1995,
    category: "Kombi",
    color: "Fekete metál",
    condition: "Kitűnő",
    description: "Magyarországi első forgalomba helyezés, vezetett digitális szervizkönyv, sérülésmentes állapot.",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80",
    featured: 1,
    seller_name: "AutoTrade Prémium Kft.",
    seller_city: "Budapest",
    seller_phone: "+36 30 123 4567"
  },
  {
    id: 2,
    brand: "Audi",
    model: "A4 Avant 2.0 TDI S-Line",
    year: 2020,
    price: 7950000,
    mileage: 118000,
    fuel: "Dízel",
    transmission: "Automata",
    power: 190,
    engine_size: 1968,
    category: "Kombi",
    color: "Szürke metál",
    condition: "Újszerű",
    description: "S-Line külső-belső csomag, Matrix LED fényszórók, Virtual Cockpit, Apple CarPlay.",
    image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80",
    featured: 1,
    seller_name: "AutoTrade Prémium Kft.",
    seller_city: "Győr",
    seller_phone: "+36 70 987 6543"
  },
  {
    id: 3,
    brand: "Volkswagen",
    model: "Golf VII 1.5 TSI Comfortline",
    year: 2018,
    price: 4690000,
    mileage: 95000,
    fuel: "Benzin",
    transmission: "Manuális",
    power: 130,
    engine_size: 1498,
    category: "Ferdehátú",
    color: "Fehér",
    condition: "Megkímélt",
    description: "Gazdaságos és megbízható 1.5 TSI motor hengerkapcsolással. Kétzónás digitális klíma.",
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade City",
    seller_city: "Debrecen",
    seller_phone: "+36 20 456 7890"
  },
  {
    id: 4,
    brand: "Mercedes-Benz",
    model: "C 220 d AMG Line",
    year: 2021,
    price: 9850000,
    mileage: 78000,
    fuel: "Dízel",
    transmission: "Automata",
    power: 194,
    engine_size: 1950,
    category: "Szedán",
    color: "Ezüst metál",
    condition: "Újszerű",
    description: "AMG Line kivitel, panorámatető, Burmester hangrendszer, adaptív tempomat.",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80",
    featured: 1,
    seller_name: "AutoTrade Prémium Kft.",
    seller_city: "Budapest",
    seller_phone: "+36 30 123 4567"
  },
  {
    id: 5,
    brand: "Toyota",
    model: "RAV4 2.5 Hybrid Selection",
    year: 2022,
    price: 11200000,
    mileage: 42000,
    fuel: "Hibrid",
    transmission: "Automata",
    power: 218,
    engine_size: 2487,
    category: "SUV",
    color: "Kék metál",
    condition: "Újszerű",
    description: "Gyári garanciális Toyota hibrid, rendkívül alacsony fogyasztás, 360 fokos kamera.",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80",
    featured: 1,
    seller_name: "AutoTrade Zöld Járművek",
    seller_city: "Szeged",
    seller_phone: "+36 30 555 1234"
  },
  {
    id: 6,
    brand: "Ford",
    model: "Focus Kombi 1.0 EcoBoost ST-Line",
    year: 2019,
    price: 4890000,
    mileage: 105000,
    fuel: "Benzin",
    transmission: "Manuális",
    power: 125,
    engine_size: 999,
    category: "Kombi",
    color: "Piros",
    condition: "Megkímélt",
    description: "Sportos ST-Line felszereltség, fűthető szélvédő és ülések, navigáció.",
    image: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade City",
    seller_city: "Székesfehérvár",
    seller_phone: "+36 20 333 4444"
  },
  {
    id: 7,
    brand: "Skoda",
    model: "Octavia Combi 2.0 TDI DSG Style",
    year: 2020,
    price: 6450000,
    mileage: 139000,
    fuel: "Dízel",
    transmission: "Automata",
    power: 150,
    engine_size: 1968,
    category: "Kombi",
    color: "Fehér",
    condition: "Kitűnő",
    description: "Hatalmas csomagtér, DSG váltó, adaptív tempomat, Full LED fényszórók.",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade Flotta",
    seller_city: "Budapest",
    seller_phone: "+36 30 777 8899"
  },
  {
    id: 8,
    brand: "Tesla",
    model: "Model 3 Long Range Dual Motor",
    year: 2022,
    price: 12490000,
    mileage: 36000,
    fuel: "Elektromos",
    transmission: "Automata",
    power: 440,
    engine_size: 0,
    category: "Szedán",
    color: "Fekete",
    condition: "Újszerű",
    description: "580 km WLTP hatótáv, összkerékhajtás, Prémium fekete belső tér, Autopilot.",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80",
    featured: 1,
    seller_name: "AutoTrade Zöld Járművek",
    seller_city: "Budapest",
    seller_phone: "+36 30 555 1234"
  },
  {
    id: 9,
    brand: "Hyundai",
    model: "Tucson 1.6 T-GDI Prime 4WD",
    year: 2021,
    price: 8990000,
    mileage: 58000,
    fuel: "Benzin",
    transmission: "Automata",
    power: 150,
    engine_size: 1598,
    category: "SUV",
    color: "Sötétszürke metál",
    condition: "Kitűnő",
    description: "Garanciális autó. Digitális műszerfal, KRELL hifi, sávtartó automatika.",
    image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade City",
    seller_city: "Miskolc",
    seller_phone: "+36 70 111 2233"
  },
  {
    id: 10,
    brand: "Mazda",
    model: "6 Sedan 2.0 Skyactiv-G Revolution",
    year: 2018,
    price: 5490000,
    mileage: 112000,
    fuel: "Benzin",
    transmission: "Manuális",
    power: 165,
    engine_size: 1998,
    category: "Szedán",
    color: "Soul Red Crystal (Bordó)",
    condition: "Megkímélt",
    description: "Soul Red fényezés, Revolution csomag bőr belsővel, Head-up display, Bose audio.",
    image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade City",
    seller_city: "Pécs",
    seller_phone: "+36 20 666 7788"
  },
  {
    id: 11,
    brand: "Volvo",
    model: "XC60 2.0 D4 AWD Inscription",
    year: 2019,
    price: 8750000,
    mileage: 128000,
    fuel: "Dízel",
    transmission: "Automata",
    power: 190,
    engine_size: 1969,
    category: "SUV",
    color: "Barna metál",
    condition: "Kitűnő",
    description: "Inscription luxusfelszereltség, Nappa bőrkárpit, Harman Kardon hangrendszer, Pilot Assist.",
    image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade Prémium Kft.",
    seller_city: "Budapest",
    seller_phone: "+36 30 123 4567"
  },
  {
    id: 12,
    brand: "Kia",
    model: "Ceed 1.4 T-GDI GT-Line",
    year: 2020,
    price: 5290000,
    mileage: 69000,
    fuel: "Benzin",
    transmission: "Manuális",
    power: 140,
    engine_size: 1353,
    category: "Ferdehátú",
    color: "Kék metál",
    condition: "Kitűnő",
    description: "GT-Line sportos kivitel, fűthető kormány és ülések, tolatókamera, gyári garancia.",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80",
    featured: 0,
    seller_name: "AutoTrade City",
    seller_city: "Kecskemét",
    seller_phone: "+36 30 888 9900"
  }
];

const categories = [
  { id: 1, name: "Szedán" },
  { id: 2, name: "Kombi" },
  { id: 3, name: "SUV" },
  { id: 4, name: "Ferdehátú" },
  { id: 5, name: "Kupé" }
];

const dealers = [
  {
    id: 1,
    name: "AutoTrade Prémium Kft.",
    city: "Budapest",
    address: "1138 Budapest, Váci út 150.",
    phone: "+36 30 123 4567",
    email: "premium@autotrade.hu"
  },
  {
    id: 2,
    name: "AutoTrade City",
    city: "Debrecen",
    address: "4031 Debrecen, Kishegyesi út 42.",
    phone: "+36 20 456 7890",
    email: "city@autotrade.hu"
  },
  {
    id: 3,
    name: "AutoTrade Zöld Járművek",
    city: "Szeged",
    address: "6724 Szeged, Rókusi krt. 12.",
    phone: "+36 30 555 1234",
    email: "zold@autotrade.hu"
  }
];

async function main() {
  const { DatabaseSync } = await import('node:sqlite');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      fuel TEXT NOT NULL,
      transmission TEXT NOT NULL,
      power INTEGER NOT NULL,
      engine_size INTEGER,
      category TEXT NOT NULL,
      color TEXT NOT NULL,
      condition TEXT NOT NULL,
      description TEXT,
      image TEXT,
      featured INTEGER DEFAULT 0,
      seller_name TEXT,
      seller_city TEXT,
      seller_phone TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `);

  const insertCar = db.prepare(`
    INSERT INTO cars (
      id, brand, model, year, price, mileage, fuel, transmission,
      power, engine_size, category, color, condition, description,
      image, featured, seller_name, seller_city, seller_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const car of cars) {
    insertCar.run(
      car.id,
      car.brand,
      car.model,
      car.year,
      car.price,
      car.mileage,
      car.fuel,
      car.transmission,
      car.power,
      car.engine_size,
      car.category,
      car.color,
      car.condition,
      car.description,
      car.image,
      car.featured,
      car.seller_name,
      car.seller_city,
      car.seller_phone
    );
  }

  const insertCat = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
  for (const cat of categories) {
    insertCat.run(cat.id, cat.name);
  }

  const insertDealer = db.prepare(`
    INSERT INTO dealers (id, name, city, address, phone, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const dealer of dealers) {
    insertDealer.run(dealer.id, dealer.name, dealer.city, dealer.address, dealer.phone, dealer.email);
  }

  db.close();
  console.log(`Populated and created SQLite database at: ${dbPath}`);
}

main().catch(console.error);
