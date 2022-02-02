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

import PkgConfig from 'vite-plugin-package-config'

// eslint-disable-next-line no-duplicate-imports
import type { UserConfig } from 'vite'
import type { ArgumentsType } from '@antfu/utils'

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
  '@cy/gql-components': path.resolve(__dirname, './src/gql-components'),

  // import { defaultMessages, useI18n } from '@cy/i18n'
  '@cy/i18n': path.resolve(__dirname, './src/locales/i18n'),
}

const makePlugins = (plugins) => {
  return ([
    vue(),
    vueJsx(), // Used mostly for testing in *.(t|j)sx files.
    VueI18n({
      include: path.resolve(__dirname, './src/locales/**'),
      ...plugins.vueI18nOptions,
    }),
    Icons({
      // 1em. Default, without this options is 1.2em.
      // If you notice that your icons are bigger than they should be, this
      // is probably why.
      scale: 1,
      customCollections: {
        // ~icons/cy/book_x16
        cy: FileSystemIconLoader(path.resolve(__dirname, './src/assets/icons')),
        ...plugins.iconsOptions?.customCollections,
      },
      ...plugins.iconsOptions,
    }),
    Components({
      resolvers: IconsResolver({
        // <i-cy-book_x16/>
        customCollections: ['cy'],
      }),
      ...plugins?.componentsOptions,
    }),
    WindiCSS(),
    VueSvgLoader(),

    // package.json is modified and auto-updated when new cjs dependencies
    // are added
    PkgConfig(),
    // OptimizationPersist(),
    // For new plugins only! Merge options for shared plugins via PluginOptions.
    ...(plugins?.plugins || []),
  ])
}

export const makeConfig = (config: Partial<UserConfig> = {}, plugins: PluginOptions = {}): UserConfig => {
  // Don't overwrite plugins
  delete config.plugins

  return {
    base,
    publicDir: path.resolve(__dirname, './src/public'),

    // Production-only build options
    build: {
      minify: false,
    },

    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "file:///${path.resolve(__dirname, '../reporter/src/lib/variables.scss').replaceAll('\\', '/')}" as *;\n`,
        },
      },
    },

    resolve: {
      alias,
      dedupe: [
        'vue',
        '@vue/compiler-core',
        '@vue/compiler-dom',
        '@vue/compiler-sfc',
        '@vueuse/core',
        '@urql/core',
        '@urql/devtools',
        '@urql/exchange-execute',
        '@urql/exchange-graphcache',
        '@urql/vue',
      ],
    },

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
