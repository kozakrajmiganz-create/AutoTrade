<template>
  <div class="autok-container">
    <div class="page-header">
      <h1>Kínálatunkban lévő autók</h1>
      <p>Böngéssz az ellenőrzött minőségű autók között vagy használd a szűrőt.</p>
    </div>

    <!-- Értesítési sáv vásárlás vagy művelet után -->
    <div v-if="notification" class="alert-banner" :class="notification.type">
      {{ notification.message }}
      <button @click="notification = null" class="close-btn">&times;</button>
    </div>

    <div class="content-layout">
      <!-- Szűrő oldalsáv -->
      <aside class="filter-sidebar">
        <div class="filter-group">
          <label>Keresés</label>
          <input
            type="text"
            v-model="filters.search"
            placeholder="Márka, modell..."
            @input="fetchCars"
          />
        </div>

        <div class="filter-group">
          <label>Kategória</label>
          <select v-model="filters.category" @change="fetchCars">
            <option value="">Összes kategória</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Üzemanyag</label>
          <select v-model="filters.fuel" @change="fetchCars">
            <option value="">Összes üzemanyag</option>
            <option value="Benzin">Benzin</option>
            <option value="Dízel">Dízel</option>
            <option value="Hibrid">Hibrid</option>
            <option value="Elektromos">Elektromos</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Maximum ár: {{ formatPrice(filters.maxPrice) }}</label>
          <input
            type="range"
            v-model="filters.maxPrice"
            min="2000000"
            max="15000000"
            step="500000"
            @change="fetchCars"
          />
        </div>

        <button @click="resetFilters" class="btn-reset">Szűrők törlése</button>
      </aside>

      <!-- Autólista -->
      <main class="cars-main">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Autók betöltése...</p>
        </div>

        <div v-else-if="cars.length === 0" class="empty-state">
          <p>Nem található a szűrési feltételeknek megfelelő gépjármű.</p>
          <button @click="resetFilters" class="btn-reset">Szűrők visszaállítása</button>
        </div>

        <div v-else class="cars-grid">
          <div v-for="car in cars" :key="car.id" class="car-card">
            <div class="car-image">
              <img :src="car.image" :alt="car.brand + ' ' + car.model" />
              <span class="badge category-badge">{{ car.category }}</span>
              <span v-if="car.featured" class="badge featured-badge">Kiemelt</span>
            </div>

            <div class="car-details">
              <h2>{{ car.brand }} {{ car.model }}</h2>
              <div class="specs-grid">
                <span><strong>Évjárat:</strong> {{ car.year }}</span>
                <span><strong>Futás:</strong> {{ formatKm(car.mileage) }}</span>
                <span><strong>Üzemanyag:</strong> {{ car.fuel }}</span>
                <span><strong>Váltó:</strong> {{ car.transmission }}</span>
                <span><strong>Teljesítmény:</strong> {{ car.power }} LE</span>
                <span><strong>Szín:</strong> {{ car.color }}</span>
              </div>

              <p class="car-description">{{ car.description }}</p>

              <div class="seller-box">
                <small>Eladó: <strong>{{ car.seller_name }}</strong> ({{ car.seller_city }})</small>
                <small v-if="car.seller_phone">📞 {{ car.seller_phone }}</small>
              </div>

              <div class="card-footer">
                <div class="price-tag">{{ formatPrice(car.price) }}</div>
                <div class="card-actions">
                  <button @click="openBuyModal(car)" class="btn-buy">Megveszem</button>
                  <button @click="deleteCar(car.id)" class="btn-delete" title="Adminisztrátori törlés">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Vásárlás Modal (Vevő jogosultság User Story) -->
    <div v-if="selectedCar" class="modal-overlay" @click.self="selectedCar = null">
      <div class="modal-content">
        <h3>Autó vásárlása</h3>
        <p class="modal-subtitle">{{ selectedCar.brand }} {{ selectedCar.model }} - {{ formatPrice(selectedCar.price) }}</p>

        <form @submit.prevent="submitPurchase">
          <div class="form-group">
            <label>Az Ön neve:</label>
            <input type="text" v-model="purchaseForm.name" required placeholder="pl. Minta János" />
          </div>
          <div class="form-group">
            <label>E-mail címe:</label>
            <input type="email" v-model="purchaseForm.email" required placeholder="pl. janos@example.com" />
          </div>

          <div class="modal-actions">
            <button type="button" @click="selectedCar = null" class="btn-cancel">Mégse</button>
            <button type="submit" class="btn-confirm" :disabled="submitting">
              {{ submitting ? 'Feldolgozás...' : 'Vásárlás megerősítése' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const cars = ref([])
const categories = ref([])
const loading = ref(false)
const submitting = ref(false)
const notification = ref(null)
const selectedCar = ref(null)

const filters = reactive({
  search: '',
  category: '',
  fuel: '',
  maxPrice: 15000000
})

const purchaseForm = reactive({
  name: '',
  email: ''
})

function formatPrice(val) {
  if (!val) return '0 Ft'
  return new Intl.NumberFormat('hu-HU').format(val) + ' Ft'
}

function formatKm(val) {
  if (!val) return '0 km'
  return new Intl.NumberFormat('hu-HU').format(val) + ' km'
}

async function fetchCars() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.category) params.append('category', filters.category)
    if (filters.fuel) params.append('fuel', filters.fuel)
    if (filters.maxPrice < 15000000) params.append('maxPrice', filters.maxPrice)

    const res = await fetch(`http://localhost:3001/api/cars?${params.toString()}`)
    if (res.ok) {
      cars.value = await res.json()
    }
  } catch (err) {
    console.warn('Backend API nem érhető el, ellenőrizd hogy fut-e a szerver:', err)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const res = await fetch('http://localhost:3001/api/categories')
    if (res.ok) {
      categories.value = await res.json()
    }
  } catch {
    // Alapértelmezett kategóriák
    categories.value = [
      { id: 1, name: 'Szedán' },
      { id: 2, name: 'Kombi' },
      { id: 3, name: 'SUV' },
      { id: 4, name: 'Ferdehátú' },
      { id: 5, name: 'Kupé' }
    ]
  }
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
  filters.fuel = ''
  filters.maxPrice = 15000000
  fetchCars()
}

function openBuyModal(car) {
  selectedCar.value = car
  purchaseForm.name = ''
  purchaseForm.email = ''
}

async function submitPurchase() {
  submitting.value = true
  try {
    const res = await fetch('http://localhost:3001/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_id: selectedCar.value.id,
        buyer_name: purchaseForm.name,
        buyer_email: purchaseForm.email
      })
    })

    if (res.ok) {
      const data = await res.json()
      notification.value = {
        type: 'success',
        message: data.message || 'Gratulálunk! Sikeresen megvásároltad az autót.'
      }
      selectedCar.value = null
    } else {
      const err = await res.json()
      notification.value = { type: 'error', message: err.error || 'Hiba a vásárlás során!' }
    }
  } catch (e) {
    notification.value = { type: 'error', message: 'Hálózati hiba a vásárláskor: ' + e.message }
  } finally {
    submitting.value = false
  }
}

async function deleteCar(id) {
  if (!confirm('Biztosan törölni szeretnéd ezt az autót a rendszerből? (Adminisztrátori művelet)')) return

  try {
    const res = await fetch(`http://localhost:3001/api/cars/${id}`, { method: 'DELETE' })
    if (res.ok) {
      notification.value = { type: 'success', message: 'Autó sikeresen törölve az adatbázisból!' }
      fetchCars()
    } else {
      const err = await res.json()
      notification.value = { type: 'error', message: err.error || 'Hiba a törlés során!' }
    }
  } catch (e) {
    notification.value = { type: 'error', message: 'Hiba: ' + e.message }
  }
}

onMounted(() => {
  fetchCategories()
  fetchCars()
})
</script>

<style scoped>
.autok-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 25px;
}
.page-header h1 {
  font-size: 2rem;
  color: #1a1a2e;
  margin-bottom: 5px;
}
.page-header p {
  color: #6c757d;
}

.alert-banner {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.alert-banner.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.alert-banner.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
}

.content-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 30px;
}

@media (max-width: 850px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}

.filter-sidebar {
  background: #fdfdfd;
  border: 1px solid #e9ecef;
  padding: 20px;
  border-radius: 12px;
  height: fit-content;
}

.filter-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: #333;
}

.filter-group input,
.filter-group select {
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.95rem;
}

.btn-reset {
  width: 100%;
  padding: 10px;
  background: #e9ecef;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-reset:hover {
  background: #dee2e6;
}

.cars-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.car-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  display: grid;
  grid-template-columns: 300px 1fr;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}
.car-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.09);
}

@media (max-width: 650px) {
  .car-card {
    grid-template-columns: 1fr;
  }
}

.car-image {
  position: relative;
  min-height: 220px;
}
.car-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}
.category-badge {
  top: 10px;
  left: 10px;
  background: rgba(26, 26, 46, 0.85);
  color: white;
}
.featured-badge {
  top: 10px;
  right: 10px;
  background: #ffb703;
  color: #1a1a2e;
}

.car-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.car-details h2 {
  font-size: 1.35rem;
  margin: 0 0 10px;
  color: #1a1a2e;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  font-size: 0.85rem;
  color: #495057;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.car-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12px;
}

.seller-box {
  background: #f1f3f5;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #495057;
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.price-tag {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0088cc;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.btn-buy {
  padding: 10px 20px;
  background-color: #2ec4b6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-buy:hover {
  background-color: #20a396;
}

.btn-delete {
  background: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete:hover {
  background: #ffe3e3;
  border-color: #ffa8a8;
}

/* Modal stílusok */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-subtitle {
  color: #0088cc;
  font-weight: 600;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 5px;
  font-weight: 600;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 18px;
  background: #e9ecef;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-confirm {
  padding: 10px 22px;
  background: #2ec4b6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
