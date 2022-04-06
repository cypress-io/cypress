import path from 'path'
import sinon from 'sinon'
import { expect } from 'chai'
import { once, EventEmitter } from 'events'
import http from 'http'
import fs from 'fs'
import { webpackDevServerFacts } from '../src/webpackDevServerFacts'

import { devServer, startDevServer } from '../'

const requestSpecFile = (file: string, port: number) => {
  return new Promise((res) => {
    const opts = {
      host: 'localhost',
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
  devServer: webpackDevServerFacts.isV3()
    ? { contentBase: root }
    : { static: { directory: root } },

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

const config = {
  projectRoot: root,
  supportFile: '',
  isTextTerminal: true,
  devServerPublicPathRoute: root,
  indexHtmlFile: path.join(__dirname, 'component-index.html'),
} as any as Cypress.ResolvedConfigOptions & Cypress.RuntimeConfigOptions

describe('#startDevServer', () => {
  it('serves specs via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('foo.spec.js'),
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile('/test/fixtures/foo.spec.js', port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await close()
  })

  it('serves specs in directory with [] chars via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('[foo]/bar.spec.js'),
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile('/test/fixtures/[foo]/bar.spec.js', port as number)

    expect(response).to.eq(`it('this is a spec with a path containing []', () => {})\n`)

    return new Promise((res) => {
      close(() => res())
    })
  })

  it('serves specs in directory with non English chars via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('サイプレス.spec.js'),
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile('/test/fixtures/サイプレス.spec.js', port as number)

    expect(response).to.eq(`it('サイプレス', () => {})\n`)

    return new Promise((res) => {
      close(() => res())
    })
  })

  it('serves specs in directory with ... in the file name via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('[...bar].spec.js'),
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile('/test/fixtures/[...bar].spec.js', port as number)

    expect(response).to.eq(`it('...bar', () => {})\n`)

    return new Promise((res) => {
      close(() => res())
    })
  })

  it('serves a file with spaces via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('foo bar.spec.js'),
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile('/test/fixtures/foo bar.spec.js', port as number)

    expect(response).to.eq(`it('this is a spec with a path containing a space', () => {})\n`)

    return new Promise((res) => {
      close(() => res())
    })
  })

  it('emits dev-server:compile:success event on successful compilation', async () => {
    const devServerEvents = new EventEmitter()
    const { close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('foo.spec.js'),
        devServerEvents,
      },
    })

    await once(devServerEvents, 'dev-server:compile:success')
    await close()
  })

  it('emits dev-server:compile:error event on error compilation', async () => {
    const devServerEvents = new EventEmitter()
    const exitSpy = sinon.stub()

    const badSpec = `${root}/test/fixtures/compilation-fails.spec.js`
    const { close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: [
          {
            name: badSpec,
            relative: badSpec,
            absolute: badSpec,
          },
        ],
        devServerEvents,
      },
    }, exitSpy as any)

    const [err] = await once(devServerEvents, 'dev-server:compile:error')

    expect(err).to.contain('Module parse failed: Unexpected token (1:5)')
    expect(err).to.contain('You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders')
    expect(err).to.contain('> this is an invalid spec file')
    expect(exitSpy.calledOnce).to.be.true

    await close()
  })

  it('touches browser.js when a spec file is added and recompile', async function () {
    const devServerEvents = new EventEmitter()
    const { close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: createSpecs('foo.spec.js'),
        devServerEvents,
      },
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

    await close()
  })

  it('accepts the devServer signature', async function () {
    const devServerEvents = new EventEmitter()
    const { port, close } = await devServer(
      {
        config,
        specs: createSpecs('foo.spec.js'),
        devServerEvents,
      },
      { webpackConfig },
    )

    const response = await requestSpecFile('/test/fixtures/foo.spec.js', port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await close()
  })
})
.timeout(5000)
