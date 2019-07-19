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

beforeEach(() => {
  driver.$ = sinon.stub().throws('$ called without being stubbed')
  io.connect.throws('connect called without being stubbed')
})

afterEach(() => {
  sinon.restore()
})
