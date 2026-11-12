-- ============================================================================
-- AutoTrade SQLite adatbázis séma és mintaadatok
-- Generálva az AutoTrade_adatbazis.dia ER-diagram alapján (18 tábla)
-- ============================================================================


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


-- ----------------------------------------------------------------------------
-- Mintaadatok (Seed Data)
-- ----------------------------------------------------------------------------
INSERT INTO marka (id, nev) VALUES
  (1, 'BMW'),
  (2, 'Audi'),
  (3, 'Volkswagen'),
  (4, 'Mercedes-Benz'),
  (5, 'Toyota'),
  (6, 'Ford'),
  (7, 'Hyundai'),
  (8, 'Skoda'),
  (9, 'Kia');

INSERT INTO modell (id, marka_id, nev) VALUES
  (1, 1, '320d Touring xDrive'),
  (2, 2, 'A4 Avant 2.0 TDI S-Line'),
  (3, 3, 'Golf VII 1.5 TSI Comfortline'),
  (4, 4, 'C 220 d AMG Line'),
  (5, 5, 'Corolla 1.8 Hybrid Comfort'),
  (6, 6, 'Focus 1.0 EcoBoost Titanium'),
  (7, 1, 'X3 xDrive20d M Sport'),
  (8, 7, 'Tucson 1.6 T-GDI N Line'),
  (9, 8, 'Octavia Combi 2.0 TDI Style'),
  (10, 2, 'A3 Sedan 35 TFSI S tronic'),
  (11, 4, 'E 300 de T-Modell Plug-in Hybrid'),
  (12, 9, 'Ceed 1.4 T-GDI GT-Line');

INSERT INTO kategoria (id, nev) VALUES
  (1, 'Szedán'),
  (2, 'Kombi'),
  (3, 'SUV'),
  (4, 'Ferdehátú'),
  (5, 'Kupé');

INSERT INTO uzemanyag (id, nev) VALUES
  (1, 'Benzin'),
  (2, 'Dízel'),
  (3, 'Hibrid'),
  (4, 'Elektromos'),
  (5, 'Plug-in Hibrid');

INSERT INTO valto (id, nev) VALUES
  (1, 'Automata'),
  (2, 'Manuális'),
  (3, 'Félautomata');

INSERT INTO szin (id, nev) VALUES
  (1, 'Fekete metál'),
  (2, 'Szürke metál'),
  (3, 'Fehér'),
  (4, 'Ezüst metál'),
  (5, 'Kék metál'),
  (6, 'Piros'),
  (7, 'Barna metál');

INSERT INTO allapot (id, nev) VALUES
  (1, 'Újszerű'),
  (2, 'Kitűnő'),
  (3, 'Megkímélt'),
  (4, 'Sérülésmentes'),
  (5, 'Normál');

INSERT INTO telepules (id, nev, irszam, megye) VALUES
  (1, 'Budapest', '1138', 'Budapest'),
  (2, 'Győr', '9024', 'Győr-Moson-Sopron'),
  (3, 'Debrecen', '4031', 'Hajdú-Bihar'),
  (4, 'Szeged', '6724', 'Csongrád-Csanád'),
  (5, 'Kecskemét', '6000', 'Bács-Kiskun'),
  (6, 'Pécs', '7621', 'Baranya');

INSERT INTO kereskedes (id, nev, telepules_id, cim, adoszam, telefon, email) VALUES
  (1, 'AutoTrade Prémium Kft.', 1, 'Váci út 150.', '12345678-2-41', '+36 30 123 4567', 'premium@autotrade.hu'),
  (2, 'AutoTrade City', 3, 'Kishegyesi út 42.', '23456789-2-09', '+36 20 456 7890', 'city@autotrade.hu'),
  (3, 'AutoTrade Zöld Járművek', 4, 'Rókusi krt. 12.', '34567890-2-06', '+36 30 555 1234', 'zold@autotrade.hu'),
  (4, 'AutoTrade Győr', 2, 'Fehérvári út 80.', '45678901-2-08', '+36 70 987 6543', 'gyor@autotrade.hu');

INSERT INTO szerepkor (id, nev) VALUES
  (1, 'admin'),
  (2, 'elado'),
  (3, 'vevo');

INSERT INTO felhasznalo (id, nev, email, szerepkor_id) VALUES
  (1, 'Admin Felhasználó', 'admin@autotrade.hu', 1),
  (2, 'Kovács Eladó', 'elado@autotrade.hu', 2),
  (3, 'Nagy Vevő', 'vevo@autotrade.hu', 3),
  (4, 'Kiss Péter', 'kiss@example.com', 3);

INSERT INTO vevo (id, felhasznalo_id, nev, telepules_id, lakcim, adoszam, telefon) VALUES
  (1, 3, 'Nagy Vevő', 1, 'Kossuth Lajos utca 12.', '8451239871', '+36 20 111 2233'),
  (2, 4, 'Kiss Péter', 3, 'Petőfi Sándor utca 5.', '8394829102', '+36 30 222 3344'),
  (3, NULL, 'Tóth Gábor', 2, 'Baross Gábor út 18.', NULL, '+36 70 333 4455');

INSERT INTO auto (id, alvazszam, modell_id, kategoria_id, uzemanyag_id, valto_id, szin_id, allapot_id, kereskedes_id, evjarat, ar, km_ora, teljesitmeny, hengerurtartalom, leiras, kep, kiemelt) VALUES
  (1, 'WBA31AY06K1234567', 1, 2, 2, 1, 1, 2, 1, 2019, 6890000, 142000, 190, 1995, 'Magyarországi első forgalomba helyezés, vezetett digitális szervizkönyv, sérülésmentes állapot.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80', 1),
  (2, 'WAUZZZF43LA234567', 2, 2, 2, 1, 2, 1, 4, 2020, 7950000, 118000, 190, 1968, 'S-Line külső-belső csomag, Matrix LED fényszórók, Virtual Cockpit, Apple CarPlay.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80', 1),
  (3, 'WVWZZZAUZJP345678', 3, 4, 1, 2, 3, 3, 2, 2018, 4690000, 95000, 130, 1498, 'Gazdaságos és megbízható 1.5 TSI motor hengerkapcsolással. Kétzónás digitális klíma.', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80', 0),
  (4, 'WDD2050041R456789', 4, 1, 2, 1, 4, 1, 1, 2021, 9850000, 78000, 194, 1950, 'AMG Line kivitel, panorámatető, Burmester hangrendszer, adaptív tempomat.', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80', 1),
  (5, 'SB1ZE3BE10E567890', 5, 2, 3, 1, 3, 1, 3, 2022, 8490000, 45000, 122, 1798, 'Hibrid hajtáslánc 10 év akkumulátor garanciával, sávtartó automatika, tolatókamera.', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=80', 1),
  (6, 'WF0KXXGCHK6789012', 6, 4, 1, 2, 5, 2, 2, 2019, 4350000, 88000, 125, 999, 'Titanium felszereltség, fűthető szélvédő és ülések, Sync 3 navigáció, parkolóradar elöl-hátul.', 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80', 0),
  (7, 'WBATX31010L789012', 7, 3, 2, 1, 1, 1, 1, 2020, 12490000, 92000, 190, 1995, 'M Sport csomag, Vernasca bőrkárpit, Professional navigáció, elektromos vonóhorog.', 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1000&q=80', 1),
  (8, 'TMAH3812AMJ890123', 8, 3, 1, 1, 6, 2, 2, 2021, 8990000, 62000, 150, 1598, 'N Line sportos optika, 360 fokos kamera, Krell prémium hangrendszer, gyári garancia.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80', 0),
  (9, 'TMBJJ7NE5K0901234', 9, 2, 2, 1, 2, 2, 4, 2019, 5490000, 135000, 150, 1968, 'Style felszereltség, hatalmas csomagtér, LED fényszórók, vezeték nélküli telefontöltő.', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80', 0),
  (10, 'WAUZZZ8V7LA012345', 10, 1, 1, 1, 3, 1, 1, 2020, 7290000, 82000, 150, 1498, 'Kompakt prémium szedán, S tronic váltó, Bang & Olufsen hifi, vezetett szervizkönyv.', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=80', 0),
  (11, 'WDD2132161A123456', 11, 2, 5, 1, 1, 1, 3, 2021, 14200000, 68000, 306, 1950, 'Dízel Plug-in Hibrid, zöld rendszám, 50 km elektromos hatótáv, Widescreen Cockpit.', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=80', 1),
  (12, 'U5YHN812AKL234567', 12, 4, 1, 2, 5, 2, 2, 2020, 5290000, 69000, 140, 1353, 'GT-Line sportos kivitel, fűthető kormány és ülések, tolatókamera, gyári garancia.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80', 0);

INSERT INTO vasarlas (id, auto_id, vevo_id, ar, datum) VALUES
  (1, 1, 1, 6890000, '2026-01-15 10:30:00'),
  (2, 3, 2, 4690000, '2026-02-20 14:15:00');

INSERT INTO fizetesmod (id, nev) VALUES
  (1, 'Átutalás'),
  (2, 'Készpénz'),
  (3, 'Bankkártya'),
  (4, 'Lízing / Hitel');

INSERT INTO afakulcs (id, megnevezes, szazalek) VALUES
  (1, 'Normál kulcs (27%)', 27),
  (2, 'Kedvezményes kulcs (5%)', 5),
  (3, 'Adómentes (0%)', 0),
  (4, 'Különbözet szerinti adózás', 0);

INSERT INTO szamlafej (id, szamlaszam, vasarlas_id, fizetesmod_id, datum_telj, datum_szamla, datum_fizhat, datum_fizetve, megjegyzes) VALUES
  (1, 'AT-2026/0001', 1, 1, '2026-01-15', '2026-01-15', '2026-01-22', '2026-01-15', 'BMW 320d vásárlása'),
  (2, 'AT-2026/0002', 2, 3, '2026-02-20', '2026-02-20', '2026-02-20', '2026-02-20', 'VW Golf VII vásárlása');

INSERT INTO szamlatetel (szamla_id, sorszam, auto_id, megnevezes, mennyiseg, egysegar, afakulcs_id) VALUES
  (1, 1, 1, 'BMW 320d Touring xDrive gépjármű', 1, 5425197, 1),
  (1, 2, NULL, 'Eredetiségvizsgálat és átírási ügyintézés', 1, 35000, 1),
  (2, 1, 3, 'Volkswagen Golf VII 1.5 TSI gépjármű', 1, 3692913, 1);

