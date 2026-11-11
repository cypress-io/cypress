// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import VueSvgLoader from 'vite-svg-loader'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

import PkgConfig from 'vite-plugin-package-config'

// @ts-expect-error - import.meta is only valid in an ES module, and this file is checked as a script
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const base = './'

const alias = {
  '@cy/components': path.resolve(__dirname, './src/components'),
  '@cy/gql-components': path.resolve(__dirname, './src/gql-components'),
}

const makePlugins = (plugins) => {
  return ([
    vue(),
    vueJsx(), // Used mostly for testing in *.(t|j)sx files.
    Icons({
      // 1em. Default, without this options is 1.2em.
      // If you notice that your icons are bigger than they should be, this
      // is probably why.
      scale: 1,
      iconCustomizer (collection, icon, props) {
        if (icon.includes('_x')) {
          const [, size] = icon.split('_x')

          if (Number(size)) {
            props.style = `min-width: ${size}px; min-height: ${size}px`
          }
        }
      },
      ...plugins.iconsOptions,
      // After the iconsOptions spread, so a caller's collections are merged
      // with the built-in ones instead of replacing them
      customCollections: {
        // ~icons/cy/book_x16
        cy: FileSystemIconLoader(path.resolve(__dirname, './src/assets/icons')),
        // ~icons/logos/cursor
        logos: FileSystemIconLoader(path.resolve(__dirname, './src/assets/logos')),
        ...plugins.iconsOptions?.customCollections,
      },
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
    // @ts-expect-error - the CJS module puts its plugin on .default under Node ESM interop
    PkgConfig.default(),
    // OptimizationPersist(),
    // For new plugins only! Merge options for shared plugins via PluginOptions.
    ...(plugins?.plugins || []),
  ])
}

/**
 * @typedef PluginOptions
 * @type {object}
 * @property {import('@antfu/utils').ArgumentsType<typeof Icons>[0]=} iconsOptions
 * @property {import('@antfu/utils').ArgumentsType<typeof Components>[0]=} componentsOptions
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

    // Shared plugins can't be replaced through `config`. Change their options
    // through the PluginOptions argument instead.
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
