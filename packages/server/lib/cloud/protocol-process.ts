import { ChildProcess, fork } from 'child_process'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { pathToFileURL } from 'url'
import { telemetry } from '@packages/telemetry'

const tsNodeEsm = pathToFileURL(require.resolve('ts-node/esm/transpile-only')).href

export class ProtocolProcess {
  _childProcess: ChildProcess
  _promises: {}

  constructor () {
    const span = telemetry.startSpan({ name: 'protocol:process:constructor' })

    this._promises = {}
    const args = []

    const env = _.omit(process.env, 'CYPRESS_INTERNAL_E2E_TESTING_SELF') || {}

    const options = {
      stdio: 'inherit',
      cwd: process.cwd(),
      env,
    }

    const tsNodeEsmLoader = `--experimental-specifier-resolution=node --loader ${tsNodeEsm}`

    if (options.env.NODE_OPTIONS) {
      options.env.NODE_OPTIONS += ` ${tsNodeEsmLoader}`
    } else {
      options.env.NODE_OPTIONS = tsNodeEsmLoader
    }

    this._childProcess = fork(path.resolve(__dirname, './protocol-child-process.ts'), args, options)

    this._childProcess.on('error', (err) => {
      console.log('childProcess error', err)
    })

    this._childProcess.on('message', (msg: { event: string, args: any[] }) => {
      // console.log('protocol:main:process', msg)

      this._promises[msg.event].resolve()
      delete this._promises[msg.event]
    })

    span?.end()
  }

  _send ({ event, args }) {
    const uuid = uuidv4()

    const promise = new Promise((resolve, reject) => {
      this._childProcess.send({ event, args, ack: uuid }, (error) => {
        if (error) {
          reject(error)
        }
      })

      this._promises[uuid] = { resolve, reject }

      //TODO add timeout
    })

    return promise
  }

  async ack () {
    const span = telemetry.startSpan({ name: 'protocol:ack' })

    return this._send({ event: 'setupProtocol', args: [] }).then(() => {
      span?.end()
    })
  }

  async setupProtocol (script: string, runId: string) {
    const span = telemetry.startSpan({ name: 'protocol:setupProtocol' })

    return this._send({ event: 'setupProtocol', args: [script, runId] }).then(() => {
      span?.end()
    })
  }

  async connectToBrowserProcess (hosts: string[], port: number, browserName: string, url?: string) {
    const span = telemetry.startSpan({ name: 'protocol:connectToBrowser' })

    return this._send({ event: 'connectToBrowserProcess2', args: [hosts, port, browserName, url] }).then(() => {
      span?.end()
    })
  }

  async connectToBrowser (cdpClient: CDPClient) {
    return Promise.resolve()
  }

  async addRunnables (runnables) {
    const span = telemetry.startSpan({ name: 'protocol:addRunnables' })

    return this._send({ event: 'addRunnables', args: [runnables] }).then(() => {
      span?.end()
    })
  }

  async beforeSpec (spec: { instanceId: string }) {
    const span = telemetry.startSpan({ name: 'protocol:beforeSpec' })

    return this._send({ event: 'beforeSpec', args: [spec] }).then(() => {
      span?.end()
    })
  }

  async afterSpec () {
    const span = telemetry.startSpan({ name: 'protocol:afterSpec' })

    return this._send({ event: 'afterSpec', args: [] }).then(() => {
      span?.end()
    })
  }

  async beforeTest (test: Record<string, any>) {
    telemetry.startSpan({ name: test.id, active: true })
    const span = telemetry.startSpan({ name: 'protocol:beforeTest' })

    return this._send({ event: 'beforeTest', args: [test] }).then(() => {
      span?.end()
    })
  }

  async afterTest (test: Record<string, any>) {
    const span = telemetry.startSpan({ name: 'protocol:afterTest' })

    return this._send({ event: 'afterTest', args: [test] }).then(() => {
      span?.end()
      telemetry.getSpan(test.id)?.end()
    })
  }

  async commandLogAdded (log: any) {
    const span = telemetry.startSpan({ name: 'protocol:commandLogAdded' })

    return this._send({ event: 'commandLogAdded', args: [log] }).then(() => {
      span?.end()
    })
  }

  async commandLogChanged (log: any) {
    const span = telemetry.startSpan({ name: 'protocol:commandLogChanged' })

    return this._send({ event: 'commandLogChanged', args: [log] }).then(() => {
      span?.end()
    })
  }

  async viewportChanged (input: any) {
    const span = telemetry.startSpan({ name: 'protocol:viewportChanged' })

    return this._send({ event: 'viewportChanged', args: [input] }).then(() => {
      span?.end()
    })
  }

  async urlChanged (input: any) {
    const span = telemetry.startSpan({ name: 'protocol:urlChanged' })

    return this._send({ event: 'urlChanged', args: [input] }).then(() => {
      span?.end()
    })
  }

  async pageLoading (input: any) {
    const span = telemetry.startSpan({ name: 'protocol:pageLoading' })

    return this._send({ event: 'pageLoading', args: [input] }).then(() => {
      span?.end()
    })
  }

  async resetTest (testId: string) {
    const span = telemetry.startSpan({ name: 'protocol:resetTest' })

    return this._send({ event: 'resetTest', args: [testId] }).then(() => {
      span?.end()
    })
  }

  async uploadCaptureArtifact (uploadUrl: string) {
    const span = telemetry.startSpan({ name: 'protocol:uploadCaptureArtifact' })

    return this._send({ event: 'uploadCaptureArtifact', args: [uploadUrl] }).then(() => {
      span?.end()
    })
  }

  async sendErrors (protocolErrors: ProtocolError[]) {
    const span = telemetry.startSpan({ name: 'protocol:sendErrors' })

    await this._send({ event: 'sendErrors', args: [protocolErrors] }).then(() => {
      span?.end()
    })
  }
}
