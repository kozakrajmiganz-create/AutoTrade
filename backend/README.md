# AutoTrade - Backend API

Kezdetleges, pehelysúlyú REST API szerver Node.js és SQLite alapokon az AutoTrade autókereskedő rendszerhez.

## Jellemzők

- **Zéró külső függőség:** A Node.js v22+ beépített `node:http` és `node:sqlite` moduljait használja.
- **CORS támogatás:** Kész a frontenddel (`http://localhost:5173`) való kommunikációra.
- **SQLite integráció:** Automatikus adatbázis-kezelés és szinkronizáció.

## Fájlok a mappában

- `server.js` - A HTTP REST API szerver és a végpontok logikája.
- `create_sqlite.js` - Az adatbázis tábláit és kezdeti mintaadatait legeneráló szkript.
- `database.sqlite` - A helyi SQLite adatbázis állomány.
- `package.json` - A backend futtatási szkriptjei.

## Futtatás

### 1. Adatbázis inicializálása / újragenerálása
```bash
npm run create-db
# vagy: node create_sqlite.js
```

### 2. Szerver elindítása
```bash
npm start
# vagy fejlesztői módban (automatikus újraindítás módosításkor):
npm run dev
```

A szerver alapértelmezés szerint a **`http://localhost:3001`** címen érhető el.

---

## API Végpontok

### Autók (`/api/cars`)
| Metódus | Végpont | Leírás | Szűrők (Query Params) |
|---|---|---|---|
| `GET` | `/api/cars` | Autók lekérése | `search`, `brand`, `category`, `fuel`, `maxPrice`, `featured` |
| `GET` | `/api/cars/:id` | Egy autó adatlapja | - |
| `POST` | `/api/cars` | Új autó feltöltése | JSON body (márka, modell, ár, stb.) |
| `PUT` | `/api/cars/:id` | Autó adatainak módosítása | JSON body |
| `DELETE` | `/api/cars/:id` | Autó törlése az adatbázisból | - |

### Vásárlások (`/api/purchases`)
| Metódus | Végpont | Leírás |
|---|---|---|
| `POST` | `/api/purchases` | Autó megvásárlásának rögzítése (`car_id`, `buyer_name`, `buyer_email`) |
| `GET` | `/api/purchases` | Vásárlások listája |

### Felhasználók és Bejelentkezés (`/api/users`)
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET` | `/api/users` | Felhasználók listája (szűrhető: `?role=vevo` / `elado` / `admin`) |
| `POST` | `/api/users/login` | Bejelentkezés szimuláció (`email` vagy `role` megadásával) |
| `DELETE` | `/api/users/:id` | Felhasználó törlése (admin védelemmel) |

### Kategóriák, Partnerek és Statisztika
| Metódus | Végpont | Leírás |
|---|---|---|
| `GET` | `/api/categories` | Elérhető járműkategóriák listája |
| `GET` | `/api/dealers` | Hivatalos viszonteladók és telephelyek |
| `GET` | `/api/stats` | Készletérték és összesített értékesítési árbevétel |

