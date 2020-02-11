import { register } from '@packages/web-config/node-jsdom-setup'

register({
  enzyme: require('enzyme'),
  EnzymeAdapter: require('enzyme-adapter-react-16'),
  chaiEnzyme: require('chai-enzyme'),
})

const sinon = require('sinon')

afterEach(() => {
  sinon.restore()
})
