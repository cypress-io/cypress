/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import { resolve } from 'pathe'
import { mergeConfig } from 'vite'
import { configFiles } from './constants'
import { Cypress, CypressInspect } from './plugins/index'
import debugFn from 'debug'
import type { StartDevServer } from './types'
import { importModule } from 'local-pkg'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createConfig = async ({ options, viteConfig: viteOverrides = {} }: StartDevServer) => {
  const root = resolve(process.cwd())
  const { default: findUp } = await importModule('find-up')
  const configFile = await findUp(configFiles, { cwd: root } as { cwd: string })

  if (configFile) {
    debug('resolved config file at', configFile, 'using root', root)
  } else if (viteOverrides) {
    debug('Couldn\'t find a Vite config file, however we received a custom viteConfig', viteOverrides)
  } else {
    debug(`
    Didn\'t resolve a Vite config AND the user didn\'t pass in a custom viteConfig.
    Falling back to Vite\'s defaults.`)
  }

  const config = {
    root,
    configFile,
    plugins: [
      Cypress(options),
      await CypressInspect(),
    ],
  }

  return mergeConfig(config, viteOverrides)
}
