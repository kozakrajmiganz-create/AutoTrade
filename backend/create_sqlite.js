import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = __dirname;
const dbPath = path.join(dbDir, 'database.sqlite');
const sqlPath = path.join(dbDir, 'schema.sql');
const frontendPublicDir = path.join(__dirname, '..', 'frontend', 'public');
const frontendDbPath = path.join(frontendPublicDir, 'database.sqlite');
const frontendSqlPath = path.join(frontendPublicDir, 'database.sql');

// ============================================================================
// DDL (Adatbázis sémadefiníció az AutoTrade_adatbazis.dia alapján)
// ============================================================================
const DDL_SCRIPT = `
PRAGMA foreign_keys = ON;

-- 1. Márka tábla
CREATE TABLE IF NOT EXISTS marka (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(30) NOT NULL UNIQUE
);

-- 2. Modell tábla
CREATE TABLE IF NOT EXISTS modell (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marka_id INTEGER NOT NULL REFERENCES marka(id) ON DELETE CASCADE,
  nev VARCHAR(40) NOT NULL
);

-- 3. Kategória tábla
CREATE TABLE IF NOT EXISTS kategoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(30) NOT NULL UNIQUE
);

-- 4. Üzemanyag tábla
CREATE TABLE IF NOT EXISTS uzemanyag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(20) NOT NULL UNIQUE
);

-- 5. Váltó tábla
CREATE TABLE IF NOT EXISTS valto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(20) NOT NULL UNIQUE
);

-- 6. Szín tábla
CREATE TABLE IF NOT EXISTS szin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(20) NOT NULL UNIQUE
);

-- 7. Állapot tábla
CREATE TABLE IF NOT EXISTS allapot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(20) NOT NULL UNIQUE
);

-- 8. Település tábla
CREATE TABLE IF NOT EXISTS telepules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(40) NOT NULL,
  irszam CHAR(4) NOT NULL,
  megye VARCHAR(40) NOT NULL
);

-- 9. Kereskedés tábla
CREATE TABLE IF NOT EXISTS kereskedes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(40) NOT NULL,
  telepules_id INTEGER NOT NULL REFERENCES telepules(id),
  cim VARCHAR(60) NOT NULL,
  adoszam VARCHAR(13) NOT NULL UNIQUE,
  telefon VARCHAR(20) NOT NULL,
  email VARCHAR(60) NOT NULL
);

-- 10. Szerepkör tábla
CREATE TABLE IF NOT EXISTS szerepkor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(15) NOT NULL UNIQUE
);

-- 11. Felhasználó tábla
CREATE TABLE IF NOT EXISTS felhasznalo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(40) NOT NULL,
  email VARCHAR(60) NOT NULL UNIQUE,
  szerepkor_id INTEGER NOT NULL REFERENCES szerepkor(id)
);

-- 12. Vevő tábla
CREATE TABLE IF NOT EXISTS vevo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  felhasznalo_id INTEGER UNIQUE REFERENCES felhasznalo(id) ON DELETE SET NULL,
  nev VARCHAR(40) NOT NULL,
  telepules_id INTEGER NOT NULL REFERENCES telepules(id),
  lakcim VARCHAR(60) NOT NULL,
  adoszam VARCHAR(13),
  telefon VARCHAR(20)
);

-- 13. Autó tábla
CREATE TABLE IF NOT EXISTS auto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alvazszam CHAR(17) NOT NULL UNIQUE,
  modell_id INTEGER NOT NULL REFERENCES modell(id),
  kategoria_id INTEGER NOT NULL REFERENCES kategoria(id),
  uzemanyag_id INTEGER NOT NULL REFERENCES uzemanyag(id),
  valto_id INTEGER NOT NULL REFERENCES valto(id),
  szin_id INTEGER NOT NULL REFERENCES szin(id),
  allapot_id INTEGER NOT NULL REFERENCES allapot(id),
  kereskedes_id INTEGER NOT NULL REFERENCES kereskedes(id),
  evjarat INTEGER NOT NULL CHECK (evjarat > 1900),
  ar INTEGER NOT NULL CHECK (ar >= 0),
  km_ora INTEGER NOT NULL CHECK (km_ora >= 0),
  teljesitmeny INTEGER NOT NULL CHECK (teljesitmeny >= 0),
  hengerurtartalom INTEGER,
  leiras TEXT,
  kep VARCHAR(200),
  kiemelt INTEGER NOT NULL DEFAULT 0 CHECK (kiemelt IN (0, 1))
);

-- 14. Vásárlás tábla
CREATE TABLE IF NOT EXISTS vasarlas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auto_id INTEGER NOT NULL UNIQUE REFERENCES auto(id),
  vevo_id INTEGER NOT NULL REFERENCES vevo(id),
  ar INTEGER NOT NULL CHECK (ar >= 0),
  datum DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- 15. Fizetésmód tábla
CREATE TABLE IF NOT EXISTS fizetesmod (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nev VARCHAR(20) NOT NULL UNIQUE
);

-- 16. Áfakulcs tábla
CREATE TABLE IF NOT EXISTS afakulcs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  megnevezes VARCHAR(40) NOT NULL UNIQUE,
  szazalek INTEGER NOT NULL CHECK (szazalek >= 0)
);

-- 17. Számlafej tábla
CREATE TABLE IF NOT EXISTS szamlafej (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  szamlaszam VARCHAR(20) NOT NULL UNIQUE,
  vasarlas_id INTEGER NOT NULL UNIQUE REFERENCES vasarlas(id),
  fizetesmod_id INTEGER NOT NULL REFERENCES fizetesmod(id),
  datum_telj DATE NOT NULL,
  datum_szamla DATE NOT NULL,
  datum_fizhat DATE NOT NULL,
  datum_fizetve DATE,
  megjegyzes VARCHAR(200)
);

-- 18. Számlatétel tábla
CREATE TABLE IF NOT EXISTS szamlatetel (
  szamla_id INTEGER NOT NULL REFERENCES szamlafej(id) ON DELETE CASCADE,
  sorszam INTEGER NOT NULL,
  auto_id INTEGER REFERENCES auto(id),
  megnevezes VARCHAR(100) NOT NULL,
  mennyiseg INTEGER NOT NULL CHECK (mennyiseg > 0),
  egysegar INTEGER NOT NULL CHECK (egysegar >= 0),
  afakulcs_id INTEGER NOT NULL REFERENCES afakulcs(id),
  PRIMARY KEY (szamla_id, sorszam)
);

-- ============================================================================
-- Kompatibilitási nézetek (Frontend és API zökkenőmentes támogatásához)
-- ============================================================================
CREATE VIEW IF NOT EXISTS cars AS
SELECT 
  a.id,
  m.nev AS brand,
  mo.nev AS model,
  a.evjarat AS year,
  a.ar AS price,
  a.km_ora AS mileage,
  u.nev AS fuel,
  v.nev AS transmission,
  a.teljesitmeny AS power,
  a.hengerurtartalom AS engine_size,
  k.nev AS category,
  sz.nev AS color,
  al.nev AS condition,
  a.leiras AS description,
  a.kep AS image,
  a.kiemelt AS featured,
  ke.nev AS seller_name,
  t.nev AS seller_city,
  ke.telefon AS seller_phone,
  a.alvazszam,
  a.modell_id,
  a.kategoria_id,
  a.uzemanyag_id,
  a.valto_id,
  a.szin_id,
  a.allapot_id,
  a.kereskedes_id
FROM auto a
JOIN modell mo ON a.modell_id = mo.id
JOIN marka m ON mo.marka_id = m.id
JOIN kategoria k ON a.kategoria_id = k.id
JOIN uzemanyag u ON a.uzemanyag_id = u.id
JOIN valto v ON a.valto_id = v.id
JOIN szin sz ON a.szin_id = sz.id
JOIN allapot al ON a.allapot_id = al.id
JOIN kereskedes ke ON a.kereskedes_id = ke.id
JOIN telepules t ON ke.telepules_id = t.id;

CREATE TRIGGER IF NOT EXISTS tr_cars_delete
INSTEAD OF DELETE ON cars
BEGIN
  DELETE FROM auto WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_cars_update
INSTEAD OF UPDATE ON cars
BEGIN
  UPDATE auto SET
    ar = NEW.price,
    km_ora = NEW.mileage,
    kiemelt = NEW.featured,
    leiras = NEW.description,
    kep = NEW.image
  WHERE id = OLD.id;
END;

CREATE VIEW IF NOT EXISTS categories AS
SELECT id, nev AS name FROM kategoria;

CREATE VIEW IF NOT EXISTS dealers AS
SELECT 
  k.id,
  k.nev AS name,
  t.nev AS city,
  k.cim AS address,
  k.telefon AS phone,
  k.email
FROM kereskedes k
JOIN telepules t ON k.telepules_id = t.id;

CREATE VIEW IF NOT EXISTS users AS
SELECT 
  f.id,
  f.nev AS name,
  f.email,
  sz.nev AS role
FROM felhasznalo f
JOIN szerepkor sz ON f.szerepkor_id = sz.id;

CREATE VIEW IF NOT EXISTS purchases AS
SELECT 
  v.id,
  v.auto_id,
  (m.nev || ' ' || mo.nev) AS car_title,
  ve.nev AS buyer_name,
  COALESCE(f.email, 'vendeg@autotrade.hu') AS buyer_email,
  v.ar AS price,
  v.datum AS created_at
FROM vasarlas v
JOIN auto a ON v.auto_id = a.id
JOIN modell mo ON a.modell_id = mo.id
JOIN marka m ON mo.marka_id = m.id
JOIN vevo ve ON v.vevo_id = ve.id
LEFT JOIN felhasznalo f ON ve.felhasznalo_id = f.id;
`;

// ============================================================================
// Kezdő adatok (Seed Data)
// ============================================================================
const markak = [
  { id: 1, nev: 'BMW' },
  { id: 2, nev: 'Audi' },
  { id: 3, nev: 'Volkswagen' },
  { id: 4, nev: 'Mercedes-Benz' },
  { id: 5, nev: 'Toyota' },
  { id: 6, nev: 'Ford' },
  { id: 7, nev: 'Hyundai' },
  { id: 8, nev: 'Skoda' },
  { id: 9, nev: 'Kia' }
];

const modellek = [
  { id: 1, marka_id: 1, nev: '320d Touring xDrive' },
  { id: 2, marka_id: 2, nev: 'A4 Avant 2.0 TDI S-Line' },
  { id: 3, marka_id: 3, nev: 'Golf VII 1.5 TSI Comfortline' },
  { id: 4, marka_id: 4, nev: 'C 220 d AMG Line' },
  { id: 5, marka_id: 5, nev: 'Corolla 1.8 Hybrid Comfort' },
  { id: 6, marka_id: 6, nev: 'Focus 1.0 EcoBoost Titanium' },
  { id: 7, marka_id: 1, nev: 'X3 xDrive20d M Sport' },
  { id: 8, marka_id: 7, nev: 'Tucson 1.6 T-GDI N Line' },
  { id: 9, marka_id: 8, nev: 'Octavia Combi 2.0 TDI Style' },
  { id: 10, marka_id: 2, nev: 'A3 Sedan 35 TFSI S tronic' },
  { id: 11, marka_id: 4, nev: 'E 300 de T-Modell Plug-in Hybrid' },
  { id: 12, marka_id: 9, nev: 'Ceed 1.4 T-GDI GT-Line' }
];

const kategoriak = [
  { id: 1, nev: 'Szedán' },
  { id: 2, nev: 'Kombi' },
  { id: 3, nev: 'SUV' },
  { id: 4, nev: 'Ferdehátú' },
  { id: 5, nev: 'Kupé' }
];

const uzemanyagok = [
  { id: 1, nev: 'Benzin' },
  { id: 2, nev: 'Dízel' },
  { id: 3, nev: 'Hibrid' },
  { id: 4, nev: 'Elektromos' },
  { id: 5, nev: 'Plug-in Hibrid' }
];

const valtok = [
  { id: 1, nev: 'Automata' },
  { id: 2, nev: 'Manuális' },
  { id: 3, nev: 'Félautomata' }
];

const szinek = [
  { id: 1, nev: 'Fekete metál' },
  { id: 2, nev: 'Szürke metál' },
  { id: 3, nev: 'Fehér' },
  { id: 4, nev: 'Ezüst metál' },
  { id: 5, nev: 'Kék metál' },
  { id: 6, nev: 'Piros' },
  { id: 7, nev: 'Barna metál' }
];

const allapotok = [
  { id: 1, nev: 'Újszerű' },
  { id: 2, nev: 'Kitűnő' },
  { id: 3, nev: 'Megkímélt' },
  { id: 4, nev: 'Sérülésmentes' },
  { id: 5, nev: 'Normál' }
];

const telepulesek = [
  { id: 1, nev: 'Budapest', irszam: '1138', megye: 'Budapest' },
  { id: 2, nev: 'Győr', irszam: '9024', megye: 'Győr-Moson-Sopron' },
  { id: 3, nev: 'Debrecen', irszam: '4031', megye: 'Hajdú-Bihar' },
  { id: 4, nev: 'Szeged', irszam: '6724', megye: 'Csongrád-Csanád' },
  { id: 5, nev: 'Kecskemét', irszam: '6000', megye: 'Bács-Kiskun' },
  { id: 6, nev: 'Pécs', irszam: '7621', megye: 'Baranya' }
];

const kereskedesek = [
  {
    id: 1,
    nev: 'AutoTrade Prémium Kft.',
    telepules_id: 1,
    cim: 'Váci út 150.',
    adoszam: '12345678-2-41',
    telefon: '+36 30 123 4567',
    email: 'premium@autotrade.hu'
  },
  {
    id: 2,
    nev: 'AutoTrade City',
    telepules_id: 3,
    cim: 'Kishegyesi út 42.',
    adoszam: '23456789-2-09',
    telefon: '+36 20 456 7890',
    email: 'city@autotrade.hu'
  },
  {
    id: 3,
    nev: 'AutoTrade Zöld Járművek',
    telepules_id: 4,
    cim: 'Rókusi krt. 12.',
    adoszam: '34567890-2-06',
    telefon: '+36 30 555 1234',
    email: 'zold@autotrade.hu'
  },
  {
    id: 4,
    nev: 'AutoTrade Győr',
    telepules_id: 2,
    cim: 'Fehérvári út 80.',
    adoszam: '45678901-2-08',
    telefon: '+36 70 987 6543',
    email: 'gyor@autotrade.hu'
  }
];

const szerepkorok = [
  { id: 1, nev: 'admin' },
  { id: 2, nev: 'elado' },
  { id: 3, nev: 'vevo' }
];

const felhasznalok = [
  { id: 1, nev: 'Admin Felhasználó', email: 'admin@autotrade.hu', szerepkor_id: 1 },
  { id: 2, nev: 'Kovács Eladó', email: 'elado@autotrade.hu', szerepkor_id: 2 },
  { id: 3, nev: 'Nagy Vevő', email: 'vevo@autotrade.hu', szerepkor_id: 3 },
  { id: 4, nev: 'Kiss Péter', email: 'kiss@example.com', szerepkor_id: 3 }
];

const vevok = [
  {
    id: 1,
    felhasznalo_id: 3,
    nev: 'Nagy Vevő',
    telepules_id: 1,
    lakcim: 'Kossuth Lajos utca 12.',
    adoszam: '8451239871',
    telefon: '+36 20 111 2233'
  },
  {
    id: 2,
    felhasznalo_id: 4,
    nev: 'Kiss Péter',
    telepules_id: 3,
    lakcim: 'Petőfi Sándor utca 5.',
    adoszam: '8394829102',
    telefon: '+36 30 222 3344'
  },
  {
    id: 3,
    felhasznalo_id: null,
    nev: 'Tóth Gábor',
    telepules_id: 2,
    lakcim: 'Baross Gábor út 18.',
    adoszam: null,
    telefon: '+36 70 333 4455'
  }
];

const autok = [
  {
    id: 1,
    alvazszam: 'WBA31AY06K1234567',
    modell_id: 1,
    kategoria_id: 2,
    uzemanyag_id: 2,
    valto_id: 1,
    szin_id: 1,
    allapot_id: 2,
    kereskedes_id: 1,
    evjarat: 2019,
    ar: 6890000,
    km_ora: 142000,
    teljesitmeny: 190,
    hengerurtartalom: 1995,
    leiras: 'Magyarországi első forgalomba helyezés, vezetett digitális szervizkönyv, sérülésmentes állapot.',
    kep: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 2,
    alvazszam: 'WAUZZZF43LA234567',
    modell_id: 2,
    kategoria_id: 2,
    uzemanyag_id: 2,
    valto_id: 1,
    szin_id: 2,
    allapot_id: 1,
    kereskedes_id: 4,
    evjarat: 2020,
    ar: 7950000,
    km_ora: 118000,
    teljesitmeny: 190,
    hengerurtartalom: 1968,
    leiras: 'S-Line külső-belső csomag, Matrix LED fényszórók, Virtual Cockpit, Apple CarPlay.',
    kep: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 3,
    alvazszam: 'WVWZZZAUZJP345678',
    modell_id: 3,
    kategoria_id: 4,
    uzemanyag_id: 1,
    valto_id: 2,
    szin_id: 3,
    allapot_id: 3,
    kereskedes_id: 2,
    evjarat: 2018,
    ar: 4690000,
    km_ora: 95000,
    teljesitmeny: 130,
    hengerurtartalom: 1498,
    leiras: 'Gazdaságos és megbízható 1.5 TSI motor hengerkapcsolással. Kétzónás digitális klíma.',
    kep: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  },
  {
    id: 4,
    alvazszam: 'WDD2050041R456789',
    modell_id: 4,
    kategoria_id: 1,
    uzemanyag_id: 2,
    valto_id: 1,
    szin_id: 4,
    allapot_id: 1,
    kereskedes_id: 1,
    evjarat: 2021,
    ar: 9850000,
    km_ora: 78000,
    teljesitmeny: 194,
    hengerurtartalom: 1950,
    leiras: 'AMG Line kivitel, panorámatető, Burmester hangrendszer, adaptív tempomat.',
    kep: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 5,
    alvazszam: 'SB1ZE3BE10E567890',
    modell_id: 5,
    kategoria_id: 2,
    uzemanyag_id: 3,
    valto_id: 1,
    szin_id: 3,
    allapot_id: 1,
    kereskedes_id: 3,
    evjarat: 2022,
    ar: 8490000,
    km_ora: 45000,
    teljesitmeny: 122,
    hengerurtartalom: 1798,
    leiras: 'Hibrid hajtáslánc 10 év akkumulátor garanciával, sávtartó automatika, tolatókamera.',
    kep: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 6,
    alvazszam: 'WF0KXXGCHK6789012',
    modell_id: 6,
    kategoria_id: 4,
    uzemanyag_id: 1,
    valto_id: 2,
    szin_id: 5,
    allapot_id: 2,
    kereskedes_id: 2,
    evjarat: 2019,
    ar: 4350000,
    km_ora: 88000,
    teljesitmeny: 125,
    hengerurtartalom: 999,
    leiras: 'Titanium felszereltség, fűthető szélvédő és ülések, Sync 3 navigáció, parkolóradar elöl-hátul.',
    kep: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  },
  {
    id: 7,
    alvazszam: 'WBATX31010L789012',
    modell_id: 7,
    kategoria_id: 3,
    uzemanyag_id: 2,
    valto_id: 1,
    szin_id: 1,
    allapot_id: 1,
    kereskedes_id: 1,
    evjarat: 2020,
    ar: 12490000,
    km_ora: 92000,
    teljesitmeny: 190,
    hengerurtartalom: 1995,
    leiras: 'M Sport csomag, Vernasca bőrkárpit, Professional navigáció, elektromos vonóhorog.',
    kep: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 8,
    alvazszam: 'TMAH3812AMJ890123',
    modell_id: 8,
    kategoria_id: 3,
    uzemanyag_id: 1,
    valto_id: 1,
    szin_id: 6,
    allapot_id: 2,
    kereskedes_id: 2,
    evjarat: 2021,
    ar: 8990000,
    km_ora: 62000,
    teljesitmeny: 150,
    hengerurtartalom: 1598,
    leiras: 'N Line sportos optika, 360 fokos kamera, Krell prémium hangrendszer, gyári garancia.',
    kep: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  },
  {
    id: 9,
    alvazszam: 'TMBJJ7NE5K0901234',
    modell_id: 9,
    kategoria_id: 2,
    uzemanyag_id: 2,
    valto_id: 1,
    szin_id: 2,
    allapot_id: 2,
    kereskedes_id: 4,
    evjarat: 2019,
    ar: 5490000,
    km_ora: 135000,
    teljesitmeny: 150,
    hengerurtartalom: 1968,
    leiras: 'Style felszereltség, hatalmas csomagtér, LED fényszórók, vezeték nélküli telefontöltő.',
    kep: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  },
  {
    id: 10,
    alvazszam: 'WAUZZZ8V7LA012345',
    modell_id: 10,
    kategoria_id: 1,
    uzemanyag_id: 1,
    valto_id: 1,
    szin_id: 3,
    allapot_id: 1,
    kereskedes_id: 1,
    evjarat: 2020,
    ar: 7290000,
    km_ora: 82000,
    teljesitmeny: 150,
    hengerurtartalom: 1498,
    leiras: 'Kompakt prémium szedán, S tronic váltó, Bang & Olufsen hifi, vezetett szervizkönyv.',
    kep: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  },
  {
    id: 11,
    alvazszam: 'WDD2132161A123456',
    modell_id: 11,
    kategoria_id: 2,
    uzemanyag_id: 5,
    valto_id: 1,
    szin_id: 1,
    allapot_id: 1,
    kereskedes_id: 3,
    evjarat: 2021,
    ar: 14200000,
    km_ora: 68000,
    teljesitmeny: 306,
    hengerurtartalom: 1950,
    leiras: 'Dízel Plug-in Hibrid, zöld rendszám, 50 km elektromos hatótáv, Widescreen Cockpit.',
    kep: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 1
  },
  {
    id: 12,
    alvazszam: 'U5YHN812AKL234567',
    modell_id: 12,
    kategoria_id: 4,
    uzemanyag_id: 1,
    valto_id: 2,
    szin_id: 5,
    allapot_id: 2,
    kereskedes_id: 2,
    evjarat: 2020,
    ar: 5290000,
    km_ora: 69000,
    teljesitmeny: 140,
    hengerurtartalom: 1353,
    leiras: 'GT-Line sportos kivitel, fűthető kormány és ülések, tolatókamera, gyári garancia.',
    kep: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80',
    kiemelt: 0
  }
];

const vasarlasok = [
  {
    id: 1,
    auto_id: 1,
    vevo_id: 1,
    ar: 6890000,
    datum: '2026-01-15 10:30:00'
  },
  {
    id: 2,
    auto_id: 3,
    vevo_id: 2,
    ar: 4690000,
    datum: '2026-02-20 14:15:00'
  }
];

const fizetesmodok = [
  { id: 1, nev: 'Átutalás' },
  { id: 2, nev: 'Készpénz' },
  { id: 3, nev: 'Bankkártya' },
  { id: 4, nev: 'Lízing / Hitel' }
];

const afakulcsok = [
  { id: 1, megnevezes: 'Normál kulcs (27%)', szazalek: 27 },
  { id: 2, megnevezes: 'Kedvezményes kulcs (5%)', szazalek: 5 },
  { id: 3, megnevezes: 'Adómentes (0%)', szazalek: 0 },
  { id: 4, megnevezes: 'Különbözet szerinti adózás', szazalek: 0 }
];

const szamlafejek = [
  {
    id: 1,
    szamlaszam: 'AT-2026/0001',
    vasarlas_id: 1,
    fizetesmod_id: 1,
    datum_telj: '2026-01-15',
    datum_szamla: '2026-01-15',
    datum_fizhat: '2026-01-22',
    datum_fizetve: '2026-01-15',
    megjegyzes: 'BMW 320d vásárlása'
  },
  {
    id: 2,
    szamlaszam: 'AT-2026/0002',
    vasarlas_id: 2,
    fizetesmod_id: 3,
    datum_telj: '2026-02-20',
    datum_szamla: '2026-02-20',
    datum_fizhat: '2026-02-20',
    datum_fizetve: '2026-02-20',
    megjegyzes: 'VW Golf VII vásárlása'
  }
];

const szamlatetelek = [
  {
    szamla_id: 1,
    sorszam: 1,
    auto_id: 1,
    megnevezes: 'BMW 320d Touring xDrive gépjármű',
    mennyiseg: 1,
    egysegar: 5425197,
    afakulcs_id: 1
  },
  {
    szamla_id: 1,
    sorszam: 2,
    auto_id: null,
    megnevezes: 'Eredetiségvizsgálat és átírási ügyintézés',
    mennyiseg: 1,
    egysegar: 35000,
    afakulcs_id: 1
  },
  {
    szamla_id: 2,
    sorszam: 1,
    auto_id: 3,
    megnevezes: 'Volkswagen Golf VII 1.5 TSI gépjármű',
    mennyiseg: 1,
    egysegar: 3692913,
    afakulcs_id: 1
  }
];

async function main() {
  const { DatabaseSync } = await import('node:sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Töröljük a meglévő adatbázist a tiszta újraépítéshez
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new DatabaseSync(dbPath);

  // 1. DDL futtatása (18 tábla, nézetek, triggerek)
  db.exec(DDL_SCRIPT);

  // 2. Adatok betöltése
  const insMarka = db.prepare('INSERT INTO marka (id, nev) VALUES (?, ?)');
  for (const item of markak) insMarka.run(item.id, item.nev);

  const insModell = db.prepare('INSERT INTO modell (id, marka_id, nev) VALUES (?, ?, ?)');
  for (const item of modellek) insModell.run(item.id, item.marka_id, item.nev);

  const insKategoria = db.prepare('INSERT INTO kategoria (id, nev) VALUES (?, ?)');
  for (const item of kategoriak) insKategoria.run(item.id, item.nev);

  const insUzemanyag = db.prepare('INSERT INTO uzemanyag (id, nev) VALUES (?, ?)');
  for (const item of uzemanyagok) insUzemanyag.run(item.id, item.nev);

  const insValto = db.prepare('INSERT INTO valto (id, nev) VALUES (?, ?)');
  for (const item of valtok) insValto.run(item.id, item.nev);

  const insSzin = db.prepare('INSERT INTO szin (id, nev) VALUES (?, ?)');
  for (const item of szinek) insSzin.run(item.id, item.nev);

  const insAllapot = db.prepare('INSERT INTO allapot (id, nev) VALUES (?, ?)');
  for (const item of allapotok) insAllapot.run(item.id, item.nev);

  const insTelepules = db.prepare('INSERT INTO telepules (id, nev, irszam, megye) VALUES (?, ?, ?, ?)');
  for (const item of telepulesek) insTelepules.run(item.id, item.nev, item.irszam, item.megye);

  const insKereskedes = db.prepare(`
    INSERT INTO kereskedes (id, nev, telepules_id, cim, adoszam, telefon, email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of kereskedesek) {
    insKereskedes.run(item.id, item.nev, item.telepules_id, item.cim, item.adoszam, item.telefon, item.email);
  }

  const insSzerepkor = db.prepare('INSERT INTO szerepkor (id, nev) VALUES (?, ?)');
  for (const item of szerepkorok) insSzerepkor.run(item.id, item.nev);

  const insFelhasznalo = db.prepare(`
    INSERT INTO felhasznalo (id, nev, email, szerepkor_id)
    VALUES (?, ?, ?, ?)
  `);
  for (const item of felhasznalok) insFelhasznalo.run(item.id, item.nev, item.email, item.szerepkor_id);

  const insVevo = db.prepare(`
    INSERT INTO vevo (id, felhasznalo_id, nev, telepules_id, lakcim, adoszam, telefon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of vevok) {
    insVevo.run(item.id, item.felhasznalo_id, item.nev, item.telepules_id, item.lakcim, item.adoszam, item.telefon);
  }

  const insAuto = db.prepare(`
    INSERT INTO auto (
      id, alvazszam, modell_id, kategoria_id, uzemanyag_id, valto_id, szin_id,
      allapot_id, kereskedes_id, evjarat, ar, km_ora, teljesitmeny, hengerurtartalom,
      leiras, kep, kiemelt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of autok) {
    insAuto.run(
      item.id, item.alvazszam, item.modell_id, item.kategoria_id, item.uzemanyag_id,
      item.valto_id, item.szin_id, item.allapot_id, item.kereskedes_id, item.evjarat,
      item.ar, item.km_ora, item.teljesitmeny, item.hengerurtartalom, item.leiras,
      item.kep, item.kiemelt
    );
  }

  const insVasarlas = db.prepare(`
    INSERT INTO vasarlas (id, auto_id, vevo_id, ar, datum)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const item of vasarlasok) {
    insVasarlas.run(item.id, item.auto_id, item.vevo_id, item.ar, item.datum);
  }

  const insFizetesmod = db.prepare('INSERT INTO fizetesmod (id, nev) VALUES (?, ?)');
  for (const item of fizetesmodok) insFizetesmod.run(item.id, item.nev);

  const insAfakulcs = db.prepare('INSERT INTO afakulcs (id, megnevezes, szazalek) VALUES (?, ?, ?)');
  for (const item of afakulcsok) insAfakulcs.run(item.id, item.megnevezes, item.szazalek);

  const insSzamlafej = db.prepare(`
    INSERT INTO szamlafej (
      id, szamlaszam, vasarlas_id, fizetesmod_id, datum_telj,
      datum_szamla, datum_fizhat, datum_fizetve, megjegyzes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of szamlafejek) {
    insSzamlafej.run(
      item.id, item.szamlaszam, item.vasarlas_id, item.fizetesmod_id,
      item.datum_telj, item.datum_szamla, item.datum_fizhat, item.datum_fizetve, item.megjegyzes
    );
  }

  const insSzamlatetel = db.prepare(`
    INSERT INTO szamlatetel (
      szamla_id, sorszam, auto_id, megnevezes, mennyiseg, egysegar, afakulcs_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of szamlatetelek) {
    insSzamlatetel.run(
      item.szamla_id, item.sorszam, item.auto_id, item.megnevezes,
      item.mennyiseg, item.egysegar, item.afakulcs_id
    );
  }

  db.close();
  console.log(`AutoTrade SQLite adatbázis sikeresen létrehozva 18 táblával: ${dbPath}`);

  // Szinkronizálás a frontend public könyvtárába
  if (fs.existsSync(frontendPublicDir)) {
    fs.copyFileSync(dbPath, frontendDbPath);
    console.log(`Szinkronizálva a frontendhez: ${frontendDbPath}`);
  }

  // Önálló schema.sql generálása
  generateSqlDump();
}

function generateSqlDump() {
  let sql = `-- ============================================================================
-- AutoTrade SQLite adatbázis séma és mintaadatok
-- Generálva az AutoTrade_adatbazis.dia ER-diagram alapján (18 tábla)
-- ============================================================================

${DDL_SCRIPT}

-- ----------------------------------------------------------------------------
-- Mintaadatok (Seed Data)
-- ----------------------------------------------------------------------------
`;

  function makeInserts(tableName, cols, rows) {
    const colList = cols.join(', ');
    const valuesList = rows.map(r => {
      const vals = cols.map(c => {
        const val = r[c];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `  (${vals.join(', ')})`;
    }).join(',\n');
    return `INSERT INTO ${tableName} (${colList}) VALUES\n${valuesList};\n\n`;
  }

  sql += makeInserts('marka', ['id', 'nev'], markak);
  sql += makeInserts('modell', ['id', 'marka_id', 'nev'], modellek);
  sql += makeInserts('kategoria', ['id', 'nev'], kategoriak);
  sql += makeInserts('uzemanyag', ['id', 'nev'], uzemanyagok);
  sql += makeInserts('valto', ['id', 'nev'], valtok);
  sql += makeInserts('szin', ['id', 'nev'], szinek);
  sql += makeInserts('allapot', ['id', 'nev'], allapotok);
  sql += makeInserts('telepules', ['id', 'nev', 'irszam', 'megye'], telepulesek);
  sql += makeInserts('kereskedes', ['id', 'nev', 'telepules_id', 'cim', 'adoszam', 'telefon', 'email'], kereskedesek);
  sql += makeInserts('szerepkor', ['id', 'nev'], szerepkorok);
  sql += makeInserts('felhasznalo', ['id', 'nev', 'email', 'szerepkor_id'], felhasznalok);
  sql += makeInserts('vevo', ['id', 'felhasznalo_id', 'nev', 'telepules_id', 'lakcim', 'adoszam', 'telefon'], vevok);
  sql += makeInserts('auto', [
    'id', 'alvazszam', 'modell_id', 'kategoria_id', 'uzemanyag_id', 'valto_id', 'szin_id',
    'allapot_id', 'kereskedes_id', 'evjarat', 'ar', 'km_ora', 'teljesitmeny', 'hengerurtartalom',
    'leiras', 'kep', 'kiemelt'
  ], autok);
  sql += makeInserts('vasarlas', ['id', 'auto_id', 'vevo_id', 'ar', 'datum'], vasarlasok);
  sql += makeInserts('fizetesmod', ['id', 'nev'], fizetesmodok);
  sql += makeInserts('afakulcs', ['id', 'megnevezes', 'szazalek'], afakulcsok);
  sql += makeInserts('szamlafej', [
    'id', 'szamlaszam', 'vasarlas_id', 'fizetesmod_id', 'datum_telj',
    'datum_szamla', 'datum_fizhat', 'datum_fizetve', 'megjegyzes'
  ], szamlafejek);
  sql += makeInserts('szamlatetel', [
    'szamla_id', 'sorszam', 'auto_id', 'megnevezes', 'mennyiseg', 'egysegar', 'afakulcs_id'
  ], szamlatetelek);

  fs.writeFileSync(sqlPath, sql, 'utf8');
  console.log(`SQL szkript kiírva: ${sqlPath}`);
  if (fs.existsSync(frontendPublicDir)) {
    fs.writeFileSync(frontendSqlPath, sql, 'utf8');
    console.log(`SQL szkript szinkronizálva frontendhez: ${frontendSqlPath}`);
  }
}

main().catch(console.error);
