import path from 'path'
import sinon from 'sinon'
import { expect } from 'chai'
import { once, EventEmitter } from 'events'
import http from 'http'
import fs from 'fs'
import { webpackDevServerFacts } from '../src/webpackDevServerFacts'

import { devServer, startDevServer } from '../'

const requestSpecFile = (port: number) => {
  return new Promise((res) => {
    const opts = {
      host: 'localhost',
      port,
      path: '/test/fixtures/foo.spec.js',
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

const specs: Cypress.Cypress['spec'][] = [
  {
    name: `${root}/test/fixtures/foo.spec.js`,
    relative: `${root}/test/fixtures/foo.spec.js`,
    absolute: `${root}/test/fixtures/foo.spec.js`,
  },
]

const config = {
  projectRoot: root,
  supportFile: '',
  isTextTerminal: true,
  devServerPublicPathRoute: root,
} as any as Cypress.ResolvedConfigOptions & Cypress.RuntimeConfigOptions

describe('#startDevServer', () => {
  it('serves specs via a webpack dev server', async () => {
    const { port, close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs,
        devServerEvents: new EventEmitter(),
      },
    })

    const response = await requestSpecFile(port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await close()
  })

  it('emits dev-server:compile:success event on successful compilation', async () => {
    const devServerEvents = new EventEmitter()
    const { close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs,
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

    exitSpy()

    // The initial compilation does not include the bad spec, so it will succeed.
    await once(devServerEvents, 'dev-server:compile:success')

    // Once we activate the bad spec however, it should fail.
    devServerEvents.emit('webpack-dev-server:request', badSpec)
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
        specs,
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
        specs,
        devServerEvents,
      },
      { webpackConfig },
    )

    const response = await requestSpecFile(port as number)

    expect(response).to.eq('const foo = () => {}\n')

    await close()
  })
})
.timeout(5000)
