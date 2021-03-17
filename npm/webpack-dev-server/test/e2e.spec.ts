import webpack from 'webpack'
import path from 'path'
import sinon from 'sinon'
import { expect } from 'chai'
import { EventEmitter } from 'events'
import http from 'http'
import fs from 'fs'

import { startDevServer } from '../'

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

const webpackConfig: webpack.Configuration = {
  output: {
    path: root,
    publicPath: root,
  },
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
  webpackDevServerPublicPathRoute: root,
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
        specs,
        devServerEvents,
      },
    })

    return new Promise((res) => {
      devServerEvents.on('dev-server:compile:success', () => {
        close(() => res())
      })
    })
  })

  it('emits dev-server:compile:error event on error compilation', async () => {
    const devServerEvents = new EventEmitter()

    const exitSpy = sinon.stub()

    const { close } = await startDevServer({
      webpackConfig,
      options: {
        config,
        specs: [
          {
            name: `${root}/test/fixtures/compilation-fails.spec.js`,
            relative: `${root}/test/fixtures/compilation-fails.spec.js`,
            absolute: `${root}/test/fixtures/compilation-fails.spec.js`,
          },
        ],
        devServerEvents,
      },
    }, exitSpy as any)

    exitSpy()

    return new Promise((res) => {
      devServerEvents.on('dev-server:compile:error', () => {
        expect(exitSpy.calledOnce).to.be.true
        close(() => res())
      })
    })
  })

  it('touches browser.js when a spec file is added', async function () {
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
      name: './some-newly-created-spec.js',
      relative: './some-newly-created-spec.js',
      absolute: '/some-newly-created-spec.js',
    }

    const oldmtime = fs.statSync('./dist/browser.js').mtimeMs

    return new Promise((res) => {
      devServerEvents.emit('dev-server:specs:changed', [newSpec])
      const updatedmtime = fs.statSync('./dist/browser.js').mtimeMs

      expect(oldmtime).to.not.equal(updatedmtime)
      close(() => res())
    })
  })
})
