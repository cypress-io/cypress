import { expect } from 'chai'
import { requestedWithAndCredentialManager } from '../../../lib/util/requestedWithAndCredentialManager'

context('requestedWithAndCredentialManager Singleton', () => {
  beforeEach(() => {
    requestedWithAndCredentialManager.clear()
    requestedWithAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      requestedWith: 'xhr',
      credentialStatus: true,
    })

    requestedWithAndCredentialManager.set({
      url: 'www.foobar.com%2Ftest-request-2',
      requestedWith: 'fetch',
      credentialStatus: 'same-origin',
    })

    requestedWithAndCredentialManager.set({
      url: 'www.foobar.com/test-request-2',
      requestedWith: 'fetch',
      credentialStatus: 'include',
    })

    requestedWithAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      requestedWith: 'fetch',
      credentialStatus: 'omit',
    })

    requestedWithAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      requestedWith: 'fetch',
      credentialStatus: 'include',
    })
  })

  it('gets the first record out of the queue matching the absolute url and removes it', () => {
    expect(requestedWithAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      requestedWith: 'xhr',
      credentialStatus: true,
    })

    expect(requestedWithAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      requestedWith: 'fetch',
      credentialStatus: 'omit',
    })

    expect(requestedWithAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      requestedWith: 'fetch',
      credentialStatus: 'include',
    })

    // the default as no other records should exist in the map for this URL
    expect(requestedWithAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      requestedWith: 'xhr',
      credentialStatus: false,
    })
  })

  it('can locate a record hash even when the URL is encoded', () => {
    expect(requestedWithAndCredentialManager.get('www.foobar.com%2Ftest-request')).to.deep.equal({
      requestedWith: 'xhr',
      credentialStatus: true,
    })
  })

  it('applies defaults if a record cannot be found without a requestedWith', () => {
    expect(requestedWithAndCredentialManager.get('www.barbaz.com/test-request')).to.deep.equal({
      requestedWith: 'xhr',
      credentialStatus: false,
    })
  })

  it('applies defaults if a record cannot be found with a requestedWith', () => {
    expect(requestedWithAndCredentialManager.get('www.barbaz.com/test-request', 'xhr')).to.deep.equal({
      requestedWith: 'xhr',
      credentialStatus: false,
    })

    expect(requestedWithAndCredentialManager.get('www.barbaz.com/test-request', 'fetch')).to.deep.equal({
      requestedWith: 'fetch',
      credentialStatus: 'same-origin',
    })
  })
})
