import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), vue()],
})
