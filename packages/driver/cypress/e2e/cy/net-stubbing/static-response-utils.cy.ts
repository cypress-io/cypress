const {
  getBackendStaticResponse,
} = require('../../../../src/cy/net-stubbing/static-response-utils')

describe('driver/src/cy/net-stubbing/static-response-utils', () => {
  describe('.getBackendStaticResponse', () => {
    describe('delay', () => {
      it('does not set delay when delay is not provided', () => {
        const staticResponse = getBackendStaticResponse({})

        expect(staticResponse).to.not.have.property('delay')
      })

      it('sets delay', () => {
        const staticResponse = getBackendStaticResponse({ delay: 200 })

        expect(staticResponse).to.have.property('delay', 200)
      })
    })

    describe('fixtures', () => {
      it('does not set fixtures data when fixtures string is not provided', () => {
        const staticResponse = getBackendStaticResponse({})

        expect(staticResponse).to.not.have.property('fixtures')
      })

      it('parses fixture string without file encoding', () => {
        const staticResponse = getBackendStaticResponse({ fixture: 'file.html' })

        expect(staticResponse.fixture).to.deep.equal({
          filePath: 'file.html',
          encoding: undefined,
        })
      })

      it('parses fixture string with file encoding', () => {
        const staticResponse = getBackendStaticResponse({ fixture: 'file.html,utf8' })

        expect(staticResponse.fixture).to.deep.equal({
          filePath: 'file.html',
          encoding: 'utf8',
        })
      })

      it('parses fixture string with file encoding set as null to indicate Buffer', () => {
        const staticResponse = getBackendStaticResponse({ fixture: 'file.html,null' })

        expect(staticResponse.fixture).to.deep.equal({
          filePath: 'file.html',
          encoding: null,
        })
      })
    })

    describe('body', () => {
      it('does not set body when body is undefined', () => {
        const staticResponse = getBackendStaticResponse({})

        expect(staticResponse).to.not.have.property('body')
      })

      it('sets body when body is provided as a string', () => {
        const staticResponse = getBackendStaticResponse({ body: 'body' })

        expect(staticResponse.body).to.eq('body')
      })

      it('sets body when body is provided as a ArrayBuffer', () => {
        const buffer = new ArrayBuffer(8)
        const staticResponse = getBackendStaticResponse({ body: buffer })

        expect(staticResponse.body).to.be.a('arraybuffer')
        expect(staticResponse.body).to.eq(buffer)
      })
    })
  })
})
