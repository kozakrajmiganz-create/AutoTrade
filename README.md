# AutoTrade

A projekt két fő részre van bontva: `frontend` és `backend`.

## Projekt struktúra

```
AutoTrade/
├── frontend/             # Vue 3 + Vite frontend alkalmazás
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/              # Adatbázis és backend kiszolgáló eszközök
│   ├── create_sqlite.js  # SQLite adatbázis generáló és feltöltő szkript
│   ├── database.sqlite   # SQLite adatbázis
│   └── package.json
├── Docs/                 # Dokumentáció (UserStory, stb.)
└── package.json          # Központi parancsok
```

## Használat

### Frontend indítása
```bash
npm run frontend:dev
# vagy belépve a mappába:
cd frontend
npm run dev
```

### Backend adatbázis újragenerálása
```bash
npm run backend:create-db
# vagy belépve a mappába:
cd backend
npm run create-db
```
