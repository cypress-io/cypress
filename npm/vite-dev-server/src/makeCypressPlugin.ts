import { EventEmitter } from 'events'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { Plugin } from 'vite'
import { render } from 'mustache'

const pluginName = 'cypress-transform-html'

const INIT_FILEPATH = resolve(__dirname, '../client/initCypressTests.js')

export const makeCypressPlugin = (
  projectRoot: string,
  supportFilePath: string,
  devServerEvents: EventEmitter,
): Plugin => {
  let base = '/'

  return {
    name: pluginName,
    enforce: 'pre',
    configResolved (config) {
      base = config.base
    },
    transformIndexHtml () {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: render(readFileSync(INIT_FILEPATH, 'utf-8'), {
            supportFilePath: resolve(projectRoot, supportFilePath),
            originAutUrl: '/__cypress/iframes',
          }),
        },
      ]
    },
    handleHotUpdate: () => {
      // restart tests when code is updated
      devServerEvents.emit('dev-server:compile:success')

      return []
    },
  }
}
