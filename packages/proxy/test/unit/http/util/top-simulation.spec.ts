import { expect } from 'chai'
import sinon from 'sinon'
import { HttpMiddlewareThis } from '../../../../lib/http'
import { calculateSiteContext, doesTopNeedToBeSimulated } from '../../../../lib/http/util/top-simulation'

context('.doesTopNeedToBeSimulated', () => {
  const autUrl = 'http://localhost:8080'

  it('returns false when URL matches the AUT Url origin policy and the AUT Url exists', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: sinon.stub().returns(autUrl),
      remoteStates: {
        isPrimaryOrigin: sinon.stub().returns(true),
      },
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).to.be.false
  })

  it('returns false when AUT Url is  not defined, regardless of primary origin stack', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: sinon.stub().returns(undefined),
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).to.be.false
  })

  it('returns true when AUT Url is defined but AUT Url no longer matches the primary origin', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: sinon.stub().returns(autUrl),
      remoteStates: {
        isPrimaryOrigin: sinon.stub().returns(false),
      },
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).to.be.true
  })
})

context('.calculateSiteContext', () => {
  const autUrl = 'https://staging.google.com'

  it('calculates same-origin correctly for same-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google.com')).to.equal('same-origin')
  })

  it('calculates same-site correctly for cross-origin / same-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://app.google.com')).to.equal('same-site')
  })

  it('calculates cross-site correctly for cross-origin / cross-site urls', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google2.com')).to.equal('cross-site')
  })

  it('returns "none" if the interaction is triggered by the user, regardless of other properties', () => {
    expect(calculateSiteContext(autUrl, 'https://staging.google2.com', true)).to.equal('none')
  })
})
