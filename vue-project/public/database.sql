-- AutoTrade SQLite Database Dump
-- Készült: database.sqlite

DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS dealers;

CREATE TABLE cars (
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

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE dealers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL
);

-- Kategóriák feltöltése
INSERT INTO categories (id, name) VALUES (1, 'Szedán');
INSERT INTO categories (id, name) VALUES (2, 'Kombi');
INSERT INTO categories (id, name) VALUES (3, 'SUV');
INSERT INTO categories (id, name) VALUES (4, 'Ferdehátú');
INSERT INTO categories (id, name) VALUES (5, 'Kupé');

-- Kereskedések feltöltése
INSERT INTO dealers (id, name, city, address, phone, email) VALUES
(1, 'AutoTrade Prémium Kft.', 'Budapest', '1138 Budapest, Váci út 150.', '+36 30 123 4567', 'premium@autotrade.hu'),
(2, 'AutoTrade City', 'Debrecen', '4031 Debrecen, Kishegyesi út 42.', '+36 20 456 7890', 'city@autotrade.hu'),
(3, 'AutoTrade Zöld Járművek', 'Szeged', '6724 Szeged, Rókusi krt. 12.', '+36 30 555 1234', 'zold@autotrade.hu');

-- Autók feltöltése
INSERT INTO cars (id, brand, model, year, price, mileage, fuel, transmission, power, engine_size, category, color, condition, description, image, featured, seller_name, seller_city, seller_phone) VALUES
(1, 'BMW', '320d Touring xDrive', 2019, 6890000, 142000, 'Dízel', 'Automata', 190, 1995, 'Kombi', 'Fekete metál', 'Kitűnő', 'Magyarországi első forgalomba helyezés, vezetett digitális szervizkönyv, sérülésmentes állapot.', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80', 1, 'AutoTrade Prémium Kft.', 'Budapest', '+36 30 123 4567'),
(2, 'Audi', 'A4 Avant 2.0 TDI S-Line', 2020, 7950000, 118000, 'Dízel', 'Automata', 190, 1968, 'Kombi', 'Szürke metál', 'Újszerű', 'S-Line külső-belső csomag, Matrix LED fényszórók, Virtual Cockpit, Apple CarPlay.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1000&q=80', 1, 'AutoTrade Prémium Kft.', 'Győr', '+36 70 987 6543'),
(3, 'Volkswagen', 'Golf VII 1.5 TSI Comfortline', 2018, 4690000, 95000, 'Benzin', 'Manuális', 130, 1498, 'Ferdehátú', 'Fehér', 'Megkímélt', 'Gazdaságos és megbízható 1.5 TSI motor hengerkapcsolással. Kétzónás digitális klíma.', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade City', 'Debrecen', '+36 20 456 7890'),
(4, 'Mercedes-Benz', 'C 220 d AMG Line', 2021, 9850000, 78000, 'Dízel', 'Automata', 194, 1950, 'Szedán', 'Ezüst metál', 'Újszerű', 'AMG Line kivitel, panorámatető, Burmester hangrendszer, adaptív tempomat.', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80', 1, 'AutoTrade Prémium Kft.', 'Budapest', '+36 30 123 4567'),
(5, 'Toyota', 'RAV4 2.5 Hybrid Selection', 2022, 11200000, 42000, 'Hibrid', 'Automata', 218, 2487, 'SUV', 'Kék metál', 'Újszerű', 'Gyári garanciális Toyota hibrid, rendkívül alacsony fogyasztás, 360 fokos kamera.', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=80', 1, 'AutoTrade Zöld Járművek', 'Szeged', '+36 30 555 1234'),
(6, 'Ford', 'Focus Kombi 1.0 EcoBoost ST-Line', 2019, 4890000, 105000, 'Benzin', 'Manuális', 125, 999, 'Kombi', 'Piros', 'Megkímélt', 'Sportos ST-Line felszereltség, fűthető szélvédő és ülések, navigáció.', 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade City', 'Székesfehérvár', '+36 20 333 4444'),
(7, 'Skoda', 'Octavia Combi 2.0 TDI DSG Style', 2020, 6450000, 139000, 'Dízel', 'Automata', 150, 1968, 'Kombi', 'Fehér', 'Kitűnő', 'Hatalmas csomagtér, DSG váltó, adaptív tempomat, Full LED fényszórók.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade Flotta', 'Budapest', '+36 30 777 8899'),
(8, 'Tesla', 'Model 3 Long Range Dual Motor', 2022, 12490000, 36000, 'Elektromos', 'Automata', 440, 0, 'Szedán', 'Fekete', 'Újszerű', '580 km WLTP hatótáv, összkerékhajtás, Prémium fekete belső tér, Autopilot.', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=80', 1, 'AutoTrade Zöld Járművek', 'Budapest', '+36 30 555 1234'),
(9, 'Hyundai', 'Tucson 1.6 T-GDI Prime 4WD', 2021, 8990000, 58000, 'Benzin', 'Automata', 150, 1598, 'SUV', 'Sötétszürke metál', 'Kitűnő', 'Garanciális autó. Digitális műszerfal, KRELL hifi, sávtartó automatika.', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade City', 'Miskolc', '+36 70 111 2233'),
(10, 'Mazda', '6 Sedan 2.0 Skyactiv-G Revolution', 2018, 5490000, 112000, 'Benzin', 'Manuális', 165, 1998, 'Szedán', 'Soul Red Crystal (Bordó)', 'Megkímélt', 'Soul Red fényezés, Revolution csomag bőr belsővel, Head-up display, Bose audio.', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade City', 'Pécs', '+36 20 666 7788'),
(11, 'Volvo', 'XC60 2.0 D4 AWD Inscription', 2019, 8750000, 128000, 'Dízel', 'Automata', 190, 1969, 'SUV', 'Barna metál', 'Kitűnő', 'Inscription luxusfelszereltség, Nappa bőrkárpit, Harman Kardon hangrendszer, Pilot Assist.', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade Prémium Kft.', 'Budapest', '+36 30 123 4567'),
(12, 'Kia', 'Ceed 1.4 T-GDI GT-Line', 2020, 5290000, 69000, 'Benzin', 'Manuális', 140, 1353, 'Ferdehátú', 'Kék metál', 'Kitűnő', 'GT-Line sportos kivitel, fűthető kormány és ülések, tolatókamera, gyári garancia.', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80', 0, 'AutoTrade City', 'Kecskemét', '+36 30 888 9900');
