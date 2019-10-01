import execa from 'execa'
import { expect } from 'chai'

const ERROR_MESSAGE = 'Setting the NODE_TLS_REJECT_UNAUTHORIZED'

const TLS_CONNECT = `require('tls').connect().on('error', ()=>{});`
const SUPPRESS_WARNING = `require('@packages/ts/register'); require('${__dirname}/../../lib/util/suppress_unauthorized_warning').suppress();`

describe('lib/util/suppress_unauthorized_warning', function () {
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
})
