import { expect } from 'chai'
import { resourceTypeAndCredentialManager } from '../../../lib/util/resourceTypeAndCredentialManager'

context('resourceTypeAndCredentialManager Singleton', () => {
  beforeEach(() => {
    resourceTypeAndCredentialManager.clear()
    resourceTypeAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      resourceType: 'xhr',
      credentialStatus: true,
    })

    resourceTypeAndCredentialManager.set({
      url: 'www.foobar.com%2Ftest-request-2',
      resourceType: 'fetch',
      credentialStatus: 'same-origin',
    })

    resourceTypeAndCredentialManager.set({
      url: 'www.foobar.com/test-request-2',
      resourceType: 'fetch',
      credentialStatus: 'include',
    })

    resourceTypeAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      resourceType: 'fetch',
      credentialStatus: 'omit',
    })

    resourceTypeAndCredentialManager.set({
      url: 'www.foobar.com/test-request',
      resourceType: 'fetch',
      credentialStatus: 'include',
    })
  })

  it('gets the first record out of the queue matching the absolute url and removes it', () => {
    expect(resourceTypeAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      resourceType: 'xhr',
      credentialStatus: true,
    })

    expect(resourceTypeAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      resourceType: 'fetch',
      credentialStatus: 'omit',
    })

    expect(resourceTypeAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      resourceType: 'fetch',
      credentialStatus: 'include',
    })

    // the default as no other records should exist in the map for this URL
    expect(resourceTypeAndCredentialManager.get('www.foobar.com/test-request')).to.deep.equal({
      resourceType: 'xhr',
      credentialStatus: false,
    })
  })

  it('can locate a record hash even when the URL is encoded', () => {
    expect(resourceTypeAndCredentialManager.get('www.foobar.com%2Ftest-request')).to.deep.equal({
      resourceType: 'xhr',
      credentialStatus: true,
    })
  })

  it('applies defaults if a record cannot be found without a resourceType', () => {
    expect(resourceTypeAndCredentialManager.get('www.barbaz.com/test-request')).to.deep.equal({
      resourceType: 'xhr',
      credentialStatus: false,
    })
  })

  it('applies defaults if a record cannot be found with a resourceType', () => {
    expect(resourceTypeAndCredentialManager.get('www.barbaz.com/test-request', 'xhr')).to.deep.equal({
      resourceType: 'xhr',
      credentialStatus: false,
    })

    expect(resourceTypeAndCredentialManager.get('www.barbaz.com/test-request', 'fetch')).to.deep.equal({
      resourceType: 'fetch',
      credentialStatus: 'same-origin',
    })
  })
})
