import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import WindiCSS from 'vite-plugin-windicss'
import PurgeIcons from 'vite-plugin-purge-icons'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import VueSvgLoader from 'vite-svg-loader'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export default defineConfig({
  base: './',
  build: {
    minify: false,
  },
  plugins: [
    vue(),
    vueJsx(),
    Layouts(),
    Pages({
      extensions: ['vue'],
    }),
    PurgeIcons(),
    VueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
    }),
    Icons({
      customCollections: {
        // ~icons/cy/book-x16
        cy: FileSystemIconLoader('./src/assets/icons'),
      },
    }),
    Components({
      // <i-cy-book-x16/>
      resolvers: IconsResolver({
        customCollections: ['cy'],
      }),
    }),
    WindiCSS({
      configFiles: [require.resolve('./.windicss/windi.config')],
    }),
    VueSvgLoader(),
  ],
  define: {
    'process.env': {},
    'setImmediate': {},
  },
})
