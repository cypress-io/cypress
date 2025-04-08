import path from 'path'
import { expect } from 'chai'
import { once, EventEmitter } from 'events'
import http from 'http'
import fs from 'fs-extra'

import { devServer } from '..'
import { restoreLoadHook } from '../src/helpers/sourceRelativeWebpackModules'
import './support'
import type { ConfigHandler } from '../src/devServer'

const requestSpecFile = (file: string, port: number) => {
  return new Promise((res) => {
    const opts = {
      host: '127.0.0.1',
      port,
      path: encodeURI(file),
    }

    const callback = (response: EventEmitter) => {
      let str = ''

      response.on('data', (chunk) => {
        str += chunk
      })

      response.on('end', () => {
        res(str)
      })
    }

    http.request(opts, callback).end()
  })
}

const root = path.join(__dirname, '..')

const webpackConfig: ConfigHandler = {
  devServer: { static: { directory: root } },
}

const createSpecs = (name: string): Cypress.Cypress['spec'][] => {
  return [
    {
      name: `${root}/test/fixtures/${name}`,
      relative: `${root}/test/fixtures/${name}`,
      absolute: `${root}/test/fixtures/${name}`,
    },
  ]
}

type DevServerCloseFn = Awaited<ReturnType<typeof devServer>>['close']

const closeServer = async (closeFn: DevServerCloseFn) => {
  await new Promise<void>((resolve, reject) => {
    closeFn((err?: Error) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

const cypressConfig = {
  projectRoot: root,
  supportFile: '',
  isTextTerminal: true,
  devServerPublicPathRoute: root,
  indexHtmlFile: 'test/component-index.html',
} as any as Cypress.PluginConfigOptions

describe('#devServer', () => {
  beforeEach(() => {
    delete require.cache
    restoreLoadHook()
  })

  after(() => {
    restoreLoadHook()
  })

  it('serves specs via a webpack dev server', async () => {
    const { port, close } = await devServer({
      cypressConfig,
      webpackConfig,
      specs: createSpecs('foo.spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/foo.spec.js', port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await closeServer(close)
  })

  it('serves specs in directory with [] chars via a webpack dev server', async () => {
    const { port, close } = await devServer({
      cypressConfig,
      webpackConfig,
      specs: createSpecs('[foo]/bar.spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/[foo]/bar.spec.js', port as number)

    expect(response).to.eq(`it('this is a spec with a path containing []', () => {})\n`)

    return closeServer(close)
  })

  it('serves specs in directory with non English chars via a webpack dev server', async () => {
    const { port, close } = await devServer({
      webpackConfig,
      cypressConfig,
      specs: createSpecs('サイプレス.spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/サイプレス.spec.js', port as number)

    expect(response).to.eq(`it('サイプレス', () => {})\n`)

    return closeServer(close)
  })

  it('serves specs in directory with ... in the file name via a webpack dev server', async () => {
    const { port, close } = await devServer({
      webpackConfig,
      cypressConfig,
      specs: createSpecs('[...bar].spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/[...bar].spec.js', port as number)

    expect(response).to.eq(`it('...bar', () => {})\n`)

    return closeServer(close)
  })

  it('serves a file with spaces via a webpack dev server', async () => {
    const { port, close } = await devServer({
      webpackConfig,
      cypressConfig,
      specs: createSpecs('foo bar.spec.js'),
      devServerEvents: new EventEmitter(),
    })

    const response = await requestSpecFile('/test/fixtures/foo bar.spec.js', port as number)

    expect(response).to.eq(`it('this is a spec with a path containing a space', () => {})\n`)

    return closeServer(close)
  })

  it('emits dev-server:compile:success event on successful compilation', async () => {
    const devServerEvents = new EventEmitter()
    const { close } = await devServer({
      webpackConfig,
      cypressConfig,
      specs: createSpecs('foo.spec.js'),
      devServerEvents,
    })

    await once(devServerEvents, 'dev-server:compile:success')

    await closeServer(close)
  })

  it('touches component index when a spec file is added and recompile', async function () {
    // File watching only enabled when running in `open` mode
    cypressConfig.isTextTerminal = false
    const devServerEvents = new EventEmitter()
    const { close } = await devServer({
      webpackConfig,
      cypressConfig,
      specs: createSpecs('foo.spec.js'),
      devServerEvents,
    })

    const newSpec: Cypress.Cypress['spec'] = {
      name: `${root}/test/fixtures/bar.spec.js`,
      relative: `${root}/test/fixtures/bar.spec.js`,
      absolute: `${root}/test/fixtures/bar.spec.js`,
    }

    const oldmtime = fs.statSync(cypressConfig.indexHtmlFile).mtimeMs

    await once(devServerEvents, 'dev-server:compile:success')
    devServerEvents.emit('dev-server:specs:changed', {
      specs: [newSpec],
    })

    await once(devServerEvents, 'dev-server:compile:success')
    const updatedmtime = fs.statSync(cypressConfig.indexHtmlFile).mtimeMs

    expect(oldmtime).to.not.equal(updatedmtime)

    await closeServer(close)
  })

  ;[{
    title: 'does not watch/recompile files in `run` mode',
    isRunMode: true,
    updateExpected: false,
    message: 'Files should not be watched in `run` mode',
  }, {
    title: 'watches and recompiles files on change in `open` mode',
    isRunMode: false,
    updateExpected: true,
    message: 'Files should be watched and automatically rebuild on update in `open` mode',
  }].forEach(({ title, isRunMode, updateExpected, message }) => {
    it(title, async () => {
      const originalContent = await fs.readFile(`./test/fixtures/dependency.js`)

      try {
        cypressConfig.devServerPublicPathRoute = '/__cypress/src'
        cypressConfig.isTextTerminal = isRunMode
        const devServerEvents = new EventEmitter()
        const { close, port } = await devServer({
          webpackConfig: {},
          cypressConfig,
          specs: createSpecs('bar.spec.js'),
          devServerEvents,
        })

        // Wait for initial "ready" from server
        await once(devServerEvents, 'dev-server:compile:success')

        // Get the initial version of the bundled spec
        const original = await requestSpecFile('/__cypress/src/spec-0.js', port)

        // Update a dependency of the spec
        await fs.writeFile('./test/fixtures/dependency.js', `window.TEST = true;${originalContent}`)
        // Brief wait to give server time to detect changes
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Re-fetch the spec
        const updated = await requestSpecFile('/__cypress/src/spec-0.js', port)

        if (updateExpected) {
          expect(original, message).not.to.equal(updated)
        } else {
          expect(original, message).to.equal(updated)
        }

        await closeServer(close)
      } finally {
        fs.writeFile('./test/fixtures/dependency.js', originalContent)
      }
    })
  })

  it('accepts the devServer signature', async function () {
    const devServerEvents = new EventEmitter()
    const { port, close } = await devServer(
      {
        cypressConfig,
        specs: createSpecs('foo.spec.js'),
        devServerEvents,
        webpackConfig,
      },
    )

    const response = await requestSpecFile('/test/fixtures/foo.spec.js', port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await closeServer(close)
  })
})
.timeout(5000)
