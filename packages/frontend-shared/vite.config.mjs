// @ts-check
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import react from '@vitejs/plugin-react'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
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

const alias = [
  { find: '@cy/components', replacement: path.resolve(__dirname, './src/components') },
  { find: '@cy/gql-components', replacement: path.resolve(__dirname, './src/gql-components') },
  // `require('vue')` in a CommonJS-only dependency (vue3-file-selector) becomes
  // the runtime build `import 'vue'` already resolves to. The require condition
  // would pick vue/index.js, Vue's full CJS build, which bundles the template
  // compiler and a second copy of the runtime.
  { find: /^vue$/, replacement: 'vue/dist/vue.runtime.esm-bundler.js' },
]

const vueJsxIds = [
  /\.vue(?:\.(?:cy|spec))?\.tsx$/,
  // The `<script lang="tsx">` block of a `.vue` file, which Vite requests as
  // `Foo.vue?vue&type=script&setup=true&lang.tsx`
  /\.vue\?[^?]*lang\.tsx$/,
]

const makePlugins = (plugins) => {
  return ([
    vue(),
    // `built-in` compiles only the JSX and leaves TypeScript to Vite's Oxc
    // transform. Without it, plugin-vue-jsx limits Oxc to `.ts`, so React
    // `.tsx` files would never have their JSX compiled.
    vueJsx({ include: vueJsxIds, tsTransform: 'built-in' }),
    react({ include: /\.tsx$/, exclude: [/\/node_modules\//, ...vueJsxIds] }),
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
        // ~icons/logos/cursor
        logos: FileSystemIconLoader(path.resolve(__dirname, './src/assets/logos')),
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

  const { build, ...packageConfig } = config

  return {
    base,
    publicDir: path.resolve(__dirname, './src/public'),

    // Set after the package's options so app and launchpad can't ship with
    // different minification. Leave cssMinify unset: it follows minify, so the
    // --minify false that `yarn dev` passes keeps both JS and CSS readable.
    build: {
      ...build,
      minify: 'oxc',
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
    ...packageConfig,
  }
}

export default defineConfig(makeConfig())
