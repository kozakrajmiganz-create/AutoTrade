import { createRouter, createWebHistory } from 'vue-router'

import Autok from '../Views/Autok.vue'


const routes = [

    { path: '/autok', component: Autok },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router