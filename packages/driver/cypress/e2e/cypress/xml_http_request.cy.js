import $XHR from '@packages/driver/src/cypress/xml_http_request'

describe('src/cypress/xml_http_request', () => {
  let xhr
  let $xhr

  beforeEach(() => {
    xhr = {
      id: '1',
      url: 'http://example.com',
      method: 'GET',
    }

    $xhr = $XHR.create(xhr)
  })

  context('._getFixtureError', () => {
    it('returns __error property on response body', () => {
      $xhr.response = {
        body: {
          __error: 'Something went wrong',
        },
      }

      const err = $xhr._getFixtureError()

      expect(err).to.equal('Something went wrong')
    })

    it('returns undefined if response does not exist', () => {
      const err = $xhr._getFixtureError()

      expect(err).to.be.undefined
    })

    it('returns undefined if response body does not exist', () => {
      $xhr.response = {}

      const err = $xhr._getFixtureError()

      expect(err).to.be.undefined
    })
  })
})
