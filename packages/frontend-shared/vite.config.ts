import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import WindiCSS from 'vite-plugin-windicss'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import VueSvgLoader from 'vite-svg-loader'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

// eslint-disable-next-line no-duplicate-imports
import type { UserConfig } from 'vite'
import { ArgumentsType } from '@antfu/utils'

type PluginOptions = {
  plugins?: any[]

  // These types aren't publicly exported
  vueI18nOptions?: ArgumentsType<typeof VueI18n>[0]
  iconsOptions?: ArgumentsType<typeof Icons>[0]
  componentsOptions?: ArgumentsType<typeof Components>[0]
}

const base = './'

const alias = {
  '@cy/components': path.resolve(__dirname, './src/components'),

  // import { defaultMessages, useI18n } from '@cy/i18n'
  '@cy/i18n': path.resolve(__dirname, './src/locales/i18n'),
}

const makePlugins = (plugins) => {
  return ([
    vue(),
    vueJsx(),
    VueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
      ...plugins.vueI18nOptions,
    }),
    Icons({
      customCollections: {
      // ~icons/cy/book-x16
        cy: FileSystemIconLoader(path.resolve(__dirname, './src/assets/icons')),
        ...plugins.iconsOptions?.customCollections,
      },
      ...plugins.iconsOptions,
    }),
    Components({
    // <i-cy-book-x16/>
      resolvers: IconsResolver({
        customCollections: ['cy'],
      }),
      ...plugins?.componentsOptions,
    }),
    WindiCSS(),
    VueSvgLoader(),
    // For new plugins only! Merge options for shared plugins via PluginOptions.
    ...(plugins?.plugins || []),
  ])
}

export const makeConfig = (config: Partial<UserConfig> = {}, plugins: PluginOptions = {}): UserConfig => {
  // Don't overwrite plugins
  delete config.plugins

  return {
    base,

    // Production-only build options
    build: {
      minify: false,
    },

    resolve: { alias },

    // You cannot add or remove arbitrary options from shared plugins.
    // Please use the PluginsOverride option for this.
    plugins: makePlugins(plugins),
    define: {
      'process.env': {
        CYPRESS_INTERNAL_ENV: 'development',
      },
      'setImmediate': {},
    },
    ...config,
  }
}

export default defineConfig(makeConfig())
