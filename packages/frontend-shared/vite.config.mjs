// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import VueSvgLoader from 'vite-svg-loader'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

import PkgConfig from 'vite-plugin-package-config'

// @ts-expect-error
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    vueI18n({
      include: path.resolve(__dirname, './src/locales/**/*.json'),
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
      iconCustomizer (collection, icon, props) {
        if (icon.includes('_x')) {
          const [, size] = icon.split('_x')

          if (Number(size)) {
            props.style = `min-width: ${size}px; min-height: ${size}px`
          }
        }
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
    // CyCSSVitePlugin({
    //   scan: {
    //     // accepts globs and file paths relative to project root
    //     include: [
    //       'index.html',
    //       '**/*.{vue,html,tsx}',
    //       path.resolve(__dirname, '../frontend-shared/**/*.{vue,html,tsx,svg}'),
    //       path.resolve(__dirname, '../app/**/*.{vue,html,tsx,svg}'),
    //       path.resolve(__dirname, '../launchpad/**/*.{vue,html,tsx,svg}'),
    //     ],
    //     exclude: ['node_modules/**/*', '.git/**/*'],
    //   },
    // }),
    VueSvgLoader(),

    // package.json is modified and auto-updated when new cjs dependencies
    // are added
    // @ts-expect-error
    PkgConfig.default(),
    // OptimizationPersist(),
    // For new plugins only! Merge options for shared plugins via PluginOptions.
    ...(plugins?.plugins || []),
  ])
}

/**
 * @typedef PluginOptions
 * @type {object}
 * @property {import('@antfu/utils').ArgumentsType<typeof vueI18n>[0]=} vueI18nOptions
 * @property {import('@antfu/utils').ArgumentsType<typeof Icons>[0]=} VueI18n
 * @property {import('@antfu/utils').ArgumentsType<typeof Components>[0]=} componentOptions

 *
 * @param {import('vite').UserConfig} config
 * @param {PluginOptions} plugins
 * @returns {import('vite').UserConfig}
 */
export const makeConfig = (config = {}, plugins = {}) => {
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
    server: {
      fs: {
        // Since we're in a monorepo, we're going to serve packages from
        // npm/vue/dist/* and other local places. This enables us to do that.
        // https://vitejs.dev/config/#server-fs-strict
        strict: false,
      },
    },

    // You cannot add or remove arbitrary options from shared plugins.
    // Please use the PluginsOverride option for this.
    plugins: makePlugins(plugins),
    define: {
      'process.env': {
        CYPRESS_INTERNAL_ENV: 'development',
        NODE_ENV: process.env.NODE_ENV,
      },
      // Fix to get cypress-plugin-tab to work in CT
      'process.version': '99',
      'setImmediate': {},
    },
    ...config,
  }
}

export default defineConfig(makeConfig())
