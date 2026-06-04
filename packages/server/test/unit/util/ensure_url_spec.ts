import '../../spec_helper'

import { connect, agent } from '@packages/network'
import { isListening } from '../../../lib/util/ensure-url'
import sinon from 'sinon'
import nock from 'nock'

describe('lib/util/ensure-url', function () {
  context('.isListening', function () {
    it('resolves if a URL connects', function () {
      const stub = sinon.stub(connect, 'getAddress').withArgs(80, 'foo.bar.invalid').resolves()

      return isListening('http://foo.bar.invalid')
      .then(() => {
        expect(stub).to.be.calledOnce
      })
    })

    it(`rejects if a URL doesn't connect`, function () {
      const stub = sinon.stub(connect, 'getAddress').withArgs(80, 'foo.bar.invalid').rejects()

      return isListening('http://foo.bar.invalid')
      .then(() => {
        const err: any = new Error('should not reach this')

        err.fromTest = true
      })
      .catch((e) => {
        if (e.fromTest) {
          throw e
        }

        expect(stub).to.be.calledOnce
      })
    })
  })

  context('with a proxy', function () {
    beforeEach(function () {
      this.oldEnv = Object.assign({}, process.env)
    })

    afterEach(function () {
      process.env = this.oldEnv
    })

    it('calls into the agent to check availability', function () {
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://localhost:12345'
      process.env.NO_PROXY = ''

      sinon.stub(agent, 'addRequest').throws()

      nock.enableNetConnect()

      return isListening('http://foo.bar.invalid')
      .then(() => {
        throw new Error('should not succeed')
      })
      .catch(() => {
        expect(agent.addRequest).to.be.calledOnce
        expect(agent.addRequest).to.be.calledWithMatch(sinon.match.any, {
          href: 'http://foo.bar.invalid/',
        })
      })
    })

    it('connects directly for URLs excluded from the proxy via NO_PROXY', function () {
      // localhost is the component testing dev server and is excluded from the
      // proxy by default - it should be verified via a direct TCP connection
      // instead of being routed through the proxy (#27990)
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = 'http://localhost:12345'
      process.env.NO_PROXY = 'localhost,127.0.0.1,::1'

      const addRequest = sinon.stub(agent, 'addRequest').throws()
      const getAddress = sinon.stub(connect, 'getAddress').withArgs(8080, 'localhost').resolves()

      return isListening('http://localhost:8080')
      .then(() => {
        expect(getAddress).to.be.calledOnce
        expect(addRequest).not.to.be.called
      })
    })
  })
})
