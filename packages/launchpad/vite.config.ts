import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import WindiCSS from 'vite-plugin-windicss'
import Components from 'vite-plugin-components'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    ViteIcons(),
    Components({
      customComponentResolvers: ViteIconsResolver(),
    }),
    WindiCSS(),
  ],
})
