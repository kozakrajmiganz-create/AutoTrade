<script setup>
import AutoTrade from './components/AutoTrade.vue'
</script>

<template>
  <header>
  </header>
<div>
    <!-- Itt lesz a menü -->
    <nav class="navbar">
      <div class="logo">AutoTrade</div>
      <ul class="menu">
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/Autok">Autók</router-link></li>
        <li><router-link to="/about">Rólunk</router-link></li>
        <li><router-link to="/contact">Kapcsolat</router-link></li>
      </ul>
    </nav>

    <!-- Itt jelenik meg az aktuális oldal -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
 





<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
