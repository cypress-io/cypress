/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import { importModule } from 'local-pkg'
import { relative, resolve, join } from 'pathe'
import { mergeConfig } from 'vite'
import { configFiles } from './constants'
import { Cypress, CypressInspect } from './plugins/index'
import type { StartDevServer } from './types'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createConfig = async ({ options, viteConfig: viteOverrides = {} }: StartDevServer) => {
  const root = options.config.projectRoot || resolve(process.cwd())
  const binaryRoot = options.config.cypressBinaryRoot!
  const { default: findUp } = await importModule('find-up')
  const configFile = await findUp(configFiles, { cwd: root } as { cwd: string })

  // INFO logging, a lot is logged here.
  // debug('all dev-server options are', options)

  if (configFile) {
    debug('resolved config file at', configFile, 'using root', root)
  } else if (viteOverrides) {
    debug('Couldn\'t find a Vite config file, however we received a custom viteConfig', viteOverrides)
  } else {
    debug(`
    Didn\'t resolve a Vite config AND the user didn\'t pass in a custom viteConfig.
    Falling back to Vite\'s defaults.`)
  }

  debug(`Resolving to Vue, React, and Mount Utils packages here:`,
    join(binaryRoot, 'npm/vue'),
    join(binaryRoot, 'npm/react'),
    join(binaryRoot, 'npm/mount-utils'))

  const config = {
    root,
    base: `/${options.config.namespace}/src/`,
    configFile,
    server: {
      fs: {
        // https://vitejs.dev/config/#server-fs-allow
        //
        // By default, Vite only allows dependency scanning within the user's own project directories.
        // Cypress will load npm/* projects as external modules from the binary's location.
        // Because the Cypress binary is not located within the user's node_modules,
        // Vite needs to be explicitly allowed to traverse the cypressBinaryRoot directory.
        //
        // If `resolve.alias` did not map to a cypressBinaryRoot outside of the user's own project,
        // then this line would not be necessary.
        allow: [binaryRoot],
      },
    },
    resolve: {
      alias: [
        {
          find: 'cypress/vue',
          replacement: join(binaryRoot, 'npm/vue'),
        },
        {
          find: 'cypress/mount-utils',
          replacement: join(binaryRoot, 'npm/mount-utils'),
        },
        {
          find: 'cypress/react',
          replacement: join(binaryRoot, 'npm/react'),
        },
      ],
    },
    optimizeDeps: {
      entries: [
        ...options.specs.map((s) => relative(root, s.relative)),
        options.config.supportFile ?? resolve(root, options.config.supportFile),
      ].filter((v) => v != null),
    },
    plugins: [
      Cypress(options),
      await CypressInspect(),
    ],
  }

  const finalConfig = mergeConfig(config, viteOverrides)

  debug('The resolved server config is', JSON.stringify(finalConfig, null, 2))

  return finalConfig
}
