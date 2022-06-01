import path from 'path'
import { expect } from 'chai'
import { once, EventEmitter } from 'events'
import http from 'http'
import fs from 'fs'

import { devServer } from '..'
import { restoreLoadHook } from '../src/helpers/sourceRelativeWebpackModules'
import './support'

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

const webpackConfig = {
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

const cypressConfig = {
  projectRoot: root,
  supportFile: '',
  isTextTerminal: true,
  devServerPublicPathRoute: root,
  indexHtmlFile: path.join(__dirname, 'component-index.html'),
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

    await new Promise<void>((resolve, reject) => {
      close((err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
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

    return new Promise((res) => {
      close(() => res())
    })
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

    return new Promise((res) => {
      close(() => res())
    })
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

    return new Promise((res) => {
      close(() => res())
    })
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

    return new Promise((res) => {
      close(() => res())
    })
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
    await new Promise<void>((resolve, reject) => {
      close((err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })

  it('touches browser.js when a spec file is added and recompile', async function () {
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

    const oldmtime = fs.statSync('./dist/browser.js').mtimeMs

    await once(devServerEvents, 'dev-server:compile:success')
    devServerEvents.emit('dev-server:specs:changed', [newSpec])

    await once(devServerEvents, 'dev-server:compile:success')
    const updatedmtime = fs.statSync('./dist/browser.js').mtimeMs

    expect(oldmtime).to.not.equal(updatedmtime)

    await new Promise<void>((resolve, reject) => {
      close((err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
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

    await new Promise<void>((resolve, reject) => {
      close((err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  })
})
.timeout(5000)
