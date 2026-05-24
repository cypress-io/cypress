import '../../spec_helper'
import { expect } from 'chai'
import proxyquire from 'proxyquire'

const TLS_WARNING = 'Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to \'0\' makes TLS connections and HTTPS requests insecure by disabling certificate verification.'

describe('lib/util/suppress_warnings', function () {
  it('passes through non-TLS warnings when suppressed', () => {
    const emitWarning = sinon.spy(process, 'emitWarning')
    const { suppress } = proxyquire('../../../lib/util/suppress_warnings', {})

    suppress()
    process.emitWarning('some unrelated warning')

    expect(emitWarning).to.be.calledOnce
  })

  it('suppresses NODE_TLS_REJECT_UNAUTHORIZED warnings', () => {
    const emitWarning = sinon.spy(process, 'emitWarning')
    const { suppress } = proxyquire('../../../lib/util/suppress_warnings', {})

    suppress()
    process.emitWarning(TLS_WARNING)
    process.emitWarning(TLS_WARNING)

    expect(emitWarning).not.to.be.called
  })

  it('does not emit buffer deprecation warnings', () => {
    const emitWarning = sinon.spy(process, 'emitWarning')

    // force typescript to always be non-requireable
    const { suppress } = proxyquire('../../../lib/util/suppress_warnings', {})

    suppress()

    new Buffer(0)

    new Buffer('asdf')

    expect(emitWarning).not.to.be.called
  })
})
