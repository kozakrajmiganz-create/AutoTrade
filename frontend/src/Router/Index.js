import { createRouter, createWebHistory } from 'vue-router'

import Home from '../Views/Home.vue'
import Autok from '../Views/Autok.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/autok', component: Autok },
  { path: '/Autok', redirect: '/autok' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router