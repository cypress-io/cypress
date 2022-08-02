import '../../spec_helper'
import { expect } from 'chai'
import execa from 'execa'
import proxyquire from 'proxyquire'

const ERROR_MESSAGE = 'Setting the NODE_TLS_REJECT_UNAUTHORIZED'

const TLS_CONNECT = `require('tls').connect('5000').on('error', ()=>{});`
const SUPPRESS_WARNING = `require('${__dirname}/../../../lib/util/suppress_warnings').suppress();`

describe('lib/util/suppress_warnings', function () {
  it('tls.connect emits warning if NODE_TLS_REJECT_UNAUTHORIZED=0 and not suppressed', function () {
    return execa.shell(`node -e "${TLS_CONNECT}"`, {
      env: {
        'NODE_TLS_REJECT_UNAUTHORIZED': '0',
      },
    })
    .then(({ stderr }) => {
      expect(stderr).to.contain(ERROR_MESSAGE)
    })
  })

  it('tls.connect does not emit warning if NODE_TLS_REJECT_UNAUTHORIZED=0 and suppressed', function () {
    // test 2 sequential tls.connects
    return execa.shell(`node -e "${SUPPRESS_WARNING} ${TLS_CONNECT} ${TLS_CONNECT}"`, {
      env: {
        'NODE_TLS_REJECT_UNAUTHORIZED': '0',
      },
    })
    .then(({ stderr }) => {
      expect(stderr).to.not.contain(ERROR_MESSAGE)
    })
  })

  it('does not emit buffer deprecation warnings', () => {
    const emitWarning = sinon.spy(process, 'emitWarning')

    // force typescript to always be non-requireable
    const { suppress } = proxyquire('../../../lib/util/suppress_warnings', {})

    suppress()

    // eslint-disable-next-line no-buffer-constructor
    new Buffer(0)
    // eslint-disable-next-line no-buffer-constructor
    new Buffer('asdf')

    expect(emitWarning).not.to.be.called
  })
})
