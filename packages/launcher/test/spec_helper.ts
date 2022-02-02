import chai from 'chai'
import sinon from 'sinon'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

require('chai')
.use(require('sinon-chai'))
.use(require('chai-as-promised'))

afterEach(() => {
  sinon.restore()
})
