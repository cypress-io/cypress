import { register, returnMockRequire } from '@packages/web-config/node-jsdom-setup'
import sinon from 'sinon'

// import scss files will break mocha tests
// if we do not add this
import mochaIgnoreStyles from 'ignore-styles'

mochaIgnoreStyles(['.scss'])

const driverMock = {}

// allows use of JSX
register({
  enzyme: require('enzyme'),
  EnzymeAdapter: require('enzyme-adapter-react-16'),
  chaiEnzyme: require('chai-enzyme'),
  requireOverride (depPath) {
    if (depPath === '@packages/driver') {
      return driverMock
    }
  },
})

// ensure that mocha exits after all tests pass
const io = returnMockRequire('@packages/socket/lib/browser', { client: {} })

io.client.connect = sinon.stub().returns({ emit: () => {}, on: () => {} })

// setup fake timers to make the tests faster
const _useFakeTimers = sinon.useFakeTimers
let timers = []

sinon.useFakeTimers = function (...args) {
  const ret = _useFakeTimers.apply(this, args)

  timers.push(ret)
}

beforeEach(() => {
  driverMock.$ = sinon.stub().throws('$ called without being stubbed')
})

afterEach(() => {
  timers.forEach((clock) => {
    return clock.restore()
  })

  timers = []
})
