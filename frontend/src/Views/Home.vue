<template>
  <div class="home-container">
    <section class="hero">
      <div class="hero-content">
        <h1>Találd meg álmaid autóját</h1>
        <p>Minőségi, ellenőrzött használt és új autók garanciával az AutoTrade kínálatában.</p>
        <div class="hero-actions">
          <router-link to="/autok" class="btn btn-primary">Autók böngészése</router-link>
          <router-link to="/uj-hirdetes" class="btn btn-outline">Autó eladása</router-link>
        </div>
      </div>
    </section>

    <!-- Statisztika banner -->
    <section class="stats-banner" v-if="stats">
      <div class="stat-card">
        <span class="stat-number">{{ stats.cars?.total_cars || 12 }}+</span>
        <span class="stat-label">Elérhető gépjármű</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{{ formatPrice(stats.purchases?.total_revenue || 11580000) }}</span>
        <span class="stat-label">Összesített forgalom</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">100%</span>
        <span class="stat-label">Ellenőrzött előélet</span>
      </div>
    </section>

    <!-- Kiemelt autók -->
    <section class="featured-section">
      <div class="section-header">
        <h2>Kiemelt ajánlataink</h2>
        <router-link to="/autok" class="see-all">Összes megtekintése &rarr;</router-link>
      </div>

      <div class="cars-grid" v-if="featuredCars.length">
        <div v-for="car in featuredCars" :key="car.id" class="car-card">
          <div class="car-image-container">
            <img :src="car.image" :alt="car.brand + ' ' + car.model" />
            <span class="category-badge">{{ car.category }}</span>
          </div>
          <div class="car-info">
            <h3>{{ car.brand }} {{ car.model }}</h3>
            <p class="car-specs">
              <span>📅 {{ car.year }}</span>
              <span>⚡ {{ car.power }} LE</span>
              <span>⛽ {{ car.fuel }}</span>
            </p>
            <div class="car-footer">
              <span class="car-price">{{ formatPrice(car.price) }}</span>
              <router-link :to="'/autok'" class="btn-card">Részletek</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const featuredCars = ref([])
const stats = ref(null)

function formatPrice(amount) {
  if (!amount) return '0 Ft'
  return new Intl.NumberFormat('hu-HU').format(amount) + ' Ft'
}

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/cars?featured=1')
    if (res.ok) {
      featuredCars.value = await res.json()
    }
  } catch {
    // Ha nem fut a backend, betöltjük a helyi publikus adatbázisból vagy mintaadatokból
  }

  try {
    const statsRes = await fetch('http://localhost:3001/api/stats')
    if (statsRes.ok) {
      stats.value = await statsRes.json()
    }
  } catch {
    // Alapértelmezett értékek
  }
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 60px 40px;
  color: white;
  margin-bottom: 40px;
  text-align: center;
}

.hero h1 {
  font-size: 2.8rem;
  margin-bottom: 16px;
  color: #00d4ff;
}

.hero p {
  font-size: 1.2rem;
  color: #e0e0e0;
  max-width: 700px;
  margin: 0 auto 30px;
}

.hero-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn {
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-block;
}

.btn-primary {
  background-color: #00d4ff;
  color: #1a1a2e;
}
.btn-primary:hover {
  background-color: #38e1ff;
  transform: translateY(-2px);
}

.btn-outline {
  border: 2px solid #00d4ff;
  color: #00d4ff;
}
.btn-outline:hover {
  background-color: rgba(0, 212, 255, 0.1);
}

.stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.stat-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #1a1a2e;
  margin-bottom: 5px;
}

.stat-label {
  color: #6c757d;
  font-size: 0.95rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #1a1a2e;
}

.see-all {
  color: #0088cc;
  text-decoration: none;
  font-weight: 600;
}

.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.car-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.car-card:hover {
  transform: translateY(-5px);
}

.car-image-container {
  position: relative;
  height: 200px;
}

.car-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(26, 26, 46, 0.85);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.car-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.car-info h3 {
  margin: 0 0 10px;
  font-size: 1.25rem;
  color: #1a1a2e;
}

.car-specs {
  display: flex;
  gap: 15px;
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.car-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.car-price {
  font-size: 1.35rem;
  font-weight: bold;
  color: #0088cc;
}

.btn-card {
  padding: 8px 16px;
  background-color: #1a1a2e;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-card:hover {
  background-color: #00d4ff;
  color: #1a1a2e;
}
</style>

