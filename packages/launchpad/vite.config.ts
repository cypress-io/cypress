import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import WindiCSS from 'vite-plugin-windicss'
import PurgeIcons from 'vite-plugin-purge-icons'
import Components from 'vite-plugin-components'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import VueSvgLoader from 'vite-svg-loader'

export default defineConfig({
  base: './',
  build: {
    minify: false,
  },
  plugins: [
    vue(),
    vueJsx(),
    ViteIcons(),
    PurgeIcons(),
    VueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
    }),
    Components({
      customComponentResolvers: ViteIconsResolver(),
    }),
    WindiCSS(),
    VueSvgLoader(),
  ],
  define: {
    'process.env': {},

  },
})
