import { returnMockRequire, register } from '@packages/web-config/node-jsdom-setup'

register({
  enzyme: require('enzyme'),
  EnzymeAdapter: require('enzyme-adapter-react-16'),
  chaiEnzyme: require('chai-enzyme'),
})

const sinon = require('sinon')

const driver = returnMockRequire('@packages/driver')
const io = returnMockRequire('@packages/socket/lib/browser', { client: {} })

io.client.connect = sinon.stub().returns({ emit: () => {}, on: () => {} })

const _useFakeTimers = sinon.useFakeTimers
let timers = []

sinon.useFakeTimers = function (...args) {

  const ret = _useFakeTimers.apply(this, args)

  timers.push(ret)
}

beforeEach(() => {
  driver.$ = sinon.stub().throws('$ called without being stubbed')
})

afterEach(() => {
  timers.forEach((clock) => {
    return clock.restore()
  })
  timers = []
})
