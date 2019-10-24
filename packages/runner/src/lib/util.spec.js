import util from './util'

describe('util', () => {
  context('b64DecodeUnicode', () => {
    it('decodes unicode string correctly', () => {
      // https://github.com/cypress-io/cypress/issues/5435
      const s = '🙂 привет 🌎'
      const encoded = Buffer.from(s).toString('base64')
      const decoded = util.b64DecodeUnicode(encoded)

      expect(decoded).to.equal(s)
    })
  })
})
