import sqlite3
import os
import json

db_dir = os.path.join(os.path.dirname(__file__), 'vue-project', 'public')
db_path = os.path.join(db_dir, 'database.sqlite')
json_path = os.path.join(db_dir, 'database.json')

if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Cars table
cursor.execute('''
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
)
''')

# Categories table
cursor.execute('''
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
)
''')

# Dealers table
cursor.execute('''
CREATE TABLE IF NOT EXISTS dealers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL
)
''')

# Load data from database.json if available
if os.path.exists(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for car in data.get('cars', []):
        seller = car.get('seller', {})
        cursor.execute('''
            INSERT INTO cars (
                id, brand, model, year, price, mileage, fuel, transmission,
                power, engine_size, category, color, condition, description,
                image, featured, seller_name, seller_city, seller_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            car['id'],
            car['brand'],
            car['model'],
            car['year'],
            car['price'],
            car['mileage'],
            car['fuel'],
            car['transmission'],
            car['power'],
            car.get('engineSize'),
            car['category'],
            car['color'],
            car['condition'],
            car['description'],
            car['image'],
            1 if car.get('featured') else 0,
            seller.get('name', ''),
            seller.get('city', ''),
            seller.get('phone', '')
        ))

    for cat in data.get('categories', []):
        cursor.execute('INSERT INTO categories (id, name) VALUES (?, ?)', (cat['id'], cat['name']))

    for dealer in data.get('dealers', []):
        cursor.execute('''
            INSERT INTO dealers (id, name, city, address, phone, email)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (dealer['id'], dealer['name'], dealer['city'], dealer['address'], dealer['phone'], dealer['email']))

conn.commit()
conn.close()
print(f"Successfully created SQLite database at: {db_path}")
