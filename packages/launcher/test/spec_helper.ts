import chai from 'chai'
import sinon from 'sinon'
import 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

afterEach(() => {
  sinon.restore()
})
