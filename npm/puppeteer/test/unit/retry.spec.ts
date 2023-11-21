import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import { retry } from '../../src/plugin'

use(chaiAsPromised)
use(sinonChai)

describe('#retry', () => {
  it('returns result of passing 1st attempt', async () => {
    const fn = sinon.stub().returns('passes 1st attempt')
    const result = await retry(fn)

    expect(fn).to.be.calledOnce
    expect(result).to.equal('passes 1st attempt')
  })

  it('retries after delay and returns result of subsequent passing attempt', async () => {
    const fn = sinon.stub()

    fn.onFirstCall().throws('fail')
    fn.onSecondCall().returns('passes 2nd attempt')

    const result = await retry(fn, { delayBetweenTries: 1 })

    expect(fn).to.be.calledTwice
    expect(result).to.equal('passes 2nd attempt')
  })

  it('retries up to timeout and returns result of subsequent passing attempt', async () => {
    const fn = sinon.stub()

    fn.throws('fail')
    fn.onCall(5).returns('passes 5th attempt')

    const result = await retry(fn, { delayBetweenTries: 1 })

    expect(fn.callCount).to.equal(6)
    expect(result).to.equal('passes 5th attempt')
  })

  it('fails if function does not pass before timeout', async () => {
    const fn = sinon.stub().callsFake(() => {
      throw new Error('fail')
    })

    await expect(
      retry(fn, { timeout: 5, delayBetweenTries: 1 }),
    ).to.be.rejectedWith('Failed retrying after 5ms: fail')
  })
})
