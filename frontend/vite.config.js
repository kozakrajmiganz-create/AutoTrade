import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // 0.0.0.0-ra köti a szervert, hogy ne csak a belső localhoston, hanem a kódszerver külső IP-jén/domainjén is elérhető legyen
    host: true,
    port: 5173,
    strictPort: true,
    // Vite 6+ esetén szükséges, hogy ne blokkolja a kódszerveres / proxyzott hostneveket
    allowedHosts: true,
    cors: true,
    // Proxy beállítása: a frontendből indított /api kéréseket átirányítja a backend szerverre (3000-es port)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
